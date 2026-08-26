import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { shareUrl } from '~/utils/SharingUtils';

export const useShareChannel = ({
  channelKey,
  location,
}: {
  channelKey: string;
  location: string;
}) => {
  const { trackEvent } = useAnalytics();

  return useCallback(() => {
    trackEvent(AnalyticsEvent.ShareChannel, {
      channelKey,
      location,
    });

    shareUrl({
      title: `/${channelKey} on Farcaster`,
      url: `https://farcaster.xyz/~/channel/${channelKey}`,
    });
  }, [channelKey, location, trackEvent]);
};
