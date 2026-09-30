import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildPollResultsKey = ({ url }: { url: string }) =>
  compactQueryKey(['pollResults', url]) as string[];
