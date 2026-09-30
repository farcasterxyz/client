import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';
import { ViewabilityConfigCallbackPairs } from 'react-native';

import {
  SharedViewToken,
  useCastViewabilityConfigs,
  useRecordCastsOnViewWhenFocused,
} from '~/hooks/useRecordCastOnViewWhenFocused';

export function useRecordCastOnView({
  isFocused,
}: {
  isFocused: boolean;
}): ViewabilityConfigCallbackPairs {
  const recordCastsOnViewWhenFocused = useRecordCastsOnViewWhenFocused({
    isFocused,
  });

  const onViewableItemsChanged = useCallback(
    ({ changed }: { changed: SharedViewToken[] }) => {
      for (const chanedItem of changed) {
        if (chanedItem.isViewable) {
          const cast = chanedItem.item as ApiCast;
          recordCastsOnViewWhenFocused([
            {
              castHash: cast.hash,
              castAuthorFid: cast.author.fid,
            },
          ]);
        }
      }
    },
    [recordCastsOnViewWhenFocused],
  );

  return useCastViewabilityConfigs(onViewableItemsChanged);
}
