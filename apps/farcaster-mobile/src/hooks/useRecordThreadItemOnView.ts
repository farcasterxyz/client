import { ThreadItem, ThreadListItem } from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { ViewabilityConfigCallbackPairs } from 'react-native';

import {
  SharedViewToken,
  useCastViewabilityConfigs,
  useRecordCastsOnViewWhenFocused,
} from '~/hooks/useRecordCastOnViewWhenFocused';

export function useRecordThreadItemOnView({
  isFocused,
}: {
  isFocused: boolean;
}): ViewabilityConfigCallbackPairs {
  const recordCastsOnViewWhenFocused = useRecordCastsOnViewWhenFocused({
    isFocused,
  });

  const onViewableItemsChanged = useCallback(
    ({ changed }: { changed: SharedViewToken[] }) => {
      for (const changedItem of changed) {
        if (changedItem.isViewable) {
          const item = changedItem.item as ThreadListItem<ThreadItem>;
          if (item.type === 'cast') {
            recordCastsOnViewWhenFocused([
              {
                castHash: item.wrappedCast.cast.hash,
                castAuthorFid: item.wrappedCast.cast.author.fid,
              },
            ]);
          }
        }
      }
    },
    [recordCastsOnViewWhenFocused],
  );

  return useCastViewabilityConfigs(onViewableItemsChanged);
}
