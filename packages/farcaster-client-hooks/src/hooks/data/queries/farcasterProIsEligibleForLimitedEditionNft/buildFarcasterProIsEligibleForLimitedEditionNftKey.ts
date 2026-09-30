import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildFarcasterProIsEligibleForLimitedEditionNftKey = ({
  fid,
}: {
  fid: number;
}) => compactQueryKey(['farcasterProIsEligibleForLimitedEditionNft', fid]);
