import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildThreadKey = ({ castHash }: { castHash: string | undefined }) =>
  compactQueryKey(['thread', castHash]);

export { buildThreadKey };
