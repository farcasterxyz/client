import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationAlterCategory,
  ApiDirectCastConversationViewCategory,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useUpdateDirectCastConversation } from '../queries/directCastConversation/useUpdateDirectCastConversation';
import { buildDirectCastInboxByAccountKey } from '../queries/directCastInbox/buildDirectCastInboxByAccountKey';
import { useAddDirectCastConversationToInbox } from '../queries/directCastInbox/useAddDirectCastConversationToInbox';
import { useGetDirectCastInboxConversationByConversationId } from '../queries/directCastInbox/useGetDirectCastInboxConversationByConversationId';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';
import { useRemoveDirectCastConversationFromInbox } from '../queries/directCastInbox/useRemoveDirectCastConversationFromInbox';
import { useUpdateGloballyCachedDirectCastInboxConversation } from '../queries/globallyCachedDirectCastInboxConversation/useUpdateGloballyCachedDirectCastInboxConversation';

const useAlterPlaintextDirectCastConversationCategory = () => {
  const { apiClient } = useFarcasterApiClient();

  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();

  const updateGloballyCachedDirectCastInboxConversation =
    useUpdateGloballyCachedDirectCastInboxConversation();

  const queryClient = useQueryClient();

  const getDirectCastInboxConversationByConversationId =
    useGetDirectCastInboxConversationByConversationId();

  const removeDirectCastConversationFromInbox =
    useRemoveDirectCastConversationFromInbox();

  const addDirectCastConversationToInbox =
    useAddDirectCastConversationToInbox();

  const updateDirectCastConversation = useUpdateDirectCastConversation();

  return useCallback(
    async ({
      fid,
      conversationId,
      fromCategory,
      toCategory,
      enabled = true,
    }: {
      fid: number;
      conversationId: string;
      fromCategory?: ApiDirectCastConversationViewCategory;
      toCategory: ApiDirectCastConversationAlterCategory;
      enabled?: boolean;
    }) => {
      if (toCategory !== 'deleted') {
        updateGloballyCachedDirectCastInboxConversation({
          updates: {
            conversationId: conversationId,
            viewerContext: {
              category: toCategory,
              archived: toCategory === 'archived',
            },
          },
        });
        updateDirectCastConversation({
          updates: {
            conversationId,
            viewerContext: {
              category: toCategory,
              archived: toCategory === 'archived',
            },
          },
        });
      }

      const { conversation } = getDirectCastInboxConversationByConversationId({
        fid,
        category: fromCategory,
        conversationId,
      });

      removeDirectCastConversationFromInbox({
        fid,
        category: fromCategory,
        conversationId,
      });

      // add the conversation to the destination unless it's been deleted
      if (toCategory !== 'deleted' && conversation) {
        addDirectCastConversationToInbox({
          fid,
          category: toCategory,
          conversation,
        });
      }

      // decrement the requestsCount if the convo moved out of requests
      if (fromCategory === 'request') {
        queryClient.setQueryData(
          buildDirectCastInboxByAccountKey({
            fid,
            category: 'default',
          }),
          (
            prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
          ): InfiniteData<ApiGetDirectCastInbox200Response> | undefined => {
            if (!prev || prev.pages.length === 0) return prev;

            const lastPage = prev.pages[prev.pages.length - 1];
            return {
              ...prev,
              pages: [
                ...prev.pages.slice(0, -1),
                {
                  ...lastPage,
                  result: {
                    ...lastPage.result,
                    requestsCount: Math.max(
                      lastPage.result.requestsCount - 1,
                      0,
                    ),
                  },
                },
              ],
            } as InfiniteData<ApiGetDirectCastInbox200Response>;
          },
        );
      }

      // decrement the voidCount if the convo moved out of void
      if (fromCategory === 'void') {
        queryClient.setQueryData(
          buildDirectCastInboxByAccountKey({
            fid,
            category: 'default',
          }),
          (
            prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
          ): InfiniteData<ApiGetDirectCastInbox200Response> | undefined => {
            if (!prev || prev.pages.length === 0) return prev;

            const lastPage = prev.pages[prev.pages.length - 1];
            return {
              ...prev,
              pages: [
                ...prev.pages.slice(0, -1),
                {
                  ...lastPage,
                  result: {
                    ...lastPage.result,
                    voidCount: Math.max(lastPage.result.voidCount - 1, 0),
                  },
                },
              ],
            } as InfiniteData<ApiGetDirectCastInbox200Response>;
          },
        );
      }

      // mark hasArchived if moving to archived
      if (toCategory === 'archived') {
        queryClient.setQueryData(
          buildDirectCastInboxByAccountKey({
            fid,
            category: 'default',
          }),
          (
            prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
          ): InfiniteData<ApiGetDirectCastInbox200Response> | undefined => {
            if (!prev || prev.pages.length === 0) return prev;

            const lastPage = prev.pages[prev.pages.length - 1];
            return {
              ...prev,
              pages: [
                ...prev.pages.slice(0, -1),
                {
                  ...lastPage,
                  result: {
                    ...lastPage.result,
                    hasArchived: true,
                  },
                },
              ],
            } as InfiniteData<ApiGetDirectCastInbox200Response>;
          },
        );
      }

      if (enabled) {
        const { data } =
          await apiClient.postDirectCastConversationCategorizationV3({
            conversationId,
            category: toCategory,
          });
        return data;
      }

      // This generally indicates we were not able to find and optimistically update
      // so let's go ahead and invalidate the new category.
      if (
        toCategory !== 'deleted' &&
        (typeof fromCategory === 'undefined' ||
          typeof conversation === 'undefined')
      ) {
        invalidateDirectCastInboxByAccount({
          fid,
          category: toCategory,
        });
      }

      return undefined;
    },
    [
      apiClient,
      invalidateDirectCastInboxByAccount,
      updateGloballyCachedDirectCastInboxConversation,
      queryClient,
      getDirectCastInboxConversationByConversationId,
      removeDirectCastConversationFromInbox,
      addDirectCastConversationToInbox,
      updateDirectCastConversation,
    ],
  );
};

export { useAlterPlaintextDirectCastConversationCategory };
