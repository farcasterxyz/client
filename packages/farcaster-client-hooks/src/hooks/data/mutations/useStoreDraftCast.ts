import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiCastBody,
  ApiGetDraftCasts200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildDraftCastsKey } from '../queries/draftCasts/buildDraftCastsKey';

const useStoreDraftCast = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({ cast, cron }: { cast: ApiCastBody; cron: string | undefined }) => {
      const response = await apiClient.storeDraftCast({ cast, cron });

      queryClient.setQueryData<InfiniteData<ApiGetDraftCasts200Response>>(
        buildDraftCastsKey({
          channelKey: typeof cron !== 'undefined' ? cast.channelKey : undefined,
        }),
        (existingQueryData) => {
          if (typeof existingQueryData === 'undefined') return undefined;

          const pages = existingQueryData.pages.map((page, index) => {
            const existingPageDrafts = page.result.drafts;

            if (index === 0) {
              existingPageDrafts.unshift(response.data.result.draft);

              return {
                next: page.next,
                result: { drafts: existingPageDrafts },
              } satisfies ApiGetDraftCasts200Response;
            }

            return page;
          });

          return {
            pageParams: existingQueryData.pageParams,
            pages: pages,
          };
        },
      );

      return response.data;
    },
    [apiClient, queryClient],
  );
};

export { useStoreDraftCast };
