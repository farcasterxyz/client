import { useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { MILLIS_PER_DAY, useSigners } from 'farcaster-client-hooks';
import { ShieldAlertIcon } from 'lucide-react-native';
import React, { FC, memo, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { exportMnemonicPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackError } from '~/utils/ErrorUtils';
import { getSecureItem } from '~/utils/SecureStorageUtils';

import { Prompt } from './Prompt';

function BackupMnemonicPrompt() {
  return (
    <React.Suspense>
      <BackupMnemonicPromptSuspending />
    </React.Suspense>
  );
}

const BackupMnemonicPromptSuspending: FC = memo(() => {
  const signers = useSigners();
  const { keyStore } = useFarcasterCryptographyKeyStore();

  const [shouldPresent, setShouldPresent] = useState<boolean>(false);

  useEffect(() => {
    const earliestDate = signers.data.pages
      .flatMap((p) => p.result.signers)
      .map((s) => s.timestamp)
      .sort((a, b) => a - b);

    getSecureItem({
      key: 'user-backed-up-mnemonic',
      fallback: false,
    }).then((backedUp) => {
      const now = Date.now();

      const withinRange =
        earliestDate.length !== 0 &&
        earliestDate[0] <= now - 3 * MILLIS_PER_DAY &&
        earliestDate[0] >= now - 14 * MILLIS_PER_DAY;

      keyStore.isPasskeysSupported().then((supported) => {
        if (supported) {
          keyStore
            .getStoredPasskeys()
            .then((passkeys) => {
              setShouldPresent(
                !backedUp && passkeys.length === 0 && withinRange,
              );
            })
            .catch(trackError);
        } else {
          setShouldPresent(!backedUp && withinRange);
        }
      });
    });
  }, [keyStore, signers]);

  return (
    <Prompt
      shouldPresent={(props) => shouldPresent && !props.hasPresentedThisSession}
      height={400}
      storageKey={exportMnemonicPromptKey}
    >
      <BackupMnemonicPromptContent />
    </Prompt>
  );
});

BackupMnemonicPrompt.displayName = 'BackupMnemonicPrompt';

const BackupMnemonicPromptContent: FC = () => {
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  return (
    <View style={[t.hFull, t.justifyBetween, t.p4]}>
      <View style={[t.hFull, t.justifyBetween]}>
        <View style={[t.itemsCenter, t.justifyCenter, t.pB2]}>
          <View
            style={[
              t.bgMuted,
              t.itemsCenter,
              t.justifyCenter,
              t.p5,
              t.roundedFull,
            ]}
          >
            <ShieldAlertIcon size={32} color={t.colors.text.secondary} />
          </View>
        </View>
        <Text
          style={[
            t.textBase,
            t.texts.primary,
            t.textXl,
            t.fontSemibold,
            t.textCenter,
          ]}
        >
          Don't lose access to your wallet!
        </Text>
        <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
          Back up your recovery phrase to make sure you can always restore your
          wallet if you ever lose access to this device.
        </Text>
        <View>
          <Button
            title="Backup now"
            style={[t.mB4]}
            variant="normal"
            fontWeight="bold"
            onPress={async () => {
              trackEvent(AnalyticsEvent.NavigateBackupMnemonic, {
                trigger: 'first_prompt',
              });
              navigate('RecoverFarcasterAccount', {});
              forceClose();
            }}
          />
          <Button
            title="Remind me later"
            variant="muted"
            fontWeight="normal"
            onPress={async () => {
              forceClose();
            }}
          />
        </View>
      </View>
    </View>
  );
};

export { BackupMnemonicPrompt };
