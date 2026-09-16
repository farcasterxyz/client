import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setStringAsync } from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import { useCreateRecovery } from 'farcaster-client-hooks';
import {
  deleteStoredPasskey,
  isPasskeysSupported,
  StoredPasskey,
} from 'farcaster-cryptography';
import { ButtonV2 } from 'farcaster-expo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useRecoveryStore } from '~/contexts/RecoveryStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePop } from '~/hooks/navigation/usePop';
import { useSyncHeaderDisableCancel } from '~/hooks/navigation/useSyncHeaderDisableCancel';
import {
  createMnemonicWallet,
  HDAccountWithMnemonic,
} from '~/modules/farcaster-crypto';
import { RecoveryStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { normalizeAddress, normalizeEmail } from '~/utils/RecoveryTelemetry';

type RecoveryBackupRecoveryPhraseProps = NativeStackScreenProps<
  RecoveryStackParamList,
  'RecoveryBackupRecoveryPhrase'
>;

function RecoveryBackupRecoveryPhrase({
  route,
}: RecoveryBackupRecoveryPhraseProps) {
  const { totpToken, token, email } = route.params;

  const t = useTheme();
  const toast = useToast();
  const pop = usePop();
  const { trackEvent } = useAnalytics();
  const { importWallet, clearWallet, address } = useWallet();
  const { keyStore } = useFarcasterCryptographyKeyStore();

  const navigate = useNavigate();
  const createRecovery = useCreateRecovery();
  const { storeRecovery, reset } = useRecoveryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingWallet, setPendingWallet] =
    useState<HDAccountWithMnemonic | null>(null);
  const hasInitiatedGeneration = useRef(false);
  const recoveryAccountPasskeysRef = useRef<StoredPasskey[]>([]);
  const clipboardClearTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (clipboardClearTimer.current) {
        clearTimeout(clipboardClearTimer.current);
        clipboardClearTimer.current = null;
      }
    };
  }, []);

  useSyncHeaderDisableCancel(!pendingWallet);

  useEffect(() => {
    if (hasInitiatedGeneration.current) {
      return;
    }
    hasInitiatedGeneration.current = true;

    trackEvent(AnalyticsOnlyEvent.RecoveryPhraseShown, {
      token_present: !!token,
    });

    InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const supported = await isPasskeysSupported({ keyStore });
          if (supported && address) {
            // Raw keystore list (not the address-de-duplicated wrapper) so we
            // capture every entry for the old custody, even if it has more than
            // one passkey.
            const passkeysBeforeClear = await keyStore.getStoredPasskeys();
            // Capture ONLY the passkey(s) for the account being recovered,
            // matched by its current (pre-recovery) custody address. Passkeys
            // for OTHER accounts on this device (a different address) are
            // deliberately excluded — recovering one account must never delete
            // another account's passkey. Compared case-insensitively so a
            // checksum/casing difference can't cause a miss (which would leave a
            // stale duplicate) nor an over-match.
            const recoveringAddress = address.toLowerCase();
            recoveryAccountPasskeysRef.current = passkeysBeforeClear.filter(
              (p) => p.address.toLowerCase() === recoveringAddress,
            );
          }
        } catch (e) {
          trackError(e);
        }
        await clearWallet();
        const wallet = await createMnemonicWallet();
        setPendingWallet(wallet);
      })().catch(trackError);
    });
  }, [address, clearWallet, keyStore, token, trackEvent]);

  const submit = useCallback(async () => {
    if (!pendingWallet) {
      return;
    }

    const submitStart = Date.now();
    const normalizedEmail = email ? normalizeEmail(email) : undefined;
    try {
      setIsSubmitting(true);
      trackEvent(AnalyticsEvent.SubmitProposeRecovery, {});
      trackEvent(
        AnalyticsOnlyEvent.RecoveryPhraseBackupConfirmed,
        normalizedEmail ? { email: normalizedEmail } : {},
      );

      const account = await importWallet(pendingWallet);
      const normalizedTargetAddress = normalizeAddress(account.address);
      const passkeysSupported = await isPasskeysSupported({ keyStore });
      if (passkeysSupported) {
        for (const passkey of recoveryAccountPasskeysRef.current) {
          try {
            await deleteStoredPasskey({
              keyStore,
              credentialId: passkey.credentialId,
            });
          } catch (e) {
            trackError(e);
          }
        }
        recoveryAccountPasskeysRef.current = [];
      }

      trackEvent(AnalyticsOnlyEvent.RecoveryRegistrationHashRequested, {
        target_address: normalizedTargetAddress,
      });

      const data = await createRecovery({
        totpToken,
        token,
        address: account.address,
        account,
      });
      if (data === null) {
        // eslint-disable-next-line no-console
        console.warn(
          'data was null: RecoveryBackupRecoveryPhraseScreen:createRecovery',
        );
      }
      const { result } = data;

      await storeRecovery({
        id: result.recovery.id,
      });

      trackEvent(AnalyticsOnlyEvent.RecoveryRegistrationSubmitSucceeded, {
        recovery_id: result.recovery.id,
        target_address: normalizedTargetAddress,
        duration_ms: Date.now() - submitStart,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      });

      pop();
    } catch (e) {
      const fcError = getFirstApiErrorBody(e);
      if (fcError && fcError.reason === 'invalid_confirm_recovery_token') {
        trackEvent(AnalyticsOnlyEvent.RecoveryRegistrationSubmitFailed, {
          error_reason: 'invalid_confirm_recovery_token',
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
        });
        toast.show('The recovery link has expired. Please request a new one.', {
          type: 'danger',
        });
        reset();

        // Very ugly hack but it works?
        setTimeout(() => {
          navigate('RecoveryInitiate', { email });
        }, 1);
      } else {
        trackError(e);
        trackEvent(AnalyticsOnlyEvent.RecoveryRegistrationSubmitFailed, {
          error_reason: 'unknown',
          error_message: (e instanceof Error ? e.message : String(e)).slice(
            0,
            500,
          ),
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
        });
        toast.show('An unknown error occurred.', { type: 'danger' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    pendingWallet,
    trackEvent,
    importWallet,
    createRecovery,
    totpToken,
    token,
    storeRecovery,
    pop,
    toast,
    reset,
    navigate,
    email,
    keyStore,
  ]);

  if (!pendingWallet) {
    return (
      <FullScreenLoadingIndicator
        debugName="RecoveryBackupRecoveryPhrase"
        message="Generating a new wallet"
      />
    );
  }

  return (
    <>
      <View style={[t.hFull, t.justifyBetween, t.pX4, t.pT2, t.pB8]}>
        <View style={[t.justifyStart, t.itemsCenter, t.flexGrow]}>
          <Text style={[t.texts.secondary, t.textBase, t.textCenter]}>
            You&apos;ll need this phrase to log in to Farcaster. Please store it
            in a secure place.
          </Text>
          <View style={[t.bgCodeSnippet, t.roundedLg, t.mT4, t.p6]}>
            <Text style={[t.texts.primary, t.textBase, t.fontMono]} selectable>
              {pendingWallet.mnemonic}
            </Text>
          </View>
          <View style={[t.mY4]}>
            <ButtonV2
              title="Copy to clipboard"
              variant="secondary"
              onPress={async () => {
                await setStringAsync(pendingWallet.mnemonic);
                trackEvent(AnalyticsOnlyEvent.RecoveryPhraseCopied, {});
                toast.show('Copied to clipboard', { placement: 'top' });
                if (clipboardClearTimer.current) {
                  clearTimeout(clipboardClearTimer.current);
                  clipboardClearTimer.current = null;
                }
                // Unconditionally clear after 60s. We intentionally do not read
                // the clipboard before clearing (which would trigger the iOS
                // "pasted from clipboard" banner) — the security benefit of
                // always clearing outweighs the edge case of wiping unrelated content.
                clipboardClearTimer.current = setTimeout(() => {
                  void setStringAsync('').catch(trackError);
                }, 60_000);
              }}
            />
          </View>
        </View>
        <View style={[t.itemsCenter, t.justifyEnd]}>
          <View style={[t.wFull]}>
            <ButtonV2
              title="I backed up my recovery phrase"
              onPress={submit}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </>
  );
}

export const RecoveryBackupRecoveryPhraseScreen = buildScreen(
  {
    avoidKeyboard: true,
    name: 'RecoveryBackupRecoveryPhrase',
  },
  RecoveryBackupRecoveryPhrase,
);
