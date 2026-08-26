import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiRichAnnouncementDirectCastMessagePayload } from 'farcaster-client-data';
import React from 'react';
import { Pressable } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';
import { resolveUniversalLink } from '~/utils/DeepLinkUtils';

type DirectCastRichAnnouncementCTAProps = {
  payload: ApiRichAnnouncementDirectCastMessagePayload['payload'];
};

const DirectCastRichAnnouncementCTA: React.FC<DirectCastRichAnnouncementCTAProps> =
  React.memo(({ payload }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const { trackEvent } = useAnalytics();

    const push = usePush();
    const navigate = useNavigate();

    const onPress = React.useCallback(() => {
      triggerImpactAsync();

      trackEvent(AnalyticsEvent.ClickDirectCastAnnouncementCTA, {
        title: payload.actionTitle,
        target: payload.actionTarget,
      });

      if (
        payload.actionTarget.startsWith('https://warpcast.com') ||
        payload.actionTarget.startsWith('https://farcaster.xyz') ||
        payload.actionTarget.startsWith('farcaster://')
      ) {
        try {
          const parsedUrl = new URL(payload.actionTarget);

          const universalLinkResult = resolveUniversalLink({
            url: parsedUrl.href,
            pathname: parsedUrl.pathname,
            searchParams: parsedUrl.searchParams,
          });

          if (
            universalLinkResult &&
            (universalLinkResult.type === 'navigate' ||
              universalLinkResult.type === 'push')
          ) {
            const pushOrNavigate =
              universalLinkResult.type === 'push' ? push : navigate;
            return pushOrNavigate(
              universalLinkResult.name,
              universalLinkResult.params,
            );
          }
        } catch {
          // No-op fallback to in-app open below
        }
      }

      void openBrowserAsync(payload.actionTarget, {
        dismissButtonStyle: 'close',
        readerMode: false,
      });
    }, [
      navigate,
      payload.actionTarget,
      payload.actionTitle,
      push,
      trackEvent,
      triggerImpactAsync,
    ]);

    return (
      <Pressable
        style={[
          t.pY2,
          t.pX3,
          { borderRadius: 8 },
          t.roundedTNone,
          t.itemsCenter,
          t.textCenter,
          t.justifyCenter,
          { backgroundColor: '#7C65C1' },
        ]}
        onPress={onPress}
      >
        <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
          {payload.actionTitle}
        </Text>
      </Pressable>
    );
  });

DirectCastRichAnnouncementCTA.displayName = 'DirectCastRichAnnouncementCTA';

export { DirectCastRichAnnouncementCTA };
