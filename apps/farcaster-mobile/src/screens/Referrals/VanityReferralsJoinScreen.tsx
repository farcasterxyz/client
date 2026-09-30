import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVanityReferralCode } from 'farcaster-client-hooks';
import React from 'react';

import { ReferralsJoinScreenContent } from '~/components/referrals/ReferralsJoinScreenContent';
import { AnalyticsProvider } from '~/contexts/AnalyticsProvider';
import { ForceThemeProvider } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type VanityReferralsJoinScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'VanityReferralsJoin'
>;

const VanityReferralsJoinScreen = ({
  route,
}: VanityReferralsJoinScreenProps) => (
  <ForceThemeProvider>
    <AnalyticsProvider>
      <VanityReferralsJoinScreenContent username={route?.params?.username} />
    </AnalyticsProvider>
  </ForceThemeProvider>
);

VanityReferralsJoinScreen.displayName = 'VanityReferralsJoinScreen';

function VanityReferralsJoinScreenContent({
  username,
}: {
  username: string | undefined;
}) {
  const { data } = useVanityReferralCode({
    username: username ?? '',
  });

  return (
    <ReferralsJoinScreenContent
      referralCode={data?.referralCode}
      vanity={true}
    />
  );
}

VanityReferralsJoinScreenContent.displayName =
  'VanityReferralsJoinScreenContent';

export { VanityReferralsJoinScreen };
