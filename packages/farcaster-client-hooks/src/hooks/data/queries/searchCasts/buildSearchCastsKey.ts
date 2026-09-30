import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSearchCastsKey = ({
  limit,
  q,
}: {
  limit: number | undefined;
  q: string | undefined;
}) => compactQueryKey(['searchCasts', q, limit]);
