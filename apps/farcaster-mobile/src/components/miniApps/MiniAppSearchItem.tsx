import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';

type MiniAppSearchItemProps = {
  miniApp: ApiFrame;
  onComplete: () => void;
};

export const MiniAppSearchItem: FC<MiniAppSearchItemProps> = ({
  miniApp,
  onComplete,
}) => {
  const t = useTheme();
  const openMiniApp = useLaunchFrame();
  const { trackEvent } = useAnalytics();

  const [isComplete, setIsComplete] = useState(false);
  const hasClosed = useRef(false);

  // Once the user has opened the mini app, we wait 500ms to avoid ugly blip
  // during animation and then we close the mini app.
  useEffect(() => {
    if (!isComplete) {
      return;
    }
    if (hasClosed.current) {
      return;
    }
    hasClosed.current = true;
    const timeout = setTimeout(() => {
      onComplete();
    }, 500);
    return () => clearTimeout(timeout);
  }, [isComplete, onComplete]);

  const handlePress = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'miniapp' });

    openMiniApp({
      config: {
        url: miniApp.homeUrl || '',
        name: miniApp.name || '',
        splashImageUrl: miniApp.splashImageUrl,
        splashBackgroundColor: miniApp.splashBackgroundColor,
      },
      author: miniApp.author,
      context: { type: 'launcher' },
      onComplete: () => setIsComplete(true),
    });
  }, [openMiniApp, miniApp, trackEvent]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        t.flex,
        t.flexRow,
        t.p3,
        t.wFull,
        t.itemsCenter,
        t.borderDefault,
        { gap: 8 },
      ]}
    >
      <Avatar pfpUrl={miniApp.iconUrl} diameter={40} />
      <View style={[t.flexCol, t.flex]}>
        <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
          {miniApp.name || 'Unnamed App'}
        </Text>
        <Text style={[t.textSm, t.texts.tertiary]}>
          by{' '}
          {miniApp.author?.username || `@${miniApp.author?.fid}` || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
