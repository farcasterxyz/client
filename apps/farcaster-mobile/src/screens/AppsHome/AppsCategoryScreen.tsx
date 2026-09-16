import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiFrame } from 'farcaster-client-data';
import {
  useAppsByAffinity,
  useAppsByCategory,
  useTopFrames,
} from 'farcaster-client-hooks';
import { Text2, useTheme } from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { buildScreen } from '~/components/Screen';
import { UserCards } from '~/components/UserCards';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { AppsCategoryScreenParams, AppsHomeStackParamList } from '~/types';

import { AppsListInner } from './TrendingAppsScreen';
import {
  getKey,
  TrendingNavbarSection,
  TrendingNavbarSections,
} from './TrendingNavbarSection';

type AppsCategoryScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'AppsCategory'
>;

const CategoryTitle = {
  games: 'Top Games',
  finance: 'Top Finance Apps',
  social: 'Top Social Apps',
  entertainment: 'Top Entertainment',
  productivity: 'Top Productivity',
  utility: 'Top Utility',
  other: 'Top Other',
  'art-creativity': 'Top Art & Creativity',
};

function AppsCategoryOuter({
  children,
  onPress,
  selected,
  animationKey,
}: {
  children: React.ReactNode;
  onPress: (section: TrendingNavbarSections) => void;
  selected: TrendingNavbarSections;
  animationKey: string;
}) {
  const t = useTheme();
  return (
    <View style={[t.flex1, t.flexCol]}>
      <View style={[t.flexCol]}>
        <TrendingNavbarSection onPress={onPress} selected={selected} />
      </View>
      <Animated.View
        key={animationKey}
        entering={FadeIn.duration(200)}
        style={{ flex: 1 }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function AppsCategory({ defaultSection }: AppsCategoryScreenParams) {
  const [currentSection, setCurrentSection] =
    useState<TrendingNavbarSections>(defaultSection);

  const onPress = useCallback(
    (section: TrendingNavbarSections) => {
      if (getKey(section) === getKey(currentSection)) {
        setCurrentSection({ type: 'trendingAll' });
      } else {
        setCurrentSection(section);
      }
    },
    [currentSection],
  );

  const t = useTheme();
  const navigation = useNavigation();
  const {
    data: affinityData,
    isLoading: affinityIsLoading,
    refetch: affinityRefetch,
  } = useAppsByAffinity({
    enabled: currentSection.type === 'popular',
    limit: 25,
  });

  const {
    data: categoryData,
    isLoading: categoryIsLoading,
    refetch: categoryRefetch,
  } = useAppsByCategory({
    category:
      currentSection.type === 'primaryCategory' ? currentSection.slug : '',
    sortByKey: 'scoreTrending',
    enabled:
      currentSection.type === 'primaryCategory' &&
      currentSection.slug !== undefined,
  });

  const { flatData, onEndReached, refetch, isLoading, hasNextPage } =
    useTopFrames({
      enabled: currentSection.type === 'trendingAll',
    });

  useEffect(() => {
    if (currentSection.type === 'popular') {
      navigation.setOptions({
        headerTitle: 'For You',
      });
    } else if (currentSection.type === 'trendingAll') {
      navigation.setOptions({
        headerTitle: 'Trending',
      });
    } else {
      navigation.setOptions({
        headerTitle:
          CategoryTitle[currentSection.slug as keyof typeof CategoryTitle] ??
          currentSection.slug,
      });
    }
  }, [currentSection, navigation]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch:
      currentSection.type === 'primaryCategory'
        ? categoryRefetch
        : currentSection.type === 'trendingAll'
          ? refetch
          : affinityRefetch,
  });

  const affinityDescriptionFn = useCallback(
    (frame: ApiFrame): React.ReactElement => {
      const app = affinityData?.result.apps.find(
        (app) => app.frame.domain === frame.domain,
      );
      // This shouldn't happen, but just in case
      if (!app) {
        return <></>;
      }
      const { uniqueFidsOpened, topUsers } = app;
      return (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          {topUsers.length > 0 && (
            <UserCards users={topUsers} condensed={true} size="sm" />
          )}
          <Text2 color="secondary" size="sm">
            {uniqueFidsOpened}+ users
          </Text2>
        </View>
      );
    },
    [affinityData, t.flexRow, t.itemsCenter],
  );

  if (currentSection.type === 'primaryCategory') {
    return (
      <AppsCategoryOuter
        onPress={onPress}
        selected={currentSection}
        animationKey={`category-${currentSection.slug}`}
      >
        <AppsListInner
          flatData={categoryData?.result.apps ?? []}
          listKey={`category-${currentSection.slug}`}
          onEndReached={() => {}}
          hasNextPage={false}
          isLoading={categoryIsLoading}
          refetch={categoryRefetch}
          refreshControl={refreshControl}
        />
      </AppsCategoryOuter>
    );
  }
  if (currentSection.type === 'trendingAll') {
    return (
      <AppsCategoryOuter
        onPress={onPress}
        selected={currentSection}
        animationKey="trending-all"
      >
        <AppsListInner
          flatData={flatData ?? []}
          listKey="trending-all"
          onEndReached={onEndReached}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          refetch={refetch}
          refreshControl={refreshControl}
        />
      </AppsCategoryOuter>
    );
  }
  return (
    <AppsCategoryOuter
      onPress={onPress}
      selected={currentSection}
      animationKey="affinity"
    >
      <AppsListInner
        key="affinity-list"
        flatData={affinityData?.result.apps.map((app) => app.frame) ?? []}
        listKey="affinity"
        onEndReached={() => {}}
        hasNextPage={false}
        isLoading={affinityIsLoading}
        refetch={affinityRefetch}
        refreshControl={undefined}
        descriptionFn={affinityDescriptionFn}
      />
    </AppsCategoryOuter>
  );
}

export const AppsCategoryScreen = buildScreen<AppsCategoryScreenProps>(
  { name: 'AppsCategory' },
  ({ route }) => {
    const { defaultSection } = route.params;
    return <AppsCategory defaultSection={defaultSection} />;
  },
);
AppsCategoryScreen.displayName = 'AppsCategoryScreen';
