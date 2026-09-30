import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  Text2,
  useHaptics,
  useTheme,
} from 'farcaster-expo';
import React from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

export function MiniAppDeveloperPill({ developer }: { developer: ApiUser }) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const push = usePush();

  const { triggerImpactAsync } = useHaptics();

  const onPress = React.useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.PressArticleDev, { fid: developer.fid });

    push('UserV2', { fid: developer.fid });
  }, [developer.fid, push, trackEvent, triggerImpactAsync]);

  const pressableStyle = React.useMemo(
    () => [
      t.selfStart,
      t.backgrounds.secondary,
      t.pX2,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      { borderRadius: 16, gap: 8, paddingVertical: 6 },
    ],
    [
      t.backgrounds.secondary,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.pX2,
      t.selfStart,
    ],
  );

  return (
    <AnimatedPressable style={pressableStyle} onPress={onPress}>
      <Avatar pfpUrl={developer.pfp?.url} diameter={16} />
      <Text2 size="sm" weight="medium" color="secondary">
        {resolveUsernameShort({
          username: developer.username,
          fid: developer.fid,
        })}
      </Text2>
    </AnimatedPressable>
  );
}
