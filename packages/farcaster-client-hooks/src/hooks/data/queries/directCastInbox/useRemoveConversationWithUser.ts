import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiGetDirectCastInbox200Response } from 'farcaster-client-data';

import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';
import { useInvalidateDirectCastInboxByAccount } from './useInvalidateDirectCastInboxByAccount';

export function useRemoveConversationWithUser() {
  const queryClient = useQueryClient();
  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();

  return ({
    viewerFid,
    targetFid,
  }: {
    viewerFid: number;
    targetFid: number;
  }) => {
    queryClient
      .getQueryCache()
      .findAll({
        queryKey: buildDirectCastInboxByAccountKey({
          fid: viewerFid,
          category: 'request',
        }),
      })
      .forEach((query) => {
        remove(queryClient, query.queryKey, targetFid);
      });

    queryClient
      .getQueryCache()
      .findAll({
        queryKey: buildDirectCastInboxByAccountKey({
          fid: viewerFid,
          category: 'default',
        }),
      })
      .forEach((query) => {
        remove(queryClient, query.queryKey, targetFid);
      });

    queryClient
      .getQueryCache()
      .findAll({
        queryKey: buildDirectCastInboxByAccountKey({
          fid: viewerFid,
          category: 'archived',
        }),
      })
      .forEach((query) => {
        remove(queryClient, query.queryKey, targetFid);
      });

    invalidateDirectCastInboxByAccount({
      fid: viewerFid,
      category: 'default',
    });
    invalidateDirectCastInboxByAccount({
      fid: viewerFid,
      category: 'request',
    });
    invalidateDirectCastInboxByAccount({
      fid: viewerFid,
      category: 'archived',
    });
  };
}

const remove = (queryClient: QueryClient, key: QueryKey, fid: number) => {
  queryClient.setQueryData<InfiniteData<ApiGetDirectCastInbox200Response>>(
    key,
    (data) => {
      if (!data) {
        return data;
      }

      let removeChat = false;
      const newPages = data.pages.map((page) => {
        const filteredItems = page.result.conversations.filter((item) => {
          return (
            item.viewerContext.counterParty &&
            item.viewerContext.counterParty.fid !== fid
          );
        });

        if (filteredItems.length === page.result.conversations.length) {
          return page;
        } else {
          removeChat = true;
          return { result: { ...page.result, conversations: filteredItems } };
        }
      });

      return {
        pageParams: data.pageParams,
        pages: removeChat ? newPages : data.pages,
      };
    },
  );
};
