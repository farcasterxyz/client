import { ApiDirectCastConversationViewCategory } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';
import { useDirectCastInboxByAccount } from './useDirectCastInboxByAccount';
import { useInvalidateDirectCastInboxByAccount } from './useInvalidateDirectCastInboxByAccount';

const useDirectCastInboxByAccountWithRefreshOnMount = ({
  fid,
  category,
}: {
  fid: number;
  category: ApiDirectCastConversationViewCategory;
}) => {
  const initialValue = useDirectCastInboxByAccount({
    fid,
    category,
  });

  const queryKey = useMemo(
    () =>
      buildDirectCastInboxByAccountKey({
        fid,
        category,
      }),
    [category, fid],
  );

  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();
  const invalidate = useCallback(() => {
    invalidateDirectCastInboxByAccount({
      fid,
      category,
    });
  }, [fid, category, invalidateDirectCastInboxByAccount]);

  return useQueryWithRefreshOnMount({
    initialValue,
    invalidate,
    queryKey,
  });
};

export { useDirectCastInboxByAccountWithRefreshOnMount };
