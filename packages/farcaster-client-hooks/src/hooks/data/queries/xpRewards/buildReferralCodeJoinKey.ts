import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildReferralCodeJoinKey = ({ code }: { code: string }) =>
  compactQueryKey(['referralCodeJoin', code]);
