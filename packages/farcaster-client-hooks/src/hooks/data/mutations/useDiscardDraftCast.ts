import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiGetDraftCasts200Response,
  ApiGetDraftCaststorms200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import {
  buildDraftCastsKey,
  buildDraftCaststormsKey,
} from '../queries/draftCasts';

const useDiscardDraftCast = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({
      draftId,
      castChannelKey,
    }: {
      draftId: string;
      castChannelKey: string | undefined;
    }) => {
      const response = await apiClient.discardDraftCast({ draftId });

      queryClient.setQueryData<InfiniteData<ApiGetDraftCasts200Response>>(
        buildDraftCastsKey({
          channelKey: castChannelKey,
        }),
        (existingQueryData) => {
          if (typeof existingQueryData === 'undefined') return undefined;

          const pages = existingQueryData.pages.map((page) => {
            const existingPageDrafts = page.result.drafts;

            const filteredPageDrafts = existingPageDrafts.filter(
              (o) => o.draftId !== draftId,
            );

            return {
              next: page.next,
              result: { drafts: filteredPageDrafts },
            } satisfies ApiGetDraftCasts200Response;
          });

          return {
            pageParams: existingQueryData.pageParams,
            pages: pages,
          };
        },
      );

      if (!castChannelKey) {
        queryClient.setQueryData<
          InfiniteData<ApiGetDraftCaststorms200Response>
        >(buildDraftCaststormsKey(), (existingQueryData) => {
          if (typeof existingQueryData === 'undefined') return undefined;

          const pages = existingQueryData.pages.map((page) => {
            const existingPageDrafts = page.result.drafts;

            const filteredPageDrafts = existingPageDrafts.filter(
              (o) => o.draftId !== draftId,
            );

            return {
              next: page.next,
              result: { drafts: filteredPageDrafts },
            } satisfies ApiGetDraftCaststorms200Response;
          });

          return {
            pageParams: existingQueryData.pageParams,
            pages: pages,
          };
        });
      }

      return response.data;
    },
    [apiClient, queryClient],
  );
};

export { useDiscardDraftCast };
