import { AnalyticsEvent } from 'farcaster-analytics';
import { getStoredPasskeys, isPasskeysSupported } from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import React, { FC, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { trackError } from '~/utils/ErrorUtils';

const EnrollPasskeysSection: FC = () => {
  const t = useTheme();
  const push = usePush();
  const { address } = useWallet();
  const { trackEvent } = useAnalytics();

  const { keyStore } = useFarcasterCryptographyKeyStore();
  const [alreadyRegisteredPasskey, setAlreadyRegisteredPasskey] =
    useState<boolean>();
  const [canRegisterPasskey, setCanRegisterPasskey] = useState<boolean>();

  useEffect(() => {
    isPasskeysSupported({ keyStore })
      .then(async (supported) => {
        if (supported) {
          const keys = await getStoredPasskeys({ keyStore });
          setAlreadyRegisteredPasskey(
            keys.filter((k) => k.address === address).length !== 0,
          );
          setCanRegisterPasskey(true);
        } else {
          setCanRegisterPasskey(false);
        }
      })
      .catch(trackError);
  }, [address, canRegisterPasskey, keyStore]);

  if (!canRegisterPasskey) {
    return null;
  }

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          {Platform.OS === 'ios' ? 'iCloud backup' : 'Passkey backup'}
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        {alreadyRegisteredPasskey
          ? 'Your recovery phrase is already backed up, you can log out safely'
          : "Your recovery phrase is not backed up, and you could lose it if you don't back up."}
      </Text>
      <View style={[t.mT6]}>
        <AtomsButton
          disabled={alreadyRegisteredPasskey}
          onPress={() => {
            trackEvent(AnalyticsEvent.PasskeysEnrollPromptShown, {
              trigger: 'settings',
            });
            push('PasskeysBackupExistingUser', {});
          }}
          hierarchy="primary"
          size="l"
        >
          Secure with passkey
        </AtomsButton>
      </View>
    </View>
  );
};

export { EnrollPasskeysSection };
