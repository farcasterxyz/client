import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { AppError } from 'farcaster-client-data';
import { FailedToRestoreWalletError } from 'farcaster-client-hooks';
import {
  completePasskeyRegistration,
  getKeyTransport,
  getStoredPasskeys,
  isPasskeysSupported,
} from 'farcaster-cryptography';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { InteractionManager, Platform } from 'react-native';
import { bytesToHex, type Hex, withRetry } from 'viem';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import {
  authTokenKey,
  missingPrivateKeyOrMnemonicStorageKey,
  mnemonicStorageKey,
  privateKeyV1StorageKey,
  privateKeyV2StorageKey,
  walletAddressKey,
} from '~/constants/Storage';
import {
  createMnemonicWallet,
  HDAccountWithMnemonic,
  LocalAccountWithMnemonic,
  optimizedToAccountWithMnemonic,
  toLocalAccountWithMnemonic,
} from '~/modules/farcaster-crypto';
import {
  PrivateKeyOrMnemonicMissingError,
  SignOutListenerError,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from '~/utils/SecureStorageUtils';
import { getItem, setItem } from '~/utils/StorageUtils';

import { useDebugCryptography } from './DebugCryptographyProvider';
import { useFarcasterAsyncDataStore } from './FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from './FarcasterCryptographyKeyStoreProvider';

type Wallet = LocalAccountWithMnemonic;

type WalletRestoreParams = {
  has_private_key: boolean;
  has_mnemonic: boolean;
  has_wallet_address: boolean;
  // Masked diagnostic only — never real key material.
  private_key_masked: string;
  mnemonic_word_count: number;
};

type WalletContext = {
  address: string | undefined;
  generateWallet: () => Promise<unknown>;
  preGenerateWallet: () => void;
  importWallet: (walletToImport: HDAccountWithMnemonic) => Promise<Wallet>;
  clearWallet: () => Promise<void>;
  account: Wallet | undefined;
  isInitialized: boolean;
  walletRestoreParams: WalletRestoreParams | undefined;
};

const WalletContext = createContext<WalletContext>({} as never);

type MissingPrivateKeyOrMnemonicEntry = {
  missingMnemonicCount: number;
  missingPrivateKeyCount: number;
};

// NEYN-13180 diagnostics: describe secret key material for telemetry without
// leaking it — only presence and shape (length / word count) are reported.
const maskSecret = (value: string | undefined): string =>
  value ? `present (len ${value.length})` : 'missing';

const mnemonicWordCount = (mnemonic: string | undefined): number => {
  const trimmed = mnemonic?.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
};

const buildWalletRestoreParams = ({
  privateKey,
  mnemonic,
  address,
}: {
  privateKey: string | undefined;
  mnemonic: string | undefined;
  address: string | undefined;
}): WalletRestoreParams => ({
  has_private_key: !!privateKey,
  has_mnemonic: !!mnemonic?.trim(),
  has_wallet_address: !!address,
  private_key_masked: maskSecret(privateKey),
  mnemonic_word_count: mnemonicWordCount(mnemonic),
});

type WalletProviderProps = {
  children: ReactNode;
};

const WalletProvider: FC<WalletProviderProps> = memo(({ children }) => {
  // Both refs must be declared before any conditional returns (Rules of Hooks).
  const mountedRef = React.useRef(false);
  const stopRumActionRef = React.useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'WalletProvider',
    });
  }
  const [isInitialized, setIsInitialized] = useState(false);
  const [wallet, setWallet] = useState<LocalAccountWithMnemonic>();
  const [walletRestoreParams, setWalletRestoreParams] =
    useState<WalletRestoreParams>();

  const { dataStore } = useFarcasterAsyncDataStore();
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const { addCryptographyLog } = useDebugCryptography();

  // Opportunistic backfill: write mnemonic to iCloud Keychain for any stored
  // passkeys that don't have it yet. This ensures discovery sign-in works
  // even after iOS 26.4 broke largeBlob.
  const backfillPasskeyMnemonics = useCallback(
    async (mnemonic: string, walletAddress: string) => {
      try {
        const supported = await isPasskeysSupported({ keyStore });
        if (!supported) return;

        const storedPasskeys = await getStoredPasskeys({ keyStore });
        if (storedPasskeys.length === 0) return;

        for (const passkey of storedPasskeys) {
          if (passkey.address !== walletAddress) continue;
          await completePasskeyRegistration({
            keyStore,
            credentialId: passkey.credentialId,
            mnemonic,
          }).catch(() => {
            // Silently ignore — backfill is best-effort
          });
        }
      } catch {
        // Silently ignore — backfill is best-effort
      }
    },
    [keyStore],
  );

  const importWallet = useCallback(
    async (walletToImport: HDAccountWithMnemonic) => {
      const pk = walletToImport.getHdKey().privateKey;
      if (pk === null) {
        throw new AppError('Unexpected null private key', {
          name: 'UnexpectedNullPrivateKeyError',
        });
      }

      const privateKeyHex = bytesToHex(pk);

      await Promise.all([
        setSecureItem({
          key: privateKeyV2StorageKey,
          value: privateKeyHex,
        }),
        setSecureItem({
          key: mnemonicStorageKey,
          value: walletToImport.mnemonic,
        }),
        setSecureItem({
          key: walletAddressKey,
          value: walletToImport.address,
        }),
      ]);

      setOptimisticallyGeneratedNewWallet(undefined);
      setWallet(walletToImport);
      setWalletRestoreParams(
        buildWalletRestoreParams({
          privateKey: privateKeyHex,
          mnemonic: walletToImport.mnemonic,
          address: walletToImport.address,
        }),
      );

      // Repair passkey Keychain entries for this account on every sign-in,
      // not just app launch. This fixes corrupted entries from the v524 bug
      // where all passkeys were overwritten with a single account's mnemonic.
      // iOS only — Android doesn't need this (mnemonics persist in
      // SharedPreferences), and addMnemonicToCredential triggers an
      // interactive Credential Manager prompt on Android.
      if (Platform.OS === 'ios') {
        InteractionManager.runAfterInteractions(() => {
          backfillPasskeyMnemonics(
            walletToImport.mnemonic,
            walletToImport.address,
          );
        });
      }

      return walletToImport;
    },
    [backfillPasskeyMnemonics],
  );

  const [
    optimisticallyGeneratedNewWallet,
    setOptimisticallyGeneratedNewWallet,
  ] = useState<HDAccountWithMnemonic | undefined>(undefined);

  const isPregenerating = React.useRef(false);
  const preGenerateWallet = React.useCallback(() => {
    if (!optimisticallyGeneratedNewWallet && !isPregenerating.current) {
      isPregenerating.current = true;
      // Despite using InteractionManager this is so heavy that entire JS
      // thread gets blocked and the screen doesn't re-render during this.
      // Ideally we can move this off the UI thread but since it only happens
      // on an initial app load it's not a huge problem.
      InteractionManager.runAfterInteractions(async () => {
        const wallet = await createMnemonicWallet();
        setOptimisticallyGeneratedNewWallet(wallet);
        isPregenerating.current = false;
      });
    }
  }, [optimisticallyGeneratedNewWallet]);

  const generateWallet = useCallback(async (): Promise<Wallet> => {
    const newWallet =
      typeof optimisticallyGeneratedNewWallet !== 'undefined'
        ? optimisticallyGeneratedNewWallet
        : await createMnemonicWallet();

    setOptimisticallyGeneratedNewWallet(undefined);

    return importWallet(newWallet);
  }, [importWallet, optimisticallyGeneratedNewWallet]);

  const clearWallet = useCallback(async () => {
    if (!wallet) {
      return;
    }

    addCryptographyLog('Signing out');

    try {
      addCryptographyLog('Resetting key transport');
      const transport = await getKeyTransport({
        keyStore,
        dataStore,
      });
      await transport.resetKeyTransport();
      addCryptographyLog('Reset key transport');
    } catch (error) {
      trackError(new SignOutListenerError({ error }));
    }

    setWallet(undefined);
    setOptimisticallyGeneratedNewWallet(undefined);
    // Clear to undefined (not an all-false object) so SessionBreadcrumbs waits
    // for a real secure-storage check / importWallet before emitting. Otherwise
    // a same-session re-sign-in can fire false "missing keys" while import is
    // still in flight and then get stuck by the per-fid dedupe.
    setWalletRestoreParams(undefined);

    await deleteSecureItem(privateKeyV1StorageKey);
    await deleteSecureItem(privateKeyV2StorageKey);
    await deleteSecureItem(mnemonicStorageKey);
    await deleteSecureItem(walletAddressKey);
    await deleteSecureItem(authTokenKey);
  }, [addCryptographyLog, dataStore, keyStore, wallet]);

  // Initialize wallet state from secure storage
  useEffect(() => {
    void withRetry(
      async () => {
        try {
          const [persistedPrivateKey, persistedMnemonic, persistedAddress] =
            await Promise.all([
              getSecureItem<string | undefined>({
                key: privateKeyV2StorageKey,
                fallback: undefined,
              }),
              getSecureItem<string | undefined>({
                key: mnemonicStorageKey,
                fallback: undefined,
              }),
              getSecureItem<string | undefined>({
                key: walletAddressKey,
                fallback: undefined,
              }),
            ]);

          setWalletRestoreParams(
            buildWalletRestoreParams({
              privateKey: persistedPrivateKey,
              mnemonic: persistedMnemonic,
              address: persistedAddress,
            }),
          );

          if (persistedPrivateKey && persistedMnemonic) {
            let walletAddress: string;
            if (!persistedAddress) {
              const restoredWallet = await toLocalAccountWithMnemonic({
                mnemonic: persistedMnemonic,
                privateKey: persistedPrivateKey as Hex,
              });

              await setSecureItem({
                key: walletAddressKey,
                value: restoredWallet.address,
              });

              setOptimisticallyGeneratedNewWallet(undefined);
              setWallet(restoredWallet);
              walletAddress = restoredWallet.address;
            } else {
              const restoredWallet = await optimizedToAccountWithMnemonic({
                address: persistedAddress as Hex,
                mnemonic: persistedMnemonic,
                privateKey: persistedPrivateKey as Hex,
              });

              setOptimisticallyGeneratedNewWallet(undefined);
              setWallet(restoredWallet);
              walletAddress = restoredWallet.address;
            }

            // Fire-and-forget: backfill passkey mnemonics to iCloud Keychain.
            // iOS only — Android already stores mnemonics in SharedPreferences
            // during initial passkey creation, and addMnemonicToCredential
            // triggers an interactive Credential Manager prompt.
            if (Platform.OS === 'ios') {
              InteractionManager.runAfterInteractions(() => {
                backfillPasskeyMnemonics(persistedMnemonic, walletAddress);
              });
            }
          } else if (
            (persistedPrivateKey && !persistedMnemonic) ||
            (!persistedPrivateKey && persistedMnemonic)
          ) {
            const missingPrivateKeyOrMnemonicEntry =
              await getItem<MissingPrivateKeyOrMnemonicEntry>({
                key: missingPrivateKeyOrMnemonicStorageKey,
                fallback: {
                  missingMnemonicCount: 0,
                  missingPrivateKeyCount: 0,
                },
              });

            if (!persistedMnemonic) {
              missingPrivateKeyOrMnemonicEntry.missingMnemonicCount++;
            }
            if (!persistedPrivateKey) {
              missingPrivateKeyOrMnemonicEntry.missingPrivateKeyCount++;
            }

            setItem({
              key: missingPrivateKeyOrMnemonicStorageKey,
              value: missingPrivateKeyOrMnemonicEntry,
            });

            trackError(
              new PrivateKeyOrMnemonicMissingError(
                missingPrivateKeyOrMnemonicEntry,
              ),
            );
          }
        } finally {
          setIsInitialized(true);
        }
      },
      {
        retryCount: 1,
        delay: 500,
      },
    ).catch((err) => {
      trackError(err);
      trackError(new FailedToRestoreWalletError(err));
    });
  }, [importWallet, backfillPasskeyMnemonics]);

  const value = useMemo(
    () => ({
      address: wallet?.address,
      generateWallet,
      preGenerateWallet,
      importWallet,
      clearWallet,
      wallet,
      account: wallet,
      isInitialized,
      walletRestoreParams,
    }),
    [
      generateWallet,
      importWallet,
      clearWallet,
      wallet,
      isInitialized,
      walletRestoreParams,
      preGenerateWallet,
    ],
  );

  if (!isInitialized) {
    return <FullScreenLoadingIndicator debugName="WalletProvider" />;
  }

  if (!stopRumActionRef.current) {
    stopRumActionRef.current = true;
    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'WalletProvider',
    });
  }

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
});

const useWallet = () => useContext(WalletContext);

WalletProvider.displayName = 'WalletProvider';

export { useWallet, WalletProvider };
