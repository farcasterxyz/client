import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useStarterPacks,
  useSuggestedStarterPacks,
} from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '~/components/Avatar';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { buildScreen } from '~/components/Screen';
import { Icon } from '~/components/StarterPacks/Icon';
import { Text2 } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { CommonStackParamList } from '~/types';

type StarterPacksScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'StarterPacks'
>;

type StarterPackItem = {
  type: 'starter-pack';
  starterPack: ApiStarterPack;
};

type DiscoverStarterPacksHeaderItem = {
  type: 'discover-starter-packs-header';
};

type YourStarterPacksHeaderItem = {
  type: 'your-starter-packs-header';
};

type CompositeItem =
  | StarterPackItem
  | DiscoverStarterPacksHeaderItem
  | YourStarterPacksHeaderItem;

const keyExtractor = (item: CompositeItem) => {
  if (item.type === 'starter-pack') {
    return item.starterPack.id.toString();
  }

  return item.type;
};

const FlatList = Animated.FlatList;

const StarterPacksScreen = buildScreen<StarterPacksScreenProps>(
  { name: 'StarterPacks' },
  () => {
    const t = useTheme();
    const insets = useSafeAreaInsets();

    const { trackEvent } = useAnalytics();

    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const { data: starterPacksData, fetchNextPage } = useStarterPacks({
      fid: currentUserFid,
    });

    const { data: suggestedStarterPacksData } = useSuggestedStarterPacks();

    const starterPacks: ApiStarterPack[] = React.useMemo(
      () =>
        starterPacksData?.pages.flatMap((page) => page.result.starterPacks) ||
        [],
      [starterPacksData],
    );

    const suggestedStarterPacks: ApiStarterPack[] = React.useMemo(
      () =>
        (
          suggestedStarterPacksData?.pages.flatMap(
            (page) => page.result.starterPacks,
          ) || []
        ).slice(0, 3),
      [suggestedStarterPacksData],
    );

    const data = React.useMemo(() => {
      const composite: CompositeItem[] = [];

      if (suggestedStarterPacks.length !== 0) {
        composite.push({
          type: 'discover-starter-packs-header',
        });
        composite.push(
          ...suggestedStarterPacks.map(
            (sp) =>
              ({
                type: 'starter-pack',
                starterPack: sp,
              }) satisfies CompositeItem,
          ),
        );
      }

      if (starterPacks.length !== 0) {
        composite.push({
          type: 'your-starter-packs-header',
        });
        composite.push(
          ...starterPacks.map(
            (sp) =>
              ({
                type: 'starter-pack',
                starterPack: sp,
              }) satisfies CompositeItem,
          ),
        );
      }

      return composite;
    }, [starterPacks, suggestedStarterPacks]);

    const extraData = useCommonFlatListExtraData();

    const handleEndReached = React.useCallback(() => {
      fetchNextPage();
    }, [fetchNextPage]);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewStarterPacks, {});
      }, [trackEvent]),
    );

    return (
      <View
        style={[t.hFull, t.wFull, t.flex1, { paddingBottom: insets.bottom }]}
      >
        <FlatList
          scrollIndicatorInsets={{ right: 1 }}
          removeClippedSubviews={false}
          data={data}
          extraData={extraData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
        />
        <View style={[t.flexRow, t.mX2, t.pT2, t.pB2, t.bgDefault, { gap: 8 }]}>
          <CreateStarterPackPressable />
        </View>
      </View>
    );
  },
);

function renderItem({ item }: { item: CompositeItem }) {
  switch (item.type) {
    case 'starter-pack':
      return <StarterPack starterPack={item.starterPack} />;
    case 'discover-starter-packs-header':
      return <DiscoverStarterPacksSectionHeader />;
    case 'your-starter-packs-header':
      return <YourStarterPacksSectionHeader />;
  }
}

StarterPacksScreen.displayName = 'StarterPacksScreen';

