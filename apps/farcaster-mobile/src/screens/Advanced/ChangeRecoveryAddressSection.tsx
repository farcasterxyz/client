import { AnalyticsEvent } from 'farcaster-analytics';
import { AtomsButton } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

const ChangeRecoveryAddressSection: FC = () => {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useAnalytics();

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          Change recovery address
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        Your recovery address allows you to recover your Farcaster account in
        the event you lose your recovery phrase. By default, Farcaster manages
        this for users that sign up with Farcaster.
      </Text>
      <View style={[t.mT6]}>
        <AtomsButton
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickChangeRecoveryAddress, {});
            push('EditRecoveryAddress', {});
          }}
          hierarchy="primary"
          size="l"
        >
          Change recovery address
        </AtomsButton>
      </View>
    </View>
  );
};

export { ChangeRecoveryAddressSection };
