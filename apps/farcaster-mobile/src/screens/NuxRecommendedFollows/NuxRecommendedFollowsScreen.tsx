import { DdRum } from '@datadog/mobile-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFarcasterNuxRecommendedUser } from 'farcaster-client-data';
import {
  EventingProvider,
  formatFollowCount,
  useCompleteNuxTask,
  useGetNextNuxTask,
  useInvalidateNextNuxTask,
  useSuggestedUsersToFollow,
} from 'farcaster-client-hooks';
import { Check, MessageCircle, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, RefreshControl, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { CircleProgressIndicator } from '~/components/CircleProgressIndicator';
import { Text2 } from '~/components/Text';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type NuxRecommendedFollowsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'NuxRecommendedFollows'
>;

const getInterestDisplayName = (interest: string) => {
  switch (interest) {
    case 'ethereum':
      return 'Crypto';
    case 'music':
      return 'Music';
    case 'fitness':
      return 'Fitness';
    case 'software':
      return 'Programming';
    case 'startups':
      return 'Technology';
    case 'memes':
      return 'Memes';
    case 'screens':
      return 'TV/Movies';
    case 'books':
      return 'Books';
    case 'gaming':
      return 'Gaming';
    case 'technews':
      return 'News';
    case 'food':
      return 'Food';
    case 'travel':
      return 'Travel';
    case 'ai':
      return 'AI';
    default:
      return interest;
  }
};

const NuxRecommendedFollowsScreen: React.FC<
  NuxRecommendedFollowsScreenProps
> = () => {
  const t = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentUser = useGloballyCachedCurrentUser();
  const { data, refetch } = useSuggestedUsersToFollow();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      DdRum.addViewLoadingTime(true);
    });
  }, []);

  const targetFollowingCount = 10;

  // Calculate remaining follows
  const followingCount = currentUser?.followingCount || 0;
  const completedFollows = Math.min(followingCount, targetFollowingCount);

  const remainingFollows = useMemo(
    () => Math.max(0, targetFollowingCount - currentUser?.followingCount),
    [currentUser?.followingCount],
  );

  const done = useMemo(() => remainingFollows === 0, [remainingFollows]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const completeNuxTask = useCompleteNuxTask();
  const invalidateNextNuxTask = useInvalidateNextNuxTask();
  const { refetch: refetchNextTask } = useGetNextNuxTask();
  const pop = usePop();

  const handleMarkAsDone = async () => {
    await completeNuxTask({ task: 'follow-10-people' });
    // invalidate local cache of next task and refetch
    await invalidateNextNuxTask();
    await refetchNextTask();
    pop();
  };

  // Create refresh control for pull-to-refresh
  const refreshControl = (
    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
  );

  // Extract users from the response
  const users = useMemo(() => data?.users || [], [data]);

  // Create a custom renderer for user items to navigate to profile in the tab navigation
  // This ensures the bottom navigation bar reappears when viewing a user profile
  const UserItem = useCallback<ListRenderItem<ApiFarcasterNuxRecommendedUser>>(
    ({ item }) => (
      <View style={[t.mB2]}>
        <User
          user={item.user}
          hideBio={false}
          withNoBorderBottomStyle
          hideFollowsYou
          analyticsData={{
            on: 'nux-recommended-follows',
            followSuggestionReason: item.suggestionReason,
            interestName: item.interestName,
          }}
        />
        <View
          style={[
            t.mT2,
            t.flexRow,
            t.itemsCenter,
            { paddingLeft: 72, gap: 6, marginTop: -6 },
          ]}
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <Users size={14} color={t.colors.text.secondary} style={[t.mR1]} />
            <Text2 color="secondary" size="sm">{`${formatFollowCount({
              followCount: item.user.followerCount,
            })} followers`}</Text2>
          </View>
          {item.interestName && (
            <View style={[t.flexRow, t.itemsCenter]}>
              <Text2 color="secondary" size="sm" style={[{ marginRight: 6 }]}>
                ·
              </Text2>
              <MessageCircle size={14} style={[t.mR1, { color: '#4F81EE' }]} />
              <Text2
                size="sm"
                style={[{ color: '#4F81EE' }]}
              >{`Casts about ${getInterestDisplayName(item.interestName)}`}</Text2>
            </View>
          )}
        </View>
      </View>
    ),
    [t],
  );

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewNuxRecommendedFollowsScreen, {});
    }, [trackEvent]),
  );

  // Show loading state
  if (!data || users.length === 0) {
    return (
      <View style={[t.flex1, t.bgDefault, t.justifyCenter, t.itemsCenter]}>
        <Text2>
          {isRefreshing
            ? 'Finding recommendations...'
            : 'No recommendations found'}
        </Text2>
        {!isRefreshing && (
          <Text2 size="sm" color="secondary" style={[t.mT2]}>
            Please try again later
          </Text2>
        )}
      </View>
    );
  }

  return (
    <EventingProvider on={'nux-follow-suggestions'}>
      <View style={[t.flex1, t.bgDefault]}>
        <View
          style={[t.h14, t.flexRow, t.itemsCenter, t.pX3, t.justifyBetween]}
        >
          <Text2 size="2xl" weight="bold">
            Follow suggestions
          </Text2>
          <View style={[t.flexRow, t.itemsCenter]}>
            <View style={[t.flex, t.flexRow, t.itemsCenter, t.mL1, t.mR1]}>
              {done ? (
                <View
                  style={[
                    t.flex,
                    t.flexRow,
                    t.itemsCenter,
                    t.p1,
                    t.roundedFull,
                    { backgroundColor: t.colors.text.brand },
                  ]}
                >
                  <Check size={8} strokeWidth={6} color={'#fff'} />
                </View>
              ) : (
                <CircleProgressIndicator
                  progress={completedFollows / targetFollowingCount}
                  stroke={t.colors.text.brand}
                  strokeAlternate={t.dark ? '#443C4E' : '#E7E8EB'}
                  backgroundColor="transparent"
                  strokeWidth={3}
                  outerRadius={8}
                  startSide="top"
                />
              )}
            </View>
            <View style={[t.w10, t.flex, t.itemsEnd]}>
              <Text2 color="secondary" weight="semibold">
                {completedFollows}/{targetFollowingCount}
              </Text2>
            </View>
          </View>
        </View>
        <FlashList
          data={users}
          keyExtractor={(item) => String(item.user.fid)}
          onEndReachedThreshold={0.5}
          refreshControl={refreshControl}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={UserItem}
        />
        {done && (
          <View
            style={[
              t.absolute,
              t.bottom0,
              t.left0,
              t.right0,
              t.pX2,
              t.pT2,
              t.pB4,
            ]}
          >
            <View style={[t.shadow]}>
              <ButtonV2
                width="full"
                title={'Done'}
                onPress={handleMarkAsDone}
                textSize="lg"
                haptics
              />
            </View>
          </View>
        )}
      </View>
    </EventingProvider>
  );
};

export { NuxRecommendedFollowsScreen };
