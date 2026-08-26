import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { View } from 'react-native';

import { ConnectAddress } from '~/components/ConnectAddress';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';

type ConnectAddressScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ConnectAddress'
>;

const ConnectAddressScreen = buildScreen<ConnectAddressScreenProps>(
  { name: 'ConnectAddress' },
  () => {
    const t = useTheme();

    const pop = usePop();

    const { trackEvent } = useAnalytics();

    return (
      <View style={[t.hFull]}>
        <ConnectAddress
          onConnectPressAfterNavigate={() => {
            trackEvent(AnalyticsEvent.ClickedConnectAddress, undefined);
            pop();
          }}
          onSkipPress={() => {
            trackEvent(
              AnalyticsEvent.ClickedEmailMeALinkConnectAddress,
              undefined,
            );
            pop();
          }}
          skipButtonTextOverride={'Email me a link'}
        />
      </View>
    );
  },
);

ConnectAddressScreen.displayName = 'ConnectAddressScreen';

export { ConnectAddressScreen };
