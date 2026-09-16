import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { sleep } from '../../../utils/PromiseUtils';
import { useInvalidateActiveChannelStreak } from '../queries/activeChannelStreak/useInvalidateActiveChannelStreak';
import { useInvalidateProfileSnapCasts } from '../queries/profileSnapCasts/useInvalidateProfileSnapCasts';
import { useInvalidateUserCasts } from '../queries/userCasts/useInvalidateUserCasts';
import { useInvalidateUserCastsAndReplies } from '../queries/userCastsAndReplies/useInvalidateUserCastsAndReplies';

function newClientRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `cast-${Date.now()}-${Math.random()}`
  );
}

const useCreateCast = () => {
  const { apiClient } = useFarcasterApiClient();

  const invalidateUserCasts = useInvalidateUserCasts();
  const invalidateUserCastsAndReplies = useInvalidateUserCastsAndReplies();
  const invalidateProfileSnapCasts = useInvalidateProfileSnapCasts();
  const invalidateActiveChannelStreak = useInvalidateActiveChannelStreak();

  return useCallback(
    async ({
      fid,
      castText,
      onCastAddedToList,
      parentCastHash,
      tokenKey,
      embeds,
      channelKey,
      clientProcessedOpenGraphMetadata,
      skipFeedRegenrationDelay = false,
    }: {
      fid: number;
      castText: string;
      parentCastHash?: string;
      tokenKey?: string;
      onCastAddedToList?: () => void;
      embeds?: string[];
      channelKey?: string;
      clientProcessedOpenGraphMetadata?: ApiOpenGraphMetadata[];
      skipFeedRegenrationDelay?: boolean;
    }) => {
      const clientRequestId = newClientRequestId();

      const response = await apiClient.createCast(
        {
          text: castText,
          parent:
            typeof parentCastHash !== 'undefined'
              ? { hash: parentCastHash }
              : undefined,
          tokenKey,
          embeds,
          channelKey,
          clientProcessedOpenGraphMetadata,
        },
        {
          headers: { 'Idempotency-Key': clientRequestId },
          retryLimit: 0,
        },
      );

      // Wait a bit to give the server a chance to regenerate the feed
      if (skipFeedRegenrationDelay) {
        await sleep(500);
      }

      invalidateUserCasts({ fid });
      invalidateUserCastsAndReplies({ fid });
      invalidateProfileSnapCasts({ fid });

      invalidateActiveChannelStreak({ fid });

      // We explicitly verify that `onCastAddedToList` is a function
      // because if we were to persist navigation params, close the app,
      // then reopen the app, the function would be reinstated as an object.
      // We don't currently persist navigation state, so this isn't a problem now,
      // just being precautious.
      if (typeof onCastAddedToList === 'function') {
        onCastAddedToList();
      }

      return response.data;
    },
    [
      apiClient,
      invalidateActiveChannelStreak,
      invalidateProfileSnapCasts,
      invalidateUserCasts,
      invalidateUserCastsAndReplies,
    ],
  );
};

export { useCreateCast };
