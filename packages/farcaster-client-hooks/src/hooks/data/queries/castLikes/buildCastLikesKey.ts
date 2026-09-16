import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastLikesKey = ({ castHash }: { castHash: string | undefined }) =>
  compactQueryKey(['castLikes', castHash]);

export { buildCastLikesKey };
