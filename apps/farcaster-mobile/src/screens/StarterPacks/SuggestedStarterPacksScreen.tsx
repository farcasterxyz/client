import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useSuggestedStarterPacks,
} from 'farcaster-client-hooks';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

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
type SuggestedStarterPacksScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'SuggestedStarterPacks'
>;

const keyExtractor = (item: ApiStarterPack) => {
  return item.id;
};

const FlatList = Animated.FlatList;

const SuggestedStarterPacksScreen =
  buildScreen<SuggestedStarterPacksScreenProps>(
    { name: 'StarterPacks' },
    () => {
      const t = useTheme();

      const { trackEvent } = useAnalytics();

      const { data: starterPacksData, fetchNextPage } =
        useSuggestedStarterPacks();

      const starterPacks: ApiStarterPack[] = React.useMemo(
        () =>
          starterPacksData?.pages.flatMap((page) => page.result.starterPacks) ||
          [],
        [starterPacksData],
      );

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
        <View style={[t.hFull, t.wFull]}>
          <View style={[t.justifyBetween, t.hFull, t.wFull]}>
            <FlatList
              scrollIndicatorInsets={{ right: 1 }}
              removeClippedSubviews={false}
              data={starterPacks}
              extraData={extraData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              onEndReached={handleEndReached}
              onEndReachedThreshold={onEndReachedThreshold}
            />
          </View>
        </View>
      );
    },
  );

function renderItem({ item }: { item: ApiStarterPack }) {
  return <StarterPack starterPack={item} />;
}

SuggestedStarterPacksScreen.displayName = 'SuggestedStarterPacksScreen';

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

export { SuggestedStarterPacksScreen };
