import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildBidOnCastCollectibleKey = ({
  castHash,
  bidderAddress,
  bidAmount,
  permit,
}: {
  castHash: string;
  bidderAddress: string;
  bidAmount: string;
  permit: {
    signature: string;
    deadline: number;
  };
}) =>
  compactQueryKey([
    'bidOnCastCollectible',
    castHash,
    bidderAddress,
    bidAmount,
    permit,
  ]);

export { buildBidOnCastCollectibleKey };
