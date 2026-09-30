import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastQuotesKey = ({ castHash }: { castHash: string | undefined }) =>
  compactQueryKey(['castQuotes', castHash]);

export { buildCastQuotesKey };
