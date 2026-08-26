import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  FeedSourceOn,
  getCastFeedIncludeReasonType,
  getFeedSourceOn,
  useGetGloballyCachedCast,
  useNonSuspenseThread,
  useThread,
} from 'farcaster-client-hooks';
import { memo, useRef } from 'react';

import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useRedirectToWarpcastMobile } from '~/hooks/useRedirectToWarpcastMobile';

import { ConversationAdapter } from './ConversationAdapter';

const ConversationWithoutUsernamePage: React.FC = memo(() => {
  const { castHash } = useParams('conversationWithoutUsername');
  const searchParams = useSearchParams('conversationWithoutUsername');
  const includeReason = getCastFeedIncludeReasonType(
    searchParams.includeReason,
  );
  const sourceOn = getFeedSourceOn(searchParams.sourceOn);

  const getGloballyCachedCast = useGetGloballyCachedCast();

  const cachedApiCastRef = useRef<ApiCast | undefined>(
    getGloballyCachedCast({ hash: castHash ?? '', recast: false }),
  );

  const cachedCast = cachedApiCastRef.current;

  useRedirectToWarpcastMobile();

  // Guard: On Android Chrome, router params can be briefly undefined during hydration.
  if (!castHash) {
    return <FullScreenLoadingIndicator />;
  }

  return !cachedCast ? (
    <WithSuspense
      castHash={castHash}
      castOpenIncludeReason={includeReason}
      sourceOn={sourceOn}
    />
  ) : (
    <WithoutSuspense
      castHash={castHash}
      castOpenIncludeReason={includeReason}
      sourceOn={sourceOn}
      cachedCast={cachedCast}
    />
  );
});

const WithSuspense = ({
  castHash,
  castOpenIncludeReason,
  sourceOn,
}: {
  castHash: string;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
}) => {
  const { data, hasNextPage, onEndReached, isFetchingNextPage, refetch } =
    useThread({
      castHash,
    });

  return (
    <ConversationAdapter
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      focusedCastFullHashOrPrefix={castHash}
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
  castHash,
  castOpenIncludeReason,
  cachedCast,
  sourceOn,
}: {
  castHash: string;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  cachedCast: ApiCast;
  sourceOn?: FeedSourceOn;
}) => {
  const { data, hasNextPage, onEndReached, isFetchingNextPage, refetch } =
    useNonSuspenseThread({
      castHash,
    });

  return (
    <ConversationAdapter
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      focusedCastFullHashOrPrefix={castHash}
      cachedFocusedCast={cachedCast}
      mainData={data}
      mainHasNextPage={hasNextPage}
      mainOnEndReached={onEndReached}
      mainRefetch={refetch}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
};

ConversationWithoutUsernamePage.displayName = 'ConversationWithoutUsernamePage';

export { ConversationWithoutUsernamePage };
