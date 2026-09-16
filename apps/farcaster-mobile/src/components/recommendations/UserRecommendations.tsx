import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  CastClickType,
  useDismissSuggestedUsers,
  useGloballyCachedUser,
  type UserRecommendations as UserRecommendationsType,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text } from '~/components/Text';
import { FollowButton } from '~/components/users/FollowButton';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

const formatFollowersYouKnow = (
  followersYouKnow: ApiUser[] | undefined,
  totalCount: number | undefined,
) => {
  if (!followersYouKnow || followersYouKnow.length === 0 || !totalCount) {
    return null;
  }

  if (totalCount === 1 && followersYouKnow.length === 1) {
    return `Followed by @${followersYouKnow[0].username}`;
  } else if (totalCount === 2 && followersYouKnow.length === 2) {
    return `Followed by @${followersYouKnow[0].username}, @${followersYouKnow[1].username}`;
  } else {
    return `Followed by @${followersYouKnow[0].username} and ${totalCount - 1} others`;
  }
};

type UserRecommendationsProps = {
  recommendations: UserRecommendationsType;
};

const UserRecommendations: FC<UserRecommendationsProps> = memo(
  ({ recommendations: { users } }) => {
    const { trackEvent } = useAnalytics();
    const navigate = useNavigate();
    const t = useTheme();
    const dismissSuggestedUsers = useDismissSuggestedUsers();

    const scrollViewRef = useRef<ScrollView>(null);
    const filteredUsersRef = useRef(
      users.filter((user) => user.displayName && user.username && user.pfp),
    );

    // We are managing state with refs to improve performance when rendering in FlashList
    // which means we need the ability to manually trigger a re-render when we mutate a ref.
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    // Reset scroll position when recycled within FlashList.
    useEffect(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: false });
      }
    }, []);

    // Reset filtered users when recycled within FlashList.
    useEffect(() => {
      filteredUsersRef.current = users.filter(
        (user) => user.displayName && user.username && user.pfp,
      );
      forceUpdate();
    }, [users]);

    const handleSeeAll = useCallback(() => {
      navigate('Explore', {});
      trackEvent(AnalyticsEvent.SeeMoreUserRecommendations, {});
    }, [navigate, trackEvent]);

    const handleDismissUser = useCallback(
      (fid: number) => {
        filteredUsersRef.current = filteredUsersRef.current.filter(
          (user) => user.fid !== fid,
        );
        dismissSuggestedUsers({ fids: [fid] });
        forceUpdate();
        trackEvent(AnalyticsEvent.DismissUserRecommendation, {});
      },
      [forceUpdate, dismissSuggestedUsers, trackEvent],
    );

    const handleUserChange = useCallback(
      (updatedUser: ApiUser) => {
        if (updatedUser.viewerContext?.following) {
          filteredUsersRef.current = filteredUsersRef.current.filter(
            (user) => user.fid !== updatedUser.fid,
          );
          forceUpdate();
        }
      },
      [forceUpdate],
    );

    if (filteredUsersRef.current.length === 0) {
      return null;
    }

    return (
      <View style={[t.borderBHairline, t.borderDefault]}>
        <View style={[t.p4, t.flexRow, t.justifyBetween]}>
          <Text style={[t.textSm, t.texts.tertiary, t.fontSemibold]}>
            Suggested for you
          </Text>
          <Pressable onPress={handleSeeAll}>
            <Text style={[t.textSm, t.texts.brand, t.fontSemibold]}>
              See all
            </Text>
          </Pressable>
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled
          alwaysBounceVertical={false}
          contentContainerStyle={[t.itemsStretch, t.pX2, t.mB1]}
        >
          {filteredUsersRef.current.map((user, index) => (
            <UserRecommendation
              key={index}
              user={user}
              onDismiss={handleDismissUser}
              onUserChange={handleUserChange}
            />
          ))}
        </ScrollView>
      </View>
    );
  },
);

type UserRecommendationProps = {
  user: ApiUser;
  onDismiss(fid: number): void;
  onUserChange(updatedUser: ApiUser): void;
};

const UserRecommendation: React.FC<UserRecommendationProps> = memo(
  ({ user: fallbackUser, onDismiss, onUserChange }) => {
    const user = useGloballyCachedUser({
      fallback: fallbackUser,
    });
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();
    const trackCastClick = useTrackCastClick();

    useEffect(() => {
      onUserChange(user);
    }, [user, onUserChange]);

    const onAvatarPress = useCallback(() => {
      trackCastClick({ type: CastClickType.Author });

      pushToUserProfile({ fid: user.fid });
    }, [pushToUserProfile, trackCastClick, user.fid]);

    if (user.viewerContext?.following) {
      return null;
    }

    const followersYouKnowText = formatFollowersYouKnow(
      user.viewerContext?.followersYouKnow?.users,
      user.viewerContext?.followersYouKnow?.totalCount,
    );

    return (
      <View
        style={[
          t.bgRecommendation,
          t.p4,
          t.mX2,
          t.mB2,
          t.roundedLg,
          t.itemsCenter,
          t.flex1,
          { width: 175 },
        ]}
      >
        <View style={[t.absolute, t.right0, t.mT2, t.mR3]}>
          <Pressable onPress={() => onDismiss(user.fid)}>
            <Octicons name="x" size={20} color={t.colors.feed.mutedIcon} />
          </Pressable>
        </View>
        <Pressable hitSlop={hitSlop} onPress={onAvatarPress}>
          <Avatar pfpUrl={user.pfp!.url} diameter={64} />
        </Pressable>
        <View style={[t.flex1, t.justifyCenter, t.itemsCenter, t.mY2]}>
          <Text
            style={[t.fontSemibold, t.textBase, t.texts.primary]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.displayName!}
          </Text>
          <Text
            style={[t.texts.secondary, t.mY1]}
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {user.username}
          </Text>
          {followersYouKnowText && (
            <Text
              style={[t.texts.tertiary, t.textCenter, t.mT1, t.mB1, t.textXs]}
              ellipsizeMode="tail"
              numberOfLines={2}
            >
              {followersYouKnowText}
            </Text>
          )}
        </View>
        <View style={[t.wFull]}>
          <FollowButton
            targetUser={user}
            size="sm"
            presentation="standalone"
            extraFollowAnalyticsData={{ on: 'suggested-users' }}
          />
        </View>
      </View>
    );
  },
);

export { UserRecommendations };
