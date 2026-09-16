import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserProfile } from 'farcaster-client-data';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { Clickable } from '~/components/motion/Clickable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { useShowFarcasterProUpsellModal } from './FarcasterProUpsellModal';

function FarcasterProBadgeOnProfileUpsell({
  userProfile,
}: {
  userProfile: ApiUserProfile;
}) {
  const { fid, profile } = useCurrentUser();

  const { trackEvent } = useAnalytics();

  const showFarcasterProUpsellModal = useShowFarcasterProUpsellModal();

  const onCtaClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.FarcasterProUpsellBubbleClick, {
      via: 'self-profile',
    });

    showFarcasterProUpsellModal();
  }, [showFarcasterProUpsellModal, trackEvent]);

  if (profile.accountLevel === 'pro') {
    return null;
  }

  if (userProfile.user.fid !== fid) {
    return null;
  }

  return (
    <Clickable disabled={false} onClick={onCtaClick}>
      <div className="ml-2 flex flex-row items-center gap-1 rounded-full border-[0.3px] border-[#F8F6FF] bg-[#F8F6FF] p-3 px-2 py-1 dark:border-[#231A36] dark:bg-[#1B1429]">
        <FarcasterProBadge size={20} />
        <div className="text-sm font-medium text-default">Upgrade</div>
      </div>
    </Clickable>
  );
}

export { FarcasterProBadgeOnProfileUpsell };
