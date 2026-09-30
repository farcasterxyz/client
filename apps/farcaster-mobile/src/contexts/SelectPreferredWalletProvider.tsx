import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  MWPWalletType,
  mwpWalletTypes,
  useEmbeddedWallet,
  useWalletGeoRestricted,
  Wallet,
  WALLET_CONFIGS,
  WalletTypeWithoutCoinbase,
} from 'farcaster-expo';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, View } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

import {
  BottomSheetContentContainer,
  BottomSheetHeader,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { ButtonV2 } from '~/components/ButtonV2';
import {
  PreferredWalletButtonGroup,
  PreferredWalletButtonGroupProps,
} from '~/components/PreferredWalletButtonGroup';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { normalizePreferredWallet } from '~/utils/wallet/normalizePreferredWallet';

import { useMWPWallet } from './MWPWalletProvider';

type SelectPreferredWalletContextValue = {
  preferredWallet: Wallet;
  preferredWalletType: WalletTypeWithoutCoinbase | undefined;
  setPreferredWallet: (
    walletType: WalletTypeWithoutCoinbase | undefined,
  ) => Promise<void>;
  selectPreferredWallet: () => Promise<Wallet>;
  updatePreferredWallet: (
    walletType: WalletTypeWithoutCoinbase | undefined,
  ) => Promise<Wallet>;
};

const SelectPreferredWalletContext =
  createContext<SelectPreferredWalletContextValue>({
    preferredWallet: {} as Wallet,
    preferredWalletType: undefined,
    setPreferredWallet: () => {
      throw new Error(
        'Must be called within SelectPreferredWalletContext provider',
      );
    },
    selectPreferredWallet: () => {
      throw new Error(
        'Must be called within SelectPreferredWalletContext provider',
      );
    },
    updatePreferredWallet: () => {
      throw new Error(
        'Must be called within SelectPreferredWalletContext provider',
      );
    },
  });

export const useSelectPreferredWallet = () =>
  useContext(SelectPreferredWalletContext);

function useGetWalletFromDisk(): [
  WalletTypeWithoutCoinbase | undefined,
  (value: WalletTypeWithoutCoinbase | undefined) => void,
] {
  const geoRestricted = useWalletGeoRestricted();
  const isGeoRestricted = geoRestricted === true; // treat undefined as not restricted
  const { trackEvent } = useAnalytics();
  const [rawPreferred, setRawPreferred] = useMMKVString('preferredWallet');
  const [isRainbowInstalled, setIsRainbowInstalled] = useState<
    boolean | undefined
  >(undefined);

  // Check if Rainbow wallet is installed
  useEffect(() => {
    Linking.canOpenURL('rainbow://')
      .then(setIsRainbowInstalled)
      .catch(() => setIsRainbowInstalled(false));
  }, []);

  const normalized = useMemo(
    () =>
      normalizePreferredWallet(rawPreferred, {
        installability: {
          warpcast: !isGeoRestricted,

          // By default, we assume Rainbow can be installed, otherwise state would cause remapping unnecessrily
          rainbow: isRainbowInstalled ?? true,
          coinbase: false,
        },
      }),
    [rawPreferred, isGeoRestricted, isRainbowInstalled],
  );

  // Sync back to storage if normalization changed the value.
  useEffect(() => {
    if (normalized !== rawPreferred) {
      trackEvent(AnalyticsEvent.RemappedWallet, {
        from: rawPreferred ?? 'none',
        to: normalized ?? 'none',
        reason: isGeoRestricted ? 'geo_restricted' : 'other',
      });

      setRawPreferred(normalized);
    }
  }, [normalized, rawPreferred, setRawPreferred, trackEvent, isGeoRestricted]);

  const setPreferredSafe = useCallback(
    (value: WalletTypeWithoutCoinbase | undefined) => {
      const next = normalizePreferredWallet(value, {
        installability: {
          warpcast: !isGeoRestricted,
          rainbow: isRainbowInstalled ?? true,
          coinbase: false,
        },
      });
      setRawPreferred(next);
    },
    [isGeoRestricted, isRainbowInstalled, setRawPreferred],
  );

  useDebugValue(normalized);

  return [normalized, setPreferredSafe];
}

/**
 * Contains UI flows for selecting a preferred wallet.
 *
 * This provider is separate from the root provider so it can be rendered in
 * multiple places when a global bottom sheet modal will not suffice (e.g.
 * Frame v2 modal).
 */
export function SelectPreferredWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  const selectModal = useBottomSheetModalRef();
  const relaunchModal = useBottomSheetModalRef();
  const { setUserProperties } = useAnalytics();

  const mwpWallet = useMWPWallet();
  const embeddedWallet = useEmbeddedWallet();
  const [preferredWalletType, setPreferredWalletType] = useGetWalletFromDisk();

  const preferredWallet: Wallet = useMemo(() => {
    if (preferredWalletType === 'warpcast') {
      return {
        ...embeddedWallet,
        provider: embeddedWallet.evmMiniAppProvider,
        address: embeddedWallet.miniAppEvmAddress,
        name: 'Farcaster' as const,
        type: 'warpcast' as const,
        isInitialized: true,
        connectionContextRef: embeddedWallet.connectionContextRef,
      };
    }

    return mwpWallet;
  }, [preferredWalletType, embeddedWallet, mwpWallet]);

  const updatePreferredWallet = useCallback(
    async (newWalletType: WalletTypeWithoutCoinbase | undefined) => {
      if (preferredWalletType === newWalletType) {
        return preferredWallet;
      }

      try {
        if (preferredWallet.isInitialized) {
          await preferredWallet.disconnect();
        }

        if (!newWalletType) {
          setPreferredWalletType(undefined);
          return mwpWallet;
        }

        const newWallet: Wallet =
          newWalletType === 'warpcast'
            ? {
                ...embeddedWallet,
                provider: embeddedWallet.evmMiniAppProvider,
                address: embeddedWallet.miniAppEvmAddress,
                name: 'Farcaster' as const,
                type: 'warpcast' as const,
                isInitialized: true,
                connectionContextRef: embeddedWallet.connectionContextRef,
              }
            : mwpWallet;
        const config = WALLET_CONFIGS[newWalletType];
        newWallet.initialize?.(config);
        setPreferredWalletType(newWalletType);
        return newWallet;
      } catch (e) {
        setPreferredWalletType(undefined);
        throw e;
      }
    },
    [
      mwpWallet,
      preferredWalletType,
      setPreferredWalletType,
      preferredWallet,
      embeddedWallet,
    ],
  );

  const selectPromiseCallbacks = useRef<{
    resolve: (walletType: Wallet) => void;
    reject: (e: Error) => void;
  }>(undefined);

  const setPreferredWalletBottomSheet = useCallback(
    async (newPreferredWallet: WalletTypeWithoutCoinbase) => {
      if (preferredWalletType === newPreferredWallet) {
        return;
      }

      const newWallet = await updatePreferredWallet(newPreferredWallet);

      return new Promise((resolve) => {
        // hack to cover case where conflicting animation prevents
        // bottom sheet from dismissing
        setTimeout(() => {
          selectModal.current?.forceClose();
        }, 15);

        // MWP wallets use a singleton pattern right and require a restart when changed
        if (
          preferredWalletType &&
          mwpWalletTypes.includes(newPreferredWallet as MWPWalletType) &&
          mwpWalletTypes.includes(preferredWalletType as MWPWalletType)
        ) {
          // wait for the select modal to have closed before opening this one
          setTimeout(() => {
            relaunchModal.current?.present();
          }, 300);
        }

        // wait for bottom sheet to close before resolving
        setTimeout(() => {
          selectPromiseCallbacks.current?.resolve(newWallet);
          resolve(newPreferredWallet);
        }, 300);
      });
    },
    [preferredWalletType, updatePreferredWallet, selectModal, relaunchModal],
  );

  const setPreferredWallet = useCallback(
    async (newPreferredWallet: WalletTypeWithoutCoinbase | undefined) => {
      if (preferredWalletType === newPreferredWallet) {
        return;
      }

      // MWP wallets use a singleton pattern right and require a restart when changed
      if (
        preferredWalletType &&
        mwpWalletTypes.includes(newPreferredWallet as MWPWalletType) &&
        mwpWalletTypes.includes(preferredWalletType as MWPWalletType)
      ) {
        relaunchModal.current?.present();
      }

      await updatePreferredWallet(newPreferredWallet);
      return;
    },
    [preferredWalletType, updatePreferredWallet, relaunchModal],
  );

  const selectPreferredWallet = useCallback(() => {
    return new Promise<Wallet>((resolve, reject) => {
      selectModal.current?.present();
      selectPromiseCallbacks.current = {
        resolve,
        reject,
      };
    });
  }, [selectModal]);

  useEffect(() => {
    if (preferredWalletType) {
      setUserProperties({ transactingWallet: preferredWalletType });
    }
  }, [preferredWalletType, setUserProperties]);

  const contextValue = useMemo(
    () => ({
      preferredWalletType,
      preferredWallet,
      setPreferredWallet,
      selectPreferredWallet,
      updatePreferredWallet,
    }),
    [
      preferredWalletType,
      preferredWallet,
      selectPreferredWallet,
      setPreferredWallet,
      updatePreferredWallet,
    ],
  );

  return (
    <SelectPreferredWalletContext.Provider value={contextValue}>
      {children}
      <BottomSheetModal name="choosePreferredWallet" ref={selectModal}>
        <SelectPreferredWalletBottomSheet
          preferredWallet={preferredWalletType}
          onSelect={setPreferredWalletBottomSheet}
        />
      </BottomSheetModal>
      <BottomSheetModal name="relaunchWarpcast" ref={relaunchModal}>
        <RelaunchWarpcastBottomSheet
          onConfirm={() => {
            relaunchModal.current?.forceClose();
          }}
        />
      </BottomSheetModal>
    </SelectPreferredWalletContext.Provider>
  );
}

function SelectPreferredWalletBottomSheet(
  props: PreferredWalletButtonGroupProps,
) {
  return (
    <BottomSheetContentContainer>
      <BottomSheetHeader title="Choose your wallet" />
      <PreferredWalletButtonGroup {...props} />
    </BottomSheetContentContainer>
  );
}

export function RelaunchWarpcastBottomSheet({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  const t = useTheme();

  return (
    <BottomSheetContentContainer>
      <BottomSheetHeader
        Icon={<Octicons name="sync" size={24} color="#8565cb" />}
        iconBgColor="purple"
        title="Relaunch Farcaster"
      />

      <View style={[t.mB5]}>
        <Text2>To apply your changes, please close and reopen the app.</Text2>
      </View>

      <ButtonV2 title="Continue" onPress={onConfirm} />
    </BottomSheetContentContainer>
  );
}
