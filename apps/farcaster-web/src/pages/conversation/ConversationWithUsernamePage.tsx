import {
  ApiCast,
  ApiCastFeedIncludeReason,
  CastHashPrefix,
} from 'farcaster-client-data';
import {
  FeedSourceOn,
  getCastFeedIncludeReasonType,
  getFeedSourceOn,
  useGetGloballyCachedCastWithUsernameAndPrefix,
  useNonSuspenseUserThreadCasts,
  useUserThreadCasts,
} from 'farcaster-client-hooks';
import { memo, useRef } from 'react';

import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useRedirectToWarpcastMobile } from '~/hooks/useRedirectToWarpcastMobile';

import { ConversationAdapter } from './ConversationAdapter';

const ConversationWithUsernamePage = memo(() => {
  const { castHashPrefix, username } = useParams('conversationWithUsername');
  const searchParams = useSearchParams('conversationWithUsername');
  const includeReason = getCastFeedIncludeReasonType(
    searchParams.includeReason,
  );
  const sourceOn = getFeedSourceOn(searchParams.sourceOn);

  const getGloballyCachedCast = useGetGloballyCachedCastWithUsernameAndPrefix({
    username: username ?? '',
    castHashPrefix: castHashPrefix ?? '',
  });

  const cachedApiCastRef = useRef<ApiCast | undefined>(getGloballyCachedCast());

  const cachedCast = cachedApiCastRef.current;

  useRedirectToWarpcastMobile();

  // Guard: On Android Chrome, router params can be briefly undefined during hydration.
  // Don't render conversation until we have valid params to avoid a failed fetch
  // with empty hash that would overwrite SSR state with "cast not found".
  if (!castHashPrefix || !username) {
    return <FullScreenLoadingIndicator />;
  }

  return !cachedCast ? (
    <WithSuspense
      username={username}
      castHashPrefix={castHashPrefix}
      castOpenIncludeReason={includeReason}
      sourceOn={sourceOn}
    />
  ) : (
    <WithoutSuspense
      username={username}
      castHashPrefix={castHashPrefix}
      castOpenIncludeReason={includeReason}
      sourceOn={sourceOn}
      cachedCast={cachedCast}
    />
  );
});

const WithSuspense = ({
  castHashPrefix,
  castOpenIncludeReason,
  sourceOn,
  username,
}: {
  castHashPrefix: CastHashPrefix;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  username: string;
}) => {
  const { data, hasNextPage, onEndReached, isFetchingNextPage, refetch } =
    useUserThreadCasts({
      castHashPrefix,
      username,
    });

  return (
    <ConversationAdapter
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      focusedCastFullHashOrPrefix={castHashPrefix}
      cachedFocusedCast={undefined}
      mainData={data}
      mainHasNextPage={hasNextPage}
      mainOnEndReached={onEndReached}
      mainRefetch={refetch}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
};

const WithoutSuspense = ({
  castHashPrefix,
  castOpenIncludeReason,
  cachedCast,
  sourceOn,
  username,
}: {
  castHashPrefix: CastHashPrefix;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  cachedCast: ApiCast;
  sourceOn?: FeedSourceOn;
  username: string;
}) => {
  const { data, hasNextPage, onEndReached, isFetchingNextPage, refetch } =
    useNonSuspenseUserThreadCasts({
      castHashPrefix,
      username,
    });

  return (
    <ConversationAdapter
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      focusedCastFullHashOrPrefix={castHashPrefix}
      cachedFocusedCast={cachedCast}
      mainData={data}
      mainHasNextPage={hasNextPage}
      mainOnEndReached={onEndReached}
      mainRefetch={refetch}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
};

ConversationWithUsernamePage.displayName = 'ConversationWithUsernamePage';

export { ConversationWithUsernamePage };
