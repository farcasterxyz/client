import { useVanityReferralCode } from 'farcaster-client-hooks';
import React from 'react';

import { ReferralJoinContent } from '~/components/referral/ReferralJoinContent';
import { useParams } from '~/hooks/navigation/useParams';

export const VanityReferralJoinPage: React.FC = () => {
  const { username } = useParams('vanityReferralJoinPage');

  const { data } = useVanityReferralCode({ username });

  return <ReferralJoinContent code={data?.referralCode} vanity={true} />;
};
