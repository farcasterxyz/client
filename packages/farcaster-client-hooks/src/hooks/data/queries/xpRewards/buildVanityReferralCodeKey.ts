import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildVanityReferralCodeKey = ({
  username,
}: {
  username: string;
}) => compactQueryKey(['vanityReferralCode', username]);
