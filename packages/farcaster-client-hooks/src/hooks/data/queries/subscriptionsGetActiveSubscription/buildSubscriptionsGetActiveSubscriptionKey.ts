import { ApiAccountSubscriptionType } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSubscriptionsGetActiveSubscriptionKey = ({
  fid,
  type,
}: {
  fid?: number;
  type: ApiAccountSubscriptionType;
}) => compactQueryKey(['subscriptionsGetActiveSubscription', type, fid]);
