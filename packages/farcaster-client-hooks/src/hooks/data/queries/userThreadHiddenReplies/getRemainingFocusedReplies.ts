import { ApiCast } from 'farcaster-client-data';

import {
  buildDirectReplyHashesByParentHash,
  getLoadedDirectReplyHashes,
  getRemainingDirectReplyCount,
} from '../../../../utils';

const getRemainingFocusedReplies = ({
  casts,
  focusedCastHashPrefix,
}: {
  casts: ApiCast[];
  focusedCastHashPrefix: string;
}) => {
  const focusedCast = casts.find((cast) =>
    cast.hash.startsWith(focusedCastHashPrefix),
  );

  if (!focusedCast) {
    return 0;
  }

  const loadedDirectReplyHashes = getLoadedDirectReplyHashes({
    cast: focusedCast,
    directReplyHashesByParentHash: buildDirectReplyHashesByParentHash(casts),
  });

  return getRemainingDirectReplyCount({
    cast: focusedCast,
    loadedDirectReplyHashes,
  });
};

const shouldFetchFocusedConversationRepliesFallback = ({
  focusedCastHash,
  mainHasNextPage,
  remainingFocusedReplies,
  hiddenRepliesExhausted,
}: {
  focusedCastHash: string;
  mainHasNextPage: boolean | undefined;
  remainingFocusedReplies: number;
  hiddenRepliesExhausted: boolean;
}) =>
  focusedCastHash !== '' &&
  mainHasNextPage === false &&
  remainingFocusedReplies > 0 &&
  hiddenRepliesExhausted;

export {
  getRemainingFocusedReplies,
  shouldFetchFocusedConversationRepliesFallback,
};
