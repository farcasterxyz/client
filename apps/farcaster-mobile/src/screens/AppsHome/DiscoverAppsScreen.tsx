import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFavoriteFrames } from 'farcaster-client-hooks';
import { Text2 } from 'farcaster-expo';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';

import { FrameTile } from '~/components/Frames/FrameTile';
import { buildScreen } from '~/components/Screen';
import { buildTabBar } from '~/components/TabBar';
import { useTheme } from '~/contexts/ThemeProvider';
import { AppsHomeStackParamList } from '~/types';

import { TrendingApps } from './AppsHomeScreen';

type DiscoverAppsScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'DiscoverApps'
>;

const DiscoverAppsScreen = buildScreen<DiscoverAppsScreenProps>(
  { name: 'DiscoverApps' },
  () => {
    const t = useTheme();
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
      { key: 'your-apps', title: 'Your Apps' },
      { key: 'trending', title: 'Trending' },
    ]);

    const TrendingRoute = useCallback(
      () => (
        <ScrollView
          style={{ flex: 1, backgroundColor: t.colors.background.default }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <TrendingApps limit={50} useRank={true} />
        </ScrollView>
      ),
      [t.colors.background.default],
    );

    const YourAppsRoute = useCallback(() => {
      const { flatData: installedData } = useFavoriteFrames();

      return (
        <ScrollView
          style={{ flex: 1, backgroundColor: t.colors.background.default }}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 16 }}
        >
          {!installedData || installedData.length === 0 ? (
            <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pT6]}>
              <Text2 size="base" color="secondary">
                No apps installed yet
              </Text2>
            </View>
          ) : (
            <View style={[t.flexRow, t.flexWrap, t.pX3, { gap: 8 }]}>
              {installedData.map((frame) => (
                <View
                  key={frame.domain}
                  style={{
                    width: '31%',
                  }}
                >
                  <FrameTile
                    frame={frame}
                    frameIconSize={64}
                    showTitle={true}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      );
    }, [t]);

    const renderScene = useMemo(
      () =>
        SceneMap({
          trending: TrendingRoute,
          'your-apps': YourAppsRoute,
        }),
      [TrendingRoute, YourAppsRoute],
    );

    const renderTabBar = useMemo(
      () =>
        buildTabBar({
          containerStyle: [
            t.bgDefault,
            t.borderB,
            t.borderDefault,
            { paddingTop: 8 },
          ],
        }),
      [t],
    );

    return (
      <View style={[t.flex1, t.bgDefault]}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={renderTabBar}
          initialLayout={{ width: layout.width }}
        />
      </View>
    );
  },
);

DiscoverAppsScreen.displayName = 'DiscoverAppsScreen';

export { DiscoverAppsScreen };
