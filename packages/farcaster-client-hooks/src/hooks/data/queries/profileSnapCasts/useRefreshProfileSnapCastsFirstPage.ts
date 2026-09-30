import { useRefreshInfiniteFirstPageOnly } from '../../helpers';
import { buildProfileSnapCastsKey } from './buildProfileSnapCastsKey';

const useRefreshProfileSnapCastsFirstPage = ({
  fid,
  refetch,
}: {
  fid: number;
  refetch: () => Promise<unknown>;
}) => {
  return useRefreshInfiniteFirstPageOnly(
    buildProfileSnapCastsKey({ fid }),
    refetch,
  );
};

export { useRefreshProfileSnapCastsFirstPage };
