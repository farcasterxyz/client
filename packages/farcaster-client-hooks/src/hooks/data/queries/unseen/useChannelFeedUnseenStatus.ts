import { useMemo } from 'react';

import { useUnseen } from '../../../../providers/UnseenProvider';
import { useWasEverTrue } from '../../helpers';

export function useChannelFeedUnseenStatus(
  channelKey: string,
  mainFeed: boolean,
) {
  const { channelFeedsUnseenStatus } = useUnseen();

  const homeFeedHasNewItems = useMemo(
    () =>
      mainFeed
        ? (channelFeedsUnseenStatus[channelKey]?.hasNewItems ?? false)
        : false,
    [channelFeedsUnseenStatus, channelKey, mainFeed],
  );

  // We want to prevent showing the "New casts" toast when opening a feed with unseen
  // items (due to race conditions on the backend between the two endpoints), so we only
  // show it after we have specifically received a `false` from the backend at least once
  const feedHasNoNewItems = useMemo(
    () =>
      mainFeed
        ? channelFeedsUnseenStatus[channelKey]?.hasNewItems === false
        : true,
    [channelFeedsUnseenStatus, channelKey, mainFeed],
  );
  const everHadNoNewItems = useWasEverTrue(feedHasNoNewItems);

  return everHadNoNewItems && homeFeedHasNewItems;
}
