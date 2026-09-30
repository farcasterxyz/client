import { ApiChain, ApiTokenEmbedFeedType } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenFeedKey = ({
  chain,
  ca,
  feedType,
}: {
  chain: ApiChain;
  ca?: string;
  feedType?: ApiTokenEmbedFeedType;
}) => compactQueryKey(['tokenFeed', chain, ca, feedType]);

export { buildTokenFeedKey };
