import { useQueries, useQueryClient } from '@tanstack/react-query';
import { ApiCast } from 'farcaster-client-data';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useTelemetry } from '../../../../providers/TelemetryProvider';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast/useBatchMergeIntoGloballyCachedCasts';
import {
  buildConversationCastRepliesFetcher,
  PrefixesFetchStates,
} from './buildConversationCastRepliesFetcher';
import { buildConversationCastRepliesKey } from './buildConversationCastRepliesKey';

// Hard cap on reply-tree recursion depth. `replies.casts` is network/cache
// controlled and can be cyclic (A→B→A) or pathologically deep; either would
// overflow the JS call stack and abort Hermes (SIGABRT). The depth cap plus the
// per-path visited set below make the walk safe.
const MAX_REPLY_TREE_DEPTH = 32;

export type FetchMoreReplies = ({
  parentCastHash,
  excludeReplyHashes,
}: {
  parentCastHash: string;
  excludeReplyHashes: string[] | undefined;
}) => void;

export function useConversationCastReplies({
  casts,
  focusedCastHash,
}: {
  casts: ApiCast[];
  focusedCastHash: string;
}) {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();
  const telemetry = useTelemetry();

  // Reset all data for the focused cast when it is first passed in as a prop
  // so that we don't show stale replies. Logic is similar to usePurgedInfiniteQuery,
  // in that we specifically have to do this during the render pass and not in a useEffect
  const hasRenderedRef = useRef<string[]>([]);
  if (focusedCastHash && !hasRenderedRef.current.includes(focusedCastHash)) {
    queryClient.removeQueries({
      queryKey: buildConversationCastRepliesKey({
        focusedCastHash,
      }),
    });
    hasRenderedRef.current.push(focusedCastHash);
  }

  // Internal state. Stored in a ref because it is updated in the fetcher which we
  // don't want to trigger renders, and because it needs be preserved between renders
  // when castHashPrefix may change
  const fetchStates = useRef<PrefixesFetchStates>({});

  // Since we store all state in a ref, changes won't trigger queries, so
  // we add a dummy update variable that is incremented to trigger queries
  const [update, setUpdate] = useState(0);

  // Explode pages into queries to fetch
  const parentCastPages = useMemo(() => {
    const thisFetchStates = fetchStates.current[focusedCastHash];

    const pages: { parentCastHash: string; page: number }[] = [];
    Object.entries(thisFetchStates || {}).forEach(
      ([parentCastHash, fetchState]) => {
        for (let i = 0; i <= fetchState.maxPageIndex; i++) {
          pages.push({
            parentCastHash,
            page: i,
          });
        }
      },
    );
    return pages;
    // We need to include update as that's the way updates are triggered when a page
    // is added
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedCastHash, update]);

  // Disable suspense so whole thread screen doesn't flash
  const results = useQueries({
    queries: parentCastPages.map((parentCastPage) => ({
      queryKey: buildConversationCastRepliesKey({
        focusedCastHash,
        parentCastHash: parentCastPage.parentCastHash,
        page: parentCastPage.page,
      }),
      queryFn: buildConversationCastRepliesFetcher({
        apiClient,
        focusedCastHash: focusedCastHash,
        parentCastHash: parentCastPage.parentCastHash,
        page: parentCastPage.page,
        fetchStates,
        batchMergeIntoGloballyCachedCasts,
      }),
    })),
  });

  const castHashesReadyForNextReplyPage = useMemo(() => {
    const requestStates = new Map<
      string,
      {
        requestedPages: number;
        completedPages: number;
        isFetching: boolean;
        hasError: boolean;
      }
    >();

    parentCastPages.forEach(({ parentCastHash }, index) => {
      const requestState = requestStates.get(parentCastHash) ?? {
        requestedPages: 0,
        completedPages: 0,
        isFetching: false,
        hasError: false,
      };
      const result = results[index];

      requestState.requestedPages += 1;
      requestState.completedPages += result.data !== undefined ? 1 : 0;
      requestState.isFetching ||= result.isFetching;
      requestState.hasError ||= result.isError;
      requestStates.set(parentCastHash, requestState);
    });

    return [...requestStates.entries()]
      .filter(([parentCastHash, requestState]) => {
        const fetchState =
          fetchStates.current[focusedCastHash]?.[parentCastHash];

        return (
          requestState.completedPages === requestState.requestedPages &&
          !requestState.isFetching &&
          !requestState.hasError &&
          fetchState?.noMoreReplies === false
        );
      })
      .map(([parentCastHash]) => parentCastHash);
  }, [focusedCastHash, parentCastPages, results]);

  const mergedResults = useMemo(() => {
    const startTime = Date.now();
    // Convert the results into an array so we can sort them
    const resultsForSorting = results.reduce(
      (acc, result) => {
        if (result.data) {
          acc.push([
            result.data.parentCastHash,
            result.data.page,
            result.data.casts,
          ]);
        }
        return acc;
      },
      [] as [string, number, ApiCast[]][],
    );

    // Sort by castHash, then page
    resultsForSorting.sort((a, b) => {
      if (a[0] < b[0]) {
        return -1;
      } else if (a[0] > b[0]) {
        return 1;
      } else {
        return a[1] - b[1];
      }
    });

    // Merge the pages
    const mergedResults = resultsForSorting.reduce(
      (acc, result) => {
        const castHash = result[0];
        const casts = result[2];

        const existingResult = acc[castHash];
        if (!existingResult) {
          acc[castHash] = [...casts];
        } else {
          existingResult.push(...casts);
        }

        return acc;
      },
      {} as Record<string, ApiCast[]>,
    );

    function insertExtraRepliesRecursively(
      cast: ApiCast,
      depth: number,
      ancestors: Set<string>,
    ): ApiCast {
      // Stop expanding on a cycle (cast already on the current path) or once we
      // hit the depth cap — either case would otherwise recurse without bound.
      if (depth >= MAX_REPLY_TREE_DEPTH || ancestors.has(cast.hash)) {
        return cast;
      }

      const extraReplies = mergedResults[cast.hash];

      const repliesWithFallback =
        typeof cast.replies === 'undefined' ? [] : cast.replies.casts;

      let tempReplies = repliesWithFallback;
      if (extraReplies) {
        tempReplies = [...(tempReplies || []), ...extraReplies];
      }

      if (tempReplies) {
        // Only sticking the most interesting reply or all replies from self
        // as we are moving away from angled lines
        const authorReplies = tempReplies.filter(
          (tr) => tr.author.fid === cast.author.fid,
        );
        const nonAuthorReplies =
          authorReplies.length !== 0 ? [] : tempReplies.slice(0, 1);

        ancestors.add(cast.hash);
        const newReplies = [...authorReplies, ...nonAuthorReplies].map(
          (reply) => insertExtraRepliesRecursively(reply, depth + 1, ancestors),
        );
        ancestors.delete(cast.hash);

        const repliesObjectWithFallback =
          typeof cast.replies === 'undefined'
            ? { count: 0, casts: [] }
            : cast.replies;

        const newCast = { ...cast };
        newCast.replies = { ...repliesObjectWithFallback };
        newCast.replies.casts = newReplies;
        return newCast;
      } else {
        return cast;
      }
    }

    // Insert the extra replies in the original data
    const mergedCasts = casts.map((cast) =>
      insertExtraRepliesRecursively(cast, 0, new Set<string>()),
    );
    telemetry.maybeAddFrameDroppingAction(
      'farcaster-client-hooks.useConversationCastReplies.mergeResults',
      Date.now() - startTime,
      {
        focusedCastHash,
      },
    );
    return mergedCasts;
  }, [casts, focusedCastHash, results, telemetry]);

  const fetchMoreReplies: FetchMoreReplies = useCallback(
    ({
      parentCastHash,
      excludeReplyHashes,
    }: {
      parentCastHash: string;
      excludeReplyHashes: string[] | undefined;
    }) => {
      let thisFetchStates = fetchStates.current[focusedCastHash];
      if (!thisFetchStates) {
        thisFetchStates = {};
        fetchStates.current[focusedCastHash] = thisFetchStates;
      }

      let fetchState = thisFetchStates[parentCastHash];
      if (fetchState && fetchState.noMoreReplies) {
        // At end -> do not add a page
        return;
      }

      if (!fetchState) {
        fetchState = {
          excludeReplyHashes,
          maxPageIndex: 0,
          noMoreReplies: false,
        };
        thisFetchStates[parentCastHash] = fetchState;
      } else {
        fetchState.maxPageIndex += 1;
      }

      // Trigger recalculation of queries
      setUpdate((update) => update + 1);
    },
    [focusedCastHash],
  );

  return {
    data: mergedResults,
    fetchMoreReplies,
    castHashesWithRequestedReplies: Object.keys(
      fetchStates.current[focusedCastHash] || {},
    ),
    castHashesReadyForNextReplyPage,
    castHashesWithNoMoreReplies: Object.entries(
      fetchStates.current[focusedCastHash] || {},
    )
      .filter(([_, fetchState]) => fetchState.noMoreReplies === true)
      .map(([parentCastHash]) => parentCastHash),
  };
}
