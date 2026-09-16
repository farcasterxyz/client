import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  ApiCast,
  ApiChain,
  ApiGetThread200Response,
  ApiGetUserThreadCasts200Response,
  EIP7528_NATIVE_ASSET_ADDRESS,
  isNativeAsset,
  SOLANA_NATIVE_ASSET_ADDRESS,
} from 'farcaster-client-data';
import uniqBy from 'lodash/uniqBy';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildDirectReplyHashesByParentHash,
  castIsParentUrlHeader,
  castKeyExtractor,
  CastWrapper,
  extractCastKey,
  getLoadedDirectReplyHashes,
  parseCaip19TokenUri,
  ThreadListItem,
  WrappedCast,
} from '../../../../utils';
import { useConversationCastReplies } from '../conversationCastReplies';
import { useNonSuspenseToken } from '../token/useToken';
import { buildUserThreadHiddenRepliesKey } from './buildUserThreadHiddenRepliesKey';
import {
  getRemainingFocusedReplies,
  shouldFetchFocusedConversationRepliesFallback,
} from './getRemainingFocusedReplies';
import { usePurgedUserThreadHiddenReplies } from './usePurgedUserThreadHiddenReplies';

export function useUserThreadWithHiddenReplies<T extends WrappedCast>({
  focusedCastHashPrefix,
  cachedFocusedCast,
  mainData,
  mainHasNextPage,
  mainOnEndReached,
  mainRefetch,
  castWrapper,
}: {
  focusedCastHashPrefix: string;
  cachedFocusedCast: ApiCast | undefined;
  mainData:
    | InfiniteData<ApiGetThread200Response | ApiGetUserThreadCasts200Response>
    | undefined;
  mainHasNextPage: boolean | undefined;
  mainOnEndReached: () => unknown;
  mainRefetch: () => Promise<unknown>;
  castWrapper: CastWrapper<T>;
}) {
  const mainCasts = useMemo(() => {
    // Show the cached focused cast while waiting for the API response
    // FIXME: Why would we ever have a cached cast with no author defined
    if (
      !mainData &&
      cachedFocusedCast !== undefined &&
      typeof cachedFocusedCast.author !== 'undefined'
    ) {
      return [cachedFocusedCast];
    }

    return (
      uniqBy(
        mainData?.pages.flatMap((page) => page.result.casts) || [],
        castKeyExtractor,
      )
        // Remove embed-only root cast
        .filter((cast) => !castIsParentUrlHeader(cast))
    );
  }, [mainData, cachedFocusedCast]);

  const mainFetched = useMemo(() => mainData !== undefined, [mainData]);

  const remainingFocusedReplies = useMemo(
    () =>
      mainFetched
        ? getRemainingFocusedReplies({
            casts: mainCasts,
            focusedCastHashPrefix,
          })
        : 0,
    [focusedCastHashPrefix, mainCasts, mainFetched],
  );

  const hasHiddenReplies = useMemo(() => {
    const apiHasHiddenReplies =
      mainData?.pages.some((page) => page.result.hasHiddenReplies) ?? false;

    return apiHasHiddenReplies || remainingFocusedReplies > 0;
  }, [mainData?.pages, remainingFocusedReplies]);

  const channelDisallowed = useMemo(
    () => mainData?.pages.some((page) => page.result.disallowed) ?? false,
    [mainData?.pages],
  );

  const focusedCast = useMemo(
    () => mainCasts.find((cast) => cast.hash.startsWith(focusedCastHashPrefix)),
    [mainCasts, focusedCastHashPrefix],
  );

  const focusedCastHash = useMemo(() => focusedCast?.hash ?? '', [focusedCast]);

  const [hiddenRepliesShown, setHiddenRepliesShown] = useState(false);
  const showHiddenReplies = useCallback(() => {
    setHiddenRepliesShown(true);
  }, []);

  const hiddenRepliesCacheKey = useMemo(
    () => buildUserThreadHiddenRepliesKey({ focusedCastHash }),
    [focusedCastHash],
  );

  const hiddenRepliesVisible = useMemo(
    () =>
      // Only start querying for hidden casts once:
      // - We have a full focused cast hash
      focusedCastHash !== '' &&
      // - Main has been fetched
      mainFetched &&
      // - We have reached the end of the main replies
      !mainHasNextPage &&
      // - We have hidden replies to display
      hasHiddenReplies &&
      // - User has clicked to show hidden replies
      hiddenRepliesShown,
    [
      focusedCastHash,
      hasHiddenReplies,
      hiddenRepliesShown,
      mainHasNextPage,
      mainFetched,
    ],
  );

  const shouldPreloadMissingFocusedReplies =
    focusedCastHash !== '' &&
    mainFetched &&
    mainHasNextPage === false &&
    remainingFocusedReplies > 0;

  const {
    data: hiddenRepliesData,
    onEndReached: hiddenRepliesOnEndReached,
    isPending: hiddenRepliesLoading,
    hasNextPage: hiddenRepliesHasNextPage,
  } = usePurgedUserThreadHiddenReplies({
    focusedCastHash,
    enabled: hiddenRepliesVisible || shouldPreloadMissingFocusedReplies,
  });

  const queryClient = useQueryClient();
  const purgeHiddenReplies = useCallback(() => {
    queryClient.removeQueries({
      queryKey: hiddenRepliesCacheKey,
    });
  }, [queryClient, hiddenRepliesCacheKey]);

  const hiddenReplies = useMemo(
    () => hiddenRepliesData?.pages.flatMap((page) => page.result.casts) || [],
    [hiddenRepliesData?.pages],
  );

  const hiddenRepliesExhausted =
    hiddenRepliesData !== undefined && hiddenRepliesHasNextPage !== true;
  const hiddenRepliesExhaustedEmpty =
    hiddenRepliesExhausted && hiddenReplies.length === 0;

  const numMainCasts = useMemo(() => mainCasts.length, [mainCasts.length]);

  const allCasts = useMemo(
    () => (hiddenRepliesVisible ? [...mainCasts, ...hiddenReplies] : mainCasts),
    [hiddenRepliesVisible, mainCasts, hiddenReplies],
  );

  const {
    data: allCastsWithDynamicReplies,
    fetchMoreReplies,
    castHashesWithRequestedReplies,
    castHashesReadyForNextReplyPage,
    castHashesWithNoMoreReplies,
  } = useConversationCastReplies({
    casts: allCasts,
    focusedCastHash,
  });

  const castsForFocusedReplyRecovery = useMemo(
    () =>
      hiddenRepliesVisible
        ? allCastsWithDynamicReplies
        : [...allCastsWithDynamicReplies, ...hiddenReplies],
    [allCastsWithDynamicReplies, hiddenReplies, hiddenRepliesVisible],
  );

  const remainingFocusedRepliesAfterHiddenReplies = useMemo(
    () =>
      getRemainingFocusedReplies({
        casts: castsForFocusedReplyRecovery,
        focusedCastHashPrefix,
      }),
    [castsForFocusedReplyRecovery, focusedCastHashPrefix],
  );

  const focusedLoadedDirectReplyHashes = useMemo(() => {
    const focusedCastForReplyRecovery = castsForFocusedReplyRecovery.find(
      (cast) => cast.hash === focusedCastHash,
    );

    return focusedCastForReplyRecovery
      ? getLoadedDirectReplyHashes({
          cast: focusedCastForReplyRecovery,
          directReplyHashesByParentHash: buildDirectReplyHashesByParentHash(
            castsForFocusedReplyRecovery,
          ),
        })
      : [];
  }, [castsForFocusedReplyRecovery, focusedCastHash]);

  const focusedConversationFallbackWasRequested =
    castHashesWithRequestedReplies.includes(focusedCastHash);
  const focusedConversationFallbackIsReadyForNextPage =
    castHashesReadyForNextReplyPage.includes(focusedCastHash);

  useEffect(() => {
    if (
      !shouldFetchFocusedConversationRepliesFallback({
        focusedCastHash,
        mainHasNextPage,
        remainingFocusedReplies: remainingFocusedRepliesAfterHiddenReplies,
        hiddenRepliesExhausted,
      }) ||
      (focusedConversationFallbackWasRequested &&
        !focusedConversationFallbackIsReadyForNextPage)
    ) {
      return;
    }

    fetchMoreReplies({
      parentCastHash: focusedCastHash,
      excludeReplyHashes: focusedLoadedDirectReplyHashes,
    });
  }, [
    fetchMoreReplies,
    focusedCastHash,
    focusedConversationFallbackIsReadyForNextPage,
    focusedConversationFallbackWasRequested,
    focusedLoadedDirectReplyHashes,
    hiddenRepliesExhausted,
    mainHasNextPage,
    remainingFocusedRepliesAfterHiddenReplies,
  ]);

  const wrappedCastItems = castWrapper({
    focusedCastHash: focusedCastHash,
    casts: allCastsWithDynamicReplies,
    onShowMorePress: fetchMoreReplies,
    castHashesWithRequestedReplies,
    castHashesWithNoMoreReplies,
    hasHiddenReplies,
    hiddenRepliesVisible,
    numMainCasts,
    channelDisallowed,
  });

  const threadItems: ThreadListItem<T>[] = useMemo(
    () =>
      buildThreadItemsWithHiddenReplies({
        wrappedCastItems,
        hasHiddenReplies,
        hiddenReplies,
        hiddenRepliesVisible,
        hiddenRepliesExhaustedEmpty,
        mainHasNextPage,
      }),
    [
      wrappedCastItems,
      hasHiddenReplies,
      hiddenReplies,
      hiddenRepliesVisible,
      hiddenRepliesExhaustedEmpty,
      mainHasNextPage,
    ],
  );

  const onEndReached: () => unknown = useCallback(async () => {
    if (
      hiddenRepliesVisible ||
      // Preload first page of hidden casts when reached
      (focusedCastHash !== '' &&
        mainFetched &&
        !mainHasNextPage &&
        hasHiddenReplies &&
        hiddenRepliesData === undefined)
    ) {
      return hiddenRepliesOnEndReached();
    } else if (!mainFetched || mainHasNextPage) {
      return mainOnEndReached();
    }
  }, [
    focusedCastHash,
    hasHiddenReplies,
    mainOnEndReached,
    mainFetched,
    mainHasNextPage,
    hiddenRepliesData,
    hiddenRepliesVisible,
    hiddenRepliesOnEndReached,
  ]);

  const refetch: () => Promise<unknown> = useCallback(async () => {
    purgeHiddenReplies();
    setHiddenRepliesShown(false);
    mainRefetch();
  }, [mainRefetch, purgeHiddenReplies]);

  const isFetching = useMemo(
    () => !mainFetched || (hiddenRepliesVisible && hiddenRepliesLoading),
    [mainFetched, hiddenRepliesLoading, hiddenRepliesVisible],
  );

  const channel = useMemo(() => {
    if (mainCasts.length === 0 || !mainCasts[0]) {
      return undefined;
    }

    return mainCasts[0].channel;
  }, [mainCasts]);

  const { token, tokenKey } = useMemo(() => {
    if (mainCasts.length === 0 || !mainCasts[0]) {
      return { token: undefined, tokenKey: undefined };
    }

    const token = mainCasts[0].token;
    if (token) {
      return { token };
    }

    const parentUrl = mainCasts.find((cast) => cast.parentSource?.url)
      ?.parentSource?.url;
    if (parentUrl) {
      const parsed = parseCaip19TokenUri(parentUrl);
      if (parsed) {
        return {
          tokenKey: { ca: parsed.ca, chain: parsed.chain },
        };
      }
    }

    return {};
  }, [mainCasts]);

  const { data: fallbackToken } = useNonSuspenseToken({
    params: {
      chain: tokenKey?.chain ?? 'base',
      ca: tokenKey?.ca ?? '',
    },
    query: {
      enabled: !!tokenKey,
    },
  });

  const finalToken = useMemo(() => {
    const formatTokenAddress = (chain: ApiChain, ca?: string) => {
      if (!ca || isNativeAsset(ca)) {
        return chain === 'solana'
          ? SOLANA_NATIVE_ASSET_ADDRESS
          : EIP7528_NATIVE_ASSET_ADDRESS;
      }

      return ca;
    };

    const formatTokenDecimals = (chain: ApiChain, decimals?: number) => {
      if (!decimals) {
        return chain === 'solana' ? 9 : 18;
      }

      return decimals;
    };

    if (fallbackToken?.token) {
      return {
        chain: fallbackToken.token.chain,
        ca: formatTokenAddress(
          fallbackToken.token.chain,
          fallbackToken.token.ca,
        ),
        name: fallbackToken.token.name,
        symbol: fallbackToken.token.ticker,
        decimals: formatTokenDecimals(
          fallbackToken.token.chain,
          fallbackToken.token.decimals,
        ),
        imageUrl: fallbackToken.token.imageUrl,
        priceUsd: Number(fallbackToken.token.priceUsd || '0'),
      };
    }
    return token;
  }, [fallbackToken?.token, token]);

  return {
    focusedCast,
    threadItems,
    onEndReached,
    refetch,
    isFetching,
    hasHiddenReplies,
    showHiddenReplies,
    channel,
    token: finalToken,
    channelDisallowed,
    hasNextPage: mainHasNextPage,
  };
}

