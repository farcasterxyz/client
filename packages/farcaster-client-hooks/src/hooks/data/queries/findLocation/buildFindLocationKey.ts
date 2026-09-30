import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildFindLocationKey = ({ q }: { q: string | undefined }) =>
  compactQueryKey(['findLocation', q]);
