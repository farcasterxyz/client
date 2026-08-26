import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import {
  FrameTile,
  frameTileEstimatedSize,
} from '~/components/Frames/FrameTile';
import { useTheme } from '~/contexts/ThemeProvider';

const RecentAppsCarousel = ({
  header,
  isLoading: _isLoading,
  apps,
  onBeforeLaunch,
}: {
  header?: ReactNode;
  isLoading: boolean;
  apps: ApiFrame[];
  onBeforeLaunch?: (app: ApiFrame) => void;
}) => {
  const t = useTheme();
  const { trackEvent } = useTrackEvent();

  if (!apps || apps.length === 0) {
    return null;
  }

  return (
    <View style={[t.flexCol, t.pT3]}>
      {header}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        alwaysBounceVertical={false}
        contentContainerStyle={[t.pB1, { paddingHorizontal: 0, gap: 12 }]}
      >
        {apps.map((item, index) => (
          <View key={item.domain} style={{ width: frameTileEstimatedSize }}>
            <FrameTile
              frame={item}
              frameIconSize={64}
              onBeforeLaunch={() => {
                trackEvent(AnalyticsEvent.AppsHomeClickFavoriteApp, {
                  domain: item.domain,
                  index,
                });
                onBeforeLaunch?.(item);
              }}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export { RecentAppsCarousel };
