import { useQueryClient } from '@tanstack/react-query';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode, useEffect, useRef } from 'react';

import { isDev } from '~/constants/Env';

type ResetQueryCacheOnBaseUrlChangeProps = {
  children: ReactNode;
};

const ResetQueryCacheOnBaseUrlChange: FC<ResetQueryCacheOnBaseUrlChangeProps> =
  memo(({ children }) => {
    const { apiClient } = useFarcasterApiClient();
    const queryClient = useQueryClient();
    const isInitializedRef = useRef(false);

    useEffect(() => {
      if (!isDev) {
        return;
      }

      if (isInitializedRef.current) {
        queryClient.clear();
      } else {
        isInitializedRef.current = true;
      }
    }, [apiClient.baseUrl, queryClient]);

    return <>{children}</>;
  });

ResetQueryCacheOnBaseUrlChange.displayName = 'ResetQueryCacheOnBaseUrlChange';

export { ResetQueryCacheOnBaseUrlChange };
