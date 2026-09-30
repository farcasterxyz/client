import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildMutedKeywordKey = ({ keyword }: { keyword: string }) =>
  compactQueryKey(['mutedKeyword', keyword]);
