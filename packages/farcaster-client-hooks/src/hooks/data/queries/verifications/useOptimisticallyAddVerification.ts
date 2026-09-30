import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiGetVerifications200Response,
  ApiVerification,
  ApiVerificationProtocol,
  ApiVerificationVersion,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildVerificationsKey } from './buildVerificationsKey';

const useOptimisticallyAddVerification = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid, address }: { fid: number; address: string }) => {
      queryClient.setQueryData(
        buildVerificationsKey({ fid }),
        (
          prev: InfiniteData<ApiGetVerifications200Response> | undefined,
        ): InfiniteData<ApiGetVerifications200Response> | undefined => {
          const newVerification: ApiVerification = {
            fid,
            address,
            timestamp: Date.now(),
            version: 'v2' as ApiVerificationVersion,
            protocol: 'ethereum' as ApiVerificationProtocol,
            isPrimary: false,
          };

          if (!prev || prev.pages.length === 0) {
            return {
              pages: [{ result: { verifications: [newVerification] } }],
            } as InfiniteData<ApiGetVerifications200Response>;
          }

          const lastPage = prev.pages[prev.pages.length - 1];
          return {
            ...prev,
            pages: [
              ...prev.pages.slice(0, -1),
              {
                ...lastPage,
                result: {
                  verifications: [
                    ...lastPage.result.verifications,
                    newVerification,
                  ],
                },
              },
            ],
          } as InfiniteData<ApiGetVerifications200Response>;
        },
      );
    },
    [queryClient],
  );
};

export { useOptimisticallyAddVerification };
