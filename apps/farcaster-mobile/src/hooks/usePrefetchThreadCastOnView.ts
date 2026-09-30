import { ThreadItem, ThreadListItem } from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { ViewabilityConfigCallbackPairs } from 'react-native';

import {
  SharedViewToken,
  useCastViewabilityConfigs,
} from '~/hooks/useRecordCastOnViewWhenFocused';

import { usePrefetchThreadCast } from './usePrefetchThreadCast';

export function usePrefetchThreadCastOnView(): ViewabilityConfigCallbackPairs {
  const prefetchThreadCast = usePrefetchThreadCast();

  const onViewableItemsChanged = useCallback(
    ({ changed }: { changed: SharedViewToken[] }) => {
      for (const changedItem of changed) {
        if (changedItem.isViewable && changedItem.item) {
          const item = changedItem.item as ThreadListItem<ThreadItem>;
          prefetchThreadCast(item);
        }
      }
    },
    [prefetchThreadCast],
  );

  return useCastViewabilityConfigs(onViewableItemsChanged);
}
