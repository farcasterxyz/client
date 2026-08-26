import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { AnimatedPressable } from 'farcaster-expo';
import React from 'react';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

const upsellBackgroundStylesLight = {
  backgroundColor: '#F8F6FF',
  borderColor: '#F8F6FF',
};

const upsellBackgroundStylesDark = {
  backgroundColor: '#1B1429',
  borderColor: '#231A36',
};

function FarcasterProBadgeOnProfileUpsell({ user }: { user: ApiUser }) {
  const { fid, profile } = useCurrentUser_UNSAFE();

  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const push = usePush();

  const onPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.FarcasterProUpsellBubbleClick, {
      via: 'self-profile',
    });

    triggerImpactAsync();

    push('FarcasterProUpsell', { source: 'self-profile' });
  }, [push, trackEvent, triggerImpactAsync]);

  if (profile.accountLevel === 'pro') {
    return null;
  }

  if (user.fid !== fid) {
    return null;
  }

  return (
    <AnimatedPressable
      disabled={false}
      onPress={onPress}
      style={[
        t.mL2,
        t.flexRow,
        t.itemsCenter,
        t.roundedFull,
        t.border,
        t.pX2,
        { gap: 4, paddingVertical: 2 },
        t.dark ? upsellBackgroundStylesDark : upsellBackgroundStylesLight,
      ]}
    >
      <FarcasterProBadge size={18} />
      <Text2 weight="medium" size="xs">
        Upgrade
      </Text2>
    </AnimatedPressable>
  );
}

export { FarcasterProBadgeOnProfileUpsell };