function DiscoverStarterPacksSectionHeader() {
  const t = useTheme();

  const push = usePush();

  const { trackEvent } = useAnalytics();

  const onShowMorePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressShowMoreOnStarterPacks, {});

    push('SuggestedStarterPacks', {});
  }, [push, trackEvent]);

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.wFull,
        t.pX3,
        t.mY3,
      ]}
    >
      <Text2 size="lg" weight="semibold" color="primary">
        Discover Starter Packs
      </Text2>
      <TouchableOpacity
        style={[t.flex]}
        activeOpacity={0.85}
        onPress={onShowMorePress}
      >
        <Text2 size="sm" weight="regular" color="brand">
          Show more
        </Text2>
      </TouchableOpacity>
    </View>
  );
}

function YourStarterPacksSectionHeader() {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.wFull,
        t.pX3,
        t.mY3,
      ]}
    >
      <Text2 size="lg" weight="semibold" color="primary">
        Your Starter Packs
      </Text2>
    </View>
  );
}

export function CreateStarterPackPressable() {
  const push = usePush();
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const onCreatePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressCreateStarterPackOnStarterPacks, {});

    push('CreateStarterPack', { existingStarterPack: undefined });
  }, [push, trackEvent]);

  return (
    <AtomsButton
      size="l"
      style={t.wFull}
      hierarchy="primary"
      onPress={onCreatePress}
    >
      Create a Starter Pack
    </AtomsButton>
  );
}

type StarterPackProps = {
  starterPack: ApiStarterPack;
};

const StarterPack: React.FC<StarterPackProps> = React.memo(
  ({ starterPack }) => {
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const push = usePush();
    const pushToUserProfile = usePushToUserProfile();

    const onStarterPackPress = React.useCallback(() => {
      trackEvent(AnalyticsEvent.PressStarterPackOnStarterPacks, {});

      push('StarterPack', { starterPackId: starterPack.id });
    }, [trackEvent, push, starterPack.id]);

    const isProUser = useUserLevel(starterPack.creator) === 'pro';

    return (
      <TouchableOpacity
        style={[t.bgSwap, t.roundedLg, t.mX3, t.flex1, t.flexCol, t.p3, t.mB2]}
        onPress={onStarterPackPress}
        activeOpacity={0.75}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <View
            style={[
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.mR3,
              t.roundedLg,
              t.borderDefault,
              t.borderHairline,
              {
                backgroundColor: t.colors.bgHover,
                width: 48,
                height: 48,
              },
            ]}
          >
            <Icon color={t.colors.text.primary} size={32} />
          </View>
          <View style={[t.flex1, t.flexCol]}>
            <Text2
              weight="semibold"
              size="base"
              color="primary"
              numberOfLines={1}
            >
              {starterPack.name}
            </Text2>
            <View style={[t.flex, t.flexRow, t.itemsCenter]}>
              <Text2 size="sm" weight="medium" color="secondary">
                by{' '}
              </Text2>
              {starterPack.creator.fid === currentUserFid ? (
                <Text2 size="sm" weight="medium" color="secondary">
                  you
                </Text2>
              ) : (
                <TouchableOpacity
                  style={[t.flex, t.flexRow, t.itemsCenter]}
                  onPress={() => {
                    pushToUserProfile({ fid: starterPack.creator.fid });
                  }}
                >
                  <Avatar pfpUrl={starterPack.creator.pfp?.url} diameter={16} />
                  <Text2 size="sm" weight="medium" color="secondary">
                    {' '}
                    {resolveUsernameShort({
                      username: starterPack.creator.username,
                      fid: starterPack.creator.fid,
                    })}
                  </Text2>
                  {isProUser && <FarcasterProBadge size={14} style={[t.mL1]} />}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        <View style={[t.pY2]}>
          <Text2
            weight="regular"
            size="sm"
            color="primary"
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {starterPack.description}
          </Text2>
        </View>
      </TouchableOpacity>
    );
  },
);

export { StarterPacksScreen };
