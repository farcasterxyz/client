import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import { useFavoriteFrames, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';

import { FrameTile } from '~/components/Frames/FrameTile';
import { LoadFailureIndicator } from '~/components/LoadFailureIndicator';
import { buildScreen } from '~/components/Screen';
import { SkeletonPlaceholder } from '~/components/SkeletonPlaceholder';
import { FavoriteFrameProvider } from '~/contexts/FavoriteFrameProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { AppsHomeStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

import { useScreenAvailableHeight } from './AppsHomeScreen';

type YourAppsScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'YourApps'
>;

const HORIZONTAL_PADDING = sizes.s3;

export const YourAppsGrid = ({
  forceSkeleton = false,
  horizontalPadding,
}: {
  forceSkeleton?: boolean;
  horizontalPadding: number;
}) => {
  const t = useTheme();
  const screenAvailableHeight = useScreenAvailableHeight();
  const { trackEvent } = useTrackEvent();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const numColumns = useMemo(() => {
    const { width: screenWidth } = Dimensions.get('window');
    return screenWidth < 375 ? 3 : 4;
  }, []);

  const itemSize = useMemo(() => {
    const { width: screenWidth } = Dimensions.get('window');
    const availableWidth = screenWidth - horizontalPadding * 2;
    return availableWidth / numColumns;
  }, [numColumns, horizontalPadding]);

  const {
    flatData: favoriteFrames = [],
    error: errorFavoriteFrames,
    isLoading: isLoadingFavoriteFrames,
    refetch: refetchFavoriteFrames,
    isFetchingNextPage: isFetchingNextFavoriteFrames,
    fetchNextPage,
    hasNextPage,
  } = useFavoriteFrames();

  useEffect(() => {
    // Set isInitialLoad to false once the first data loads
    if (!isLoadingFavoriteFrames && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoadingFavoriteFrames, isInitialLoad]);

  const skeletonFramePrefix = 'skeleton';

  const allFrames = useMemo(() => {
    if (isFetchingNextFavoriteFrames) {
      return [
        ...favoriteFrames,
        ...(Array.from({ length: numColumns }).map((_, i) => ({
          domain: `${skeletonFramePrefix}${i + 1}`,
        })) as ApiFrame[]),
      ];
    }
    return [...favoriteFrames];
  }, [
    favoriteFrames,
    isFetchingNextFavoriteFrames,
    numColumns,
    skeletonFramePrefix,
  ]);

  const minHeight = useMemo(() => {
    const headerHeight = 50;
    const padding = sizes.s2 * 3;
    return screenAvailableHeight - headerHeight - padding;
  }, [screenAvailableHeight]);

  // Only show skeleton for initial load
  if ((isInitialLoad && isLoadingFavoriteFrames) || forceSkeleton) {
    return (
      <View style={[t.flex1, t.flexRow, t.pX3, t.pT3, { gap: 8 }]}>
        <SkeletonPlaceholder style={[t.roundedLg, { height: 88, width: 88 }]} />
        <SkeletonPlaceholder style={[t.roundedLg, { height: 88, width: 88 }]} />
        <SkeletonPlaceholder style={[t.roundedLg, { height: 88, width: 88 }]} />
        <SkeletonPlaceholder style={[t.roundedLg, { height: 88, width: 88 }]} />
      </View>
    );
  }

  if (!isLoadingFavoriteFrames && errorFavoriteFrames) {
    return (
      <View style={[t.flex1, t.flexRow, t.pX3, t.pT3, { gap: 8 }]}>
        <LoadFailureIndicator retry={() => refetchFavoriteFrames()} />
      </View>
    );
  }

  return (
    <FavoriteFrameProvider>
      <View
        style={[
          t.flex1,
          t.flex,
          { paddingHorizontal: horizontalPadding },
          {
            minHeight,
          },
        ]}
      >
        <FlashList
          data={allFrames}
          keyExtractor={(item) => item.domain}
          numColumns={numColumns}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextFavoriteFrames) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={({ item, index }) => {
            if (item.domain.startsWith(skeletonFramePrefix)) {
              return (
                <View style={[t.mY3, t.itemsCenter, { width: itemSize }]}>
                  <SkeletonPlaceholder
                    style={[t.roundedLg, { height: 64, width: 64 }]}
                  />
                </View>
              );
            }
            return (
              <View style={[t.mY3, t.itemsCenter, { width: itemSize }]}>
                <FrameTile
                  frame={item}
                  showTitle
                  frameIconSize={64}
                  onBeforeLaunch={() => {
                    trackEvent(AnalyticsEvent.AppsHomeClickFavoriteApp, {
                      domain: item.domain,
                      index: index,
                    });
                  }}
                />
              </View>
            );
          }}
        />
      </View>
    </FavoriteFrameProvider>
  );
};

function YourApps() {
  const t = useTheme();

  return (
    <ScrollView style={[t.flex1]}>
      <YourAppsGrid
        forceSkeleton={false}
        horizontalPadding={HORIZONTAL_PADDING}
      />
    </ScrollView>
  );
}

export const YourAppsHeaderRight: FC = () => {
  const t = useTheme();
  const push = usePush();

  const handlePress = useCallback(() => {
    push('YourAppsSettings', {});
  }, [push]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Octicons name="gear" size={18} color={t.colors.text.primary} />
    </TouchableOpacity>
  );
};

export const YourAppsScreen = buildScreen<YourAppsScreenProps>(
  { name: 'YourApps' },
  () => {
    return <YourApps />;
  },
);
YourAppsScreen.displayName = 'YourAppsScreen';
