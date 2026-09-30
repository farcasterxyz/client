import { AnimatedPressable, Text2, useTheme } from 'farcaster-expo';
import { ListFilter } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { useHaptics } from '~/hooks/useHaptics';

import { CollectibleCastsExploreTab } from './ExploreCollectibleCastsScreen';

interface CollectibleCastsTabsProps {
  tab: CollectibleCastsExploreTab;
  onTabChange: (tab: CollectibleCastsExploreTab) => void;
  onFilterPress: () => void;
}

export const CollectibleCastsTabs = React.memo(
  ({ tab, onTabChange, onFilterPress }: CollectibleCastsTabsProps) => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();

    const onTabPress = useCallback(
      (next: CollectibleCastsExploreTab) => {
        triggerImpactAsync();
        onTabChange(next);
      },
      [triggerImpactAsync, onTabChange],
    );

    const showFilters =
      tab === 'trending' || tab === 'top' || tab === 'my_bids';

    return (
      <View
        style={[
          t.flexRow,
          t.pX3,
          { paddingTop: 12, paddingBottom: 6, gap: 12 },
        ]}
      >
        <AnimatedPressable onPress={() => onTabPress('trending')}>
          <Text2
            size="lg"
            weight="semibold"
            color={tab === 'trending' ? 'primary' : 'tertiary'}
          >
            Trending
          </Text2>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => onTabPress('top')}>
          <Text2
            size="lg"
            weight="semibold"
            color={tab === 'top' ? 'primary' : 'tertiary'}
          >
            Top
          </Text2>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => onTabPress('my_bids')}>
          <Text2
            size="lg"
            weight="semibold"
            color={tab === 'my_bids' ? 'primary' : 'tertiary'}
          >
            My Bids
          </Text2>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => onTabPress('my_casts')}>
          <Text2
            size="lg"
            weight="semibold"
            color={tab === 'my_casts' ? 'primary' : 'tertiary'}
          >
            My Casts
          </Text2>
        </AnimatedPressable>
        <View style={[t.flex1]} />
        <AnimatedPressable
          onPress={onFilterPress}
          style={[
            t.flexRow,
            t.itemsCenter,
            { gap: 4, opacity: showFilters ? 1 : 0 },
          ]}
          disabled={!showFilters}
        >
          <ListFilter size={20} color={t.colors.text.tertiary} />
        </AnimatedPressable>
      </View>
    );
  },
);

CollectibleCastsTabs.displayName = 'CollectibleCastsTabs';
