import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiCaststormBody,
  ApiGetDraftCaststorms200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildDraftCaststormsKey } from '../queries/draftCasts/buildDraftCaststormsKey';

const useStoreDraftCaststorm = () => {
  const { apiClient } = useFarcasterApiClient();

  const queryClient = useQueryClient();

  return useCallback(
    async ({
      caststorm,
      scheduledAt,
    }: {
      caststorm: ApiCaststormBody;
      scheduledAt?: Date;
    }) => {
      const response = await apiClient.storeDraftCaststorm({
        caststorm,
        scheduledAt: scheduledAt ? scheduledAt.getTime() : undefined,
      });

      const savedDraft = response.data.result.draft;

      queryClient.setQueryData<InfiniteData<ApiGetDraftCaststorms200Response>>(
        buildDraftCaststormsKey(),
        (existingQueryData) => {
          if (typeof existingQueryData === 'undefined') return undefined;

          const pages = existingQueryData.pages.map((page, index) => {
            // Drop any existing copy of this draft first: when the store was an
            // upsert (editing an existing draft) the server returns the same
            // draftId, so without this the list would show it twice. For a
            // brand-new draft this filters nothing. Then prepend the fresh copy
            // to the first page to match the server's updatedAt-desc ordering.
            const draftsWithoutSaved = page.result.drafts.filter(
              (draft) => draft.draftId !== savedDraft.draftId,
            );

            return {
              next: page.next,
              result: {
                drafts:
                  index === 0
                    ? [savedDraft, ...draftsWithoutSaved]
                    : draftsWithoutSaved,
              },
            } satisfies ApiGetDraftCaststorms200Response;
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

export { useStoreDraftCaststorm };
