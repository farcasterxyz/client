import { useRefreshInfiniteFirstPageOnly } from '../../helpers';
import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export const useRefreshNotificationsForTabFirstPage = (
  tab: string,
  refetch: () => Promise<unknown>,
) => {
  return useRefreshInfiniteFirstPageOnly(
    buildNotificationsForTabKey({ tab }),
    refetch,
  );
};