export function extractThreadListItemKey<T extends WrappedCast>(
  item: ThreadListItem<T>,
) {
  if (item.type === 'hiddenRepliesHeader') {
    // Should be always 1
    return 'hiddenRepliesHeader';
  } else {
    return extractCastKey(item.wrappedCast.cast);
  }
}

function buildThreadItemsWithHiddenReplies<T extends WrappedCast>({
  wrappedCastItems,
  hasHiddenReplies,
  hiddenReplies,
  hiddenRepliesVisible,
  hiddenRepliesExhaustedEmpty,
  mainHasNextPage,
}: {
  wrappedCastItems: T[];
  hasHiddenReplies: boolean;
  hiddenReplies: ApiCast[];
  hiddenRepliesVisible: boolean;
  hiddenRepliesExhaustedEmpty: boolean;
  mainHasNextPage: boolean | undefined;
}): ThreadListItem<T>[] {
  const castThreadItems = wrappedCastItems.map(
    (wrappedCast) =>
      ({ type: 'cast', wrappedCast }) satisfies ThreadListItem<T>,
  );

  if (!hasHiddenReplies || hiddenRepliesExhaustedEmpty) {
    return castThreadItems;
  } else if (!hiddenRepliesVisible || hiddenReplies.length === 0) {
    const items: ThreadListItem<T>[] = [...castThreadItems];

    // We only want to show this indicator if user already ended up at the end of the
    // main thread load.
    if (!mainHasNextPage) {
      items.push({ type: 'hiddenRepliesHeader', hiddenRepliesVisible });
    }

    return items;
  } else {
    const firstReplyId = hiddenReplies[0].hash;
    const firstReplyIndex = wrappedCastItems.findIndex(
      (item) => item.cast.hash === firstReplyId,
    );
    if (firstReplyIndex === -1) {
      // Should never happen
      return castThreadItems;
    } else {
      return [
        ...castThreadItems.slice(0, firstReplyIndex),
        { type: 'hiddenRepliesHeader', hiddenRepliesVisible },
        ...castThreadItems.slice(firstReplyIndex),
      ];
    }
  }
}
