import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ApiCast,
  ApiGetThread200Response,
  ApiGetUserThreadCasts200Response,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildConversationCastRepliesKey } from '../queries/conversationCastReplies/buildConversationCastRepliesKey';
import { buildThreadKey } from '../queries/thread/buildThreadKey';
import { buildUserThreadCastsKey } from '../queries/userThreadCasts/buildUserThreadCastsKey';

type ThreadData = InfiniteData<
  ApiGetThread200Response | ApiGetUserThreadCasts200Response
>;
type ConversationCastRepliesData = {
  parentCastHash: string;
  page: number;
  casts: ApiCast[];
};

const MAX_CAST_TREE_DEPTH = 32;
const CONVERSATION_CAST_REPLIES_QUERY_PREFIX = buildConversationCastRepliesKey({
  focusedCastHash: '',
})[0];

const castTreeContainsHash = (
  cast: ApiCast,
  hash: string,
  depth = 0,
  visited = new Set<string>(),
): boolean => {
  if (cast.hash === hash) return true;
  if (depth >= MAX_CAST_TREE_DEPTH || visited.has(cast.hash)) return false;

  visited.add(cast.hash);
  const nestedCasts = [
    ...(cast.ancestors?.casts ?? []),
    ...(cast.replies?.casts ?? []),
  ];
  const containsHash = nestedCasts.some((nestedCast) =>
    castTreeContainsHash(nestedCast, hash, depth + 1, visited),
  );
  visited.delete(cast.hash);

  return containsHash;
};

const threadDataContainsHash = (data: ThreadData, hash: string): boolean =>
  data.pages.some((page) =>
    page.result.casts.some((cast) => castTreeContainsHash(cast, hash)),
  );

const addCastToThreadData = ({
  data,
  cast,
  insertAt,
}: {
  data: ThreadData;
  cast: ApiCast;
  insertAt: 'top' | 'bottom';
}): ThreadData => {
  if (data.pages.length === 0 || threadDataContainsHash(data, cast.hash)) {
    return data;
  }

  const pageIndex = insertAt === 'top' ? 0 : data.pages.length - 1;
  const page = data.pages[pageIndex];
  const casts = page.result.casts;
  const nextCasts = insertAt === 'top' ? [cast, ...casts] : [...casts, cast];

  return {
    ...data,
    pages: data.pages.map((currentPage, currentPageIndex) =>
      currentPageIndex === pageIndex
        ? {
            ...currentPage,
            result: {
              ...currentPage.result,
              casts: nextCasts,
            },
          }
        : currentPage,
    ),
  };
};

const optimisticallyAddNewCastToThread = ({
  queryClient,
  parentCastHash,
  cast,
  insertAt,
}: {
  queryClient: QueryClient;
  parentCastHash: string;
  cast: ApiCast;
  insertAt: 'top' | 'bottom';
}) => {
  const threadQueryPrefixes = [
    buildThreadKey({ castHash: undefined }),
    buildUserThreadCastsKey({
      username: undefined,
      castHashPrefix: undefined,
    }),
  ];

  const matchingConversationQueryKeys: QueryKey[] = [];
  const focusedCastHashes = new Set<string>();

  queryClient
    .getQueriesData<ConversationCastRepliesData>({
      queryKey: [CONVERSATION_CAST_REPLIES_QUERY_PREFIX],
    })
    .forEach(([queryKey, data]) => {
      const queryParentCastHash = queryKey[2];
      if (
        queryParentCastHash !== parentCastHash &&
        !(
          data?.casts.some((cachedCast) =>
            castTreeContainsHash(cachedCast, parentCastHash),
          ) ?? false
        )
      ) {
        return;
      }

      matchingConversationQueryKeys.push(queryKey);
      const focusedCastHash = queryKey[1];
      if (typeof focusedCastHash === 'string') {
        focusedCastHashes.add(focusedCastHash);
      }
    });

  const matchingQueryKeys: QueryKey[] = [];

  threadQueryPrefixes.forEach((queryKey) => {
    queryClient
      .getQueriesData<ThreadData>({ queryKey })
      .forEach(([key, data]) => {
        if (!data) return;

        const containsParent = threadDataContainsHash(data, parentCastHash);
        const containsFocusedCast =
          !containsParent &&
          [...focusedCastHashes].some((focusedCastHash) =>
            threadDataContainsHash(data, focusedCastHash),
          );
        if (!containsParent && !containsFocusedCast) return;

        queryClient.setQueryData<ThreadData>(key, (previousData) =>
          previousData
            ? addCastToThreadData({ data: previousData, cast, insertAt })
            : undefined,
        );
        matchingQueryKeys.push(key);
      });
  });

  matchingQueryKeys.forEach((queryKey) => {
    void queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: 'none',
    });
  });

  matchingConversationQueryKeys.forEach((queryKey) => {
    void queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: 'none',
    });
  });
};

const useOptimisticallyAddNewCastToThread = (insertAt: 'top' | 'bottom') => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ parentCastHash, cast }: { parentCastHash: string; cast: ApiCast }) => {
      optimisticallyAddNewCastToThread({
        queryClient,
        parentCastHash,
        cast,
        insertAt,
      });
    },
    [queryClient, insertAt],
  );
};

export {
  optimisticallyAddNewCastToThread,
  useOptimisticallyAddNewCastToThread,
};
