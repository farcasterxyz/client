import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildReferralCodeKey = ({ code }: { code: string }) =>
  compactQueryKey(['referralCode', code]);
