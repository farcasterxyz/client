import {
  FetchNextPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
} from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastInboxConversationInfoV3,
  ApiGetDirectCastInbox200Response,
} from 'farcaster-client-data';
import { useDirectCastInboxByAccount, useUnseen } from 'farcaster-client-hooks';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

// Changing this to be every 5 minutes
const defaultRefreshUpdatesInterval = 300 * 1000;

type DirectCastsInboxContextValue = {
  isInitializing: boolean;
  conversations: {
    [conversationId: string]: ApiDirectCastInboxConversationInfoV3 | undefined;
  };
  fetchNextPage: (
    options?: FetchNextPageOptions,
  ) => Promise<
    InfiniteQueryObserverResult<
      InfiniteData<ApiGetDirectCastInbox200Response>,
      unknown
    >
  >;
  isLoading: boolean;
  refetch: () => void;
  filter: ApiDirectCastConversationFilter | undefined;
  setFilter: (filter: ApiDirectCastConversationFilter | undefined) => void;
  hasArchived: boolean;
  requestsCount: number;
};

const DirectCastsInboxContext = createContext<DirectCastsInboxContextValue>({
  isInitializing: true,
  conversations: {},
  fetchNextPage: () => null as never,
  isLoading: true,
  refetch: () => {},
  setFilter: () => {},
  filter: undefined,
  hasArchived: true,
  requestsCount: 0,
});

type DirectCastsInboxProviderProps = {
  children: ReactNode;
};

const DirectCastsInboxProvider: FC<DirectCastsInboxProviderProps> = memo(
  ({ children }) => {
    const currentUser = useCurrentUser();

    const { inboxCount } = useUnseen();

    const [isInitializing, setIsInitializing] = useState<boolean>(true);

    const [filter, setFilter] = useState<
      ApiDirectCastConversationFilter | undefined
    >(undefined);

    const { data, fetchNextPage, refetch, isPending } =
      useDirectCastInboxByAccount({
        fid: currentUser.fid,
        category: 'default',
        filter,
      });

    const hasArchived = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.hasArchived;
      }

      return false;
    }, [data?.pages]);

    const requestsCount = useMemo(() => {
      if (data?.pages && data.pages.length > 0) {
        return data.pages[data.pages.length - 1].result.requestsCount;
      }

      return 0;
    }, [data]);

    const conversations = useMemo(
      () =>
        (data?.pages.flatMap((p) => p.result.conversations) || []).reduce(
          (acc, c) => {
            acc[c.conversationId] = c;
            return acc;
          },
          {} as {
            [key: string]: ApiDirectCastInboxConversationInfoV3 | undefined;
          },
        ),
      [data?.pages],
    );

    useEffect(() => {
      if (isInitializing) {
        setIsInitializing(Object.keys(conversations).length === 0 && isPending);
      }
    }, [conversations, isInitializing, isPending]);

    useEffect(() => {
      let hasEffectCleanedUp = false;

      let timeout: ReturnType<typeof setTimeout>;

      const refresh = async () => {
        await refetch({
          cancelRefetch: false,
        });

        if (!hasEffectCleanedUp) {
          timeout = setTimeout(refresh, defaultRefreshUpdatesInterval);
        }
      };

      timeout = setTimeout(refresh, defaultRefreshUpdatesInterval);

      return () => {
        hasEffectCleanedUp = true;
        clearTimeout(timeout);
      };
    }, [data?.pages, inboxCount, refetch]);

    return (
      <DirectCastsInboxContext.Provider
        value={{
          conversations,
          isInitializing: isPending,
          fetchNextPage,
          isLoading: isPending,
          refetch,
          hasArchived,
          requestsCount,
          filter,
          setFilter,
        }}
      >
        {children}
      </DirectCastsInboxContext.Provider>
    );
  },
);

DirectCastsInboxProvider.displayName = 'DirectCastsInboxProvider';

const useDirectCastsInbox = () => useContext(DirectCastsInboxContext);

export { DirectCastsInboxProvider, useDirectCastsInbox };
