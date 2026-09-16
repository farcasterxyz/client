import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { ReferralsJoinScreenContent } from '~/components/referrals/ReferralsJoinScreenContent';
import { AnalyticsProvider } from '~/contexts/AnalyticsProvider';
import { ForceThemeProvider } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type ReferralsJoinScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ReferralsJoin'
>;

const ReferralsJoinScreen = ({ route }: ReferralsJoinScreenProps) => (
  <ForceThemeProvider>
    <AnalyticsProvider>
      <ReferralsJoinScreenContent
        referralCode={route?.params?.referralCode}
        vanity={false}
      />
    </AnalyticsProvider>
  </ForceThemeProvider>
);

ReferralsJoinScreen.displayName = 'ReferralsJoinScreen';

export { ReferralsJoinScreen };
