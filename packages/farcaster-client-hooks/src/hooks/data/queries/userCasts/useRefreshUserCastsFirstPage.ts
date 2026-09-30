import { useRefreshInfiniteFirstPageOnly } from '../../helpers';
import { buildUserCastsKey } from './buildUserCastsKey';

const useRefreshUserCastsFirstPage = ({
  fid,
  refetch,
}: {
  fid: number;
  refetch: () => Promise<unknown>;
}) => {
  return useRefreshInfiniteFirstPageOnly(buildUserCastsKey({ fid }), refetch);
};

export { useRefreshUserCastsFirstPage };
