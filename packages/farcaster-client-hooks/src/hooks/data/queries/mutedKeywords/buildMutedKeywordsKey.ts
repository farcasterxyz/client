import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildMutedKeywordsKey = () =>
  compactQueryKey(['mutedKeywords']) as string[];
