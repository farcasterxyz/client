import { InfiniteData } from '@tanstack/react-query';
import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiGetThread200Response,
  ApiGetUserThreadCasts200Response,
} from 'farcaster-client-data';
import {
  FeedSourceOn,
  useUserThreadWithHiddenReplies,
} from 'farcaster-client-hooks';
import { Suspense } from 'react';

import { Conversation } from '~/components/conversation/Conversation';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { buildCastsWithConversationContext } from '~/utils/castUtils';

interface ConversationAdapterProps {
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  focusedCastFullHashOrPrefix: string;
  cachedFocusedCast?: ApiCast;
  mainData:
    | InfiniteData<ApiGetThread200Response | ApiGetUserThreadCasts200Response>
    | undefined;
  mainHasNextPage: boolean | undefined;
  mainOnEndReached: () => unknown;
  mainRefetch: () => Promise<unknown>;
  isFetchingNextPage: boolean;
}

export function ConversationAdapter(props: ConversationAdapterProps) {
  // Important to have a Suspense boundary here to catch the promise thrown by useUserThreadWithHiddenReplies
  // and wait for mainData to be populated
  return (
    <Suspense fallback={<FullScreenLoadingIndicator />}>
      <ConversationAdapterContent {...props} />
    </Suspense>
  );
}

// Try to keep close to CastScreenWithCast on mobile
function ConversationAdapterContent({
  castOpenIncludeReason,
  sourceOn,
  focusedCastFullHashOrPrefix,
  cachedFocusedCast,
  mainData,
  mainHasNextPage,
  mainOnEndReached,
  mainRefetch,
  isFetchingNextPage,
}: ConversationAdapterProps) {
  const {
    focusedCast,
    threadItems,
    onEndReached,
    isFetching,
    hasHiddenReplies,
    showHiddenReplies,
    channel,
    token,
  } = useUserThreadWithHiddenReplies({
    focusedCastHashPrefix: focusedCastFullHashOrPrefix,
    cachedFocusedCast,
    mainData,
    mainHasNextPage,
    mainOnEndReached,
    mainRefetch,
    castWrapper: buildCastsWithConversationContext,
  });

  return (
    <Conversation
      castOpenIncludeReason={castOpenIncludeReason}
      sourceOn={sourceOn}
      focusedCast={focusedCast}
      threadItems={threadItems}
      onEndReached={onEndReached}
      isFetching={isFetching}
      isFetchingNextPage={isFetchingNextPage}
      channel={channel}
      token={token}
      hasHiddenReplies={hasHiddenReplies}
      showHiddenReplies={showHiddenReplies}
    />
  );
}
