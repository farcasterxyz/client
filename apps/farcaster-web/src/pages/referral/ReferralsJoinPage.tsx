import React from 'react';

import { ReferralJoinContent } from '~/components/referral/ReferralJoinContent';
import { useParams } from '~/hooks/navigation/useParams';

export const ReferralsJoinPage: React.FC = () => {
  const { code } = useParams('referralCodeJoinPage');

  return <ReferralJoinContent code={code} vanity={false} />;
};

ReferralsJoinPage.displayName = 'ReferralsJoinPage';
