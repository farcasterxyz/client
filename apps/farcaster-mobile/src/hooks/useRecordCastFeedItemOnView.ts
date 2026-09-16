import {
  FeedItemType,
  MixedFeedItem,
  useSetSuggestedUsersSeen,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { ViewabilityConfigCallbackPairs } from 'react-native';

import {
  SharedViewToken,
  useCastViewabilityConfigs,
  useRecordCastsOnViewWhenFocused,
} from '~/hooks/useRecordCastOnViewWhenFocused';

export function useRecordCastFeedItemOnView({
  isFocused,
}: {
  isFocused: boolean;
}): ViewabilityConfigCallbackPairs {
  const recordCastsOnViewWhenFocused = useRecordCastsOnViewWhenFocused({
    isFocused,
  });
  const setSuggestedUsersSeen = useSetSuggestedUsersSeen();

  const onViewableItemsChanged = useCallback(
    ({ changed }: { changed: SharedViewToken[] }) => {
      for (const changedItem of changed) {
        if (changedItem.isViewable && changedItem.item) {
          const item = changedItem.item as MixedFeedItem;
          if (item.type === FeedItemType.Cast) {
            const includeReason = item.item.meta?.includeReason?.type;
            const castViews = [
              {
                castHash: item.item.cast.hash,
                castAuthorFid: item.item.cast.author.fid,
                ...(includeReason ? { includeReason } : {}),
                ...(typeof changedItem.index === 'number'
                  ? { index: changedItem.index }
                  : {}),
              },
              ...(item.item.replies?.map((reply) => ({
                castHash: reply.hash,
                castAuthorFid: reply.author.fid,
                ...(includeReason ? { includeReason } : {}),
                ...(typeof changedItem.index === 'number'
                  ? { index: changedItem.index }
                  : {}),
              })) ?? []),
            ];
            recordCastsOnViewWhenFocused(castViews);
          } else if (item.type === FeedItemType.UserRecommendations) {
            const fids = item.item.users.map((user) => user.fid);
            setSuggestedUsersSeen({ fids });
          }
        }
      }
    },
    [recordCastsOnViewWhenFocused, setSuggestedUsersSeen],
  );

  return useCastViewabilityConfigs(onViewableItemsChanged);
}
