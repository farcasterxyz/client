import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useAppsByAffinity } from 'farcaster-client-hooks';
import { AnimatedPressable } from 'farcaster-expo';
import { StarIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import ChatBubbles from '~/assets/icons/chatbubbles.svg';
import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

interface TrendingNavbarSectionBase {
  title: string;
  icon: React.ReactNode;
}

interface TrendingNavbarUniqueSection {
  type: 'popular';
}

interface TrendingNavbarSection {
  type: 'primaryCategory';
  slug: string;
}

interface TrendingAllSection {
  type: 'trendingAll';
}

// TODO: Clean this up (duplicated)
export type TrendingNavbarSections =
  | TrendingNavbarUniqueSection
  | TrendingNavbarSection
  | TrendingAllSection;

export function getKey(section: TrendingNavbarSections): string {
  if (section.type === 'popular') {
    return 'popular';
  }
  if (section.type === 'primaryCategory') {
    return `primaryCategory-${section.slug}`;
  }
  if (section.type === 'trendingAll') {
    return 'trendingAll';
  }
  throw new Error('Invalid section');
}

const NAVBAR_SECTIONS: Record<string, TrendingNavbarSectionBase> = {
  popular: {
    title: 'For You',
    icon: <StarIcon size={20} color="#FFBD07" fill="#FFBD07" strokeWidth={0} />,
  },
  'primaryCategory-games': {
    title: 'Games',
    icon: <Ionicons name="game-controller" size={20} color="#6E7277" />,
  },
  'primaryCategory-social': {
    title: 'Social',
    icon: <ChatBubbles width={20} height={20} />,
  },
  'primaryCategory-finance': {
    title: 'Finance',
    icon: <Ionicons name="card" size={20} color="#87D23F" />,
  },
  'primaryCategory-utility': {
    title: 'Utility',
    icon: <Ionicons name="build" size={20} color="#87D23F" />,
  },
  'primaryCategory-art-creativity': {
    title: 'Art',
    icon: <Ionicons name="color-palette" size={20} color="#40C7D3" />,
  },
};

interface TrendingNavbarBundle {
  section: TrendingNavbarSections;
  ui: TrendingNavbarSectionBase;
  selected: boolean;
}

export function TrendingNavbarSection({
  onPress,
  selected,
}: {
  onPress: (section: TrendingNavbarSections) => void;
  selected?: TrendingNavbarSections;
}) {
  const t = useTheme();
  const { data: affinityData, isLoading: affinityIsLoading } =
    useAppsByAffinity({ limit: 25 });

  const categories: TrendingNavbarSections[] = useMemo(() => {
    const cats: TrendingNavbarSections[] = [
      {
        type: 'primaryCategory',
        slug: 'games',
      },
      {
        type: 'primaryCategory',
        slug: 'social',
      },
      {
        type: 'primaryCategory',
        slug: 'finance',
      },
      {
        type: 'primaryCategory',
        slug: 'art-creativity',
      },
      {
        type: 'primaryCategory',
        slug: 'utility',
      },
    ];
    if (affinityData?.result.apps.length || affinityIsLoading) {
      cats.unshift({
        type: 'popular',
      });
    }
    return cats;
  }, [affinityData, affinityIsLoading]);

  const categoryBundles: TrendingNavbarBundle[] = useMemo(() => {
    return categories.map((category) => ({
      section: category,
      ui: NAVBAR_SECTIONS[getKey(category)],
      selected: selected ? getKey(category) === getKey(selected) : false,
    }));
  }, [categories, selected]);

  const renderItem = useCallback(
    ({ item }: { item: TrendingNavbarBundle }) => {
      return (
        <TrendingNavbarSectionItem
          key={getKey(item.section)}
          selected={item.selected}
          icon={item.ui.icon}
          title={item.ui.title}
          onPress={() => onPress(item.section)}
        />
      );
    },
    [onPress],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[t.flex]}
    >
      <FlashList
        data={categoryBundles}
        keyExtractor={(item) => getKey(item.section)}
        horizontal
        ItemSeparatorComponent={() => <View style={[t.w3]} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: sizes.s3,
          paddingVertical: sizes.s3,
        }}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderItem}
      />
    </ScrollView>
  );
}

function TrendingNavbarSectionItem({
  selected,
  icon,
  title,
  onPress,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.pX3,
          t.pY2,
          { gap: 6 },
          { borderRadius: 24 },
          t.borderActionSecondary,
          { borderWidth: 1 },
          selected
            ? t.bgLightPurple
            : { backgroundColor: t.colors.bgNewLightGray },
        ]}
      >
        {icon}
        <Text2 weight="medium" size="sm">
          {title}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}
