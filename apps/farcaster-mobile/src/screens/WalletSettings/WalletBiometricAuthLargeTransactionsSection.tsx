import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { largeTransactionUsd, useAttemptBiometricAuth } from 'farcaster-expo';
import * as React from 'react';
import { View } from 'react-native';

import { Switch } from '~/components/Switch';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

function WalletBiometricAuthLargeTransactionsSection() {
  const t = useTheme();

  const { data: prefsData } = useUserPreferences();
  const currentPreference =
    prefsData.result.preferences.biometricAuthLargeTransactions;

  const [preference, setPreference] = React.useState(currentPreference);

  const setUserPreferences = useSetUserPreferences();
  const attemptBiometricAuth = useAttemptBiometricAuth();
  const onUpdatePreference = React.useCallback(
    async (newPreference: boolean) => {
      setPreference(newPreference);
      if (!newPreference) {
        // Perform biometric auth if disabling
        const { success } = await attemptBiometricAuth();
        if (!success) {
          setPreference(!newPreference);
          return;
        }
      }
      try {
        await setUserPreferences({
          preferences: { biometricAuthLargeTransactions: newPreference },
        });
      } catch (error) {
        setPreference(!newPreference);
        trackError(error);
      }
    },
    [setUserPreferences, attemptBiometricAuth],
  );

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.pY3,
        t.pX4,
        t.backgrounds.secondary,
        t.mX3,
        t.mY2,
        { borderRadius: 16 },
      ]}
    >
      <View style={t.flex1}>
        <Text2 weight="semibold">
          Use biometric auth for large transactions
        </Text2>
        <Text2 color="secondary" size="sm" style={{ paddingTop: 2 }}>
          Require face scan, fingerprint scan, or device passcode for
          {` transactions over $${largeTransactionUsd} USD.`}
        </Text2>
      </View>
      <View style={[t.relative, { left: 8 }]}>
        <Switch
          value={preference}
          onValueChange={onUpdatePreference}
          style={{ transform: [{ scale: 0.8 }] }}
          newColors
        />
      </View>
    </View>
  );
}

export { WalletBiometricAuthLargeTransactionsSection };
