import { ApiShareCastContext } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildShareCastKey = ({
  castHash,
  context,
  maxTargets,
}: {
  castHash: string;
  context?: ApiShareCastContext;
  maxTargets?: number;
}) => compactQueryKey(['shareCast', castHash, context, maxTargets]);

export { buildShareCastKey };
