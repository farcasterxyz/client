import { Octicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiTokenLink,
  ApiUser,
  ApiUserProfile,
  canOverrideNeynarScore,
  isPublicUrl,
  toHttpsUrl,
} from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  buildUserCastsKey,
  EventingProvider,
  extractCastKey,
  FeedSourceOn,
  formatShorthandNumber,
  resolveUsername,
  resolveUsernameShort,
  useDomainManifestState,
  useGloballyCachedUser,
  useNonSuspenseFrameDetails,
  usePrefetchProfileSnapCasts,
  usePrefetchUserCastsAndReplies,
  usePrefetchUserLikedCasts,
  usePurgedProfileSnapCasts,
  UserCastsCache,
  useRefreshInfiniteFirstPageOnly,
  useRefreshProfileSnapCastsFirstPage,
  UserLinkHelpersProvider,
  useUserCasts,
  useUserCastsAndReplies,
  useUserLikedCasts,
} from 'farcaster-client-hooks';
import {
  Avatar,
  ButtonV2,
  FullScreenLoadingIndicator,
  getStandardizedAvatarUrl,
  Text2,
  TokenUserActivityBottomSheetModal,
  useHaptics,
  useIsAdmin,
  useTheme,
} from 'farcaster-expo';
import { imageRequestHeaders } from 'farcaster-expo/src/constants/Images';
import { Link2Icon, Search } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  measure,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Cast } from '~/components/casts/Cast';
import { CollectibleCastCollection } from '~/components/CollectibleCast/CollectibleCastCollection';
import { Empty } from '~/components/Empty';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { FarcasterProUserProfileSheet } from '~/components/FarcasterPro/FarcasterProUserProfileSheet';
import { FrameIconImage } from '~/components/FrameIconImage';
import { HeaderImage, ImageUploaderInterface } from '~/components/HeaderImage';
import { TabBar } from '~/components/HomeFeedPagers/HomeHeaderTabBar';
import {
  Pager,
  PagerRef,
  RenderTabBarFnProps,
} from '~/components/HomeFeedPagers/Pager';
import { SnapToolbarIcon } from '~/components/icons/SnapToolbarIcon';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { TraderTokens } from '~/components/traders/TraderTokens';
import { ConnectedAccountsSection } from '~/components/UserProfile/headerSections/ConnectedAccountsSection';
import { LocationSection } from '~/components/UserProfile/headerSections/LocationSection';
import { ProfileTokenSection } from '~/components/UserProfile/headerSections/ProfileTokenSection';
import { UpdatedFollowersYouKnowSection } from '~/components/UserProfile/headerSections/UpdatedFollowersYouKnowSection';
import { MoreUserProfileActionsBottomSheet } from '~/components/UserProfile/MoreUserProfileActionsBottomSheet';
import { UpdatedPayUserButton } from '~/components/UserProfile/UpdatedPayUserButton';
import { UserNeynarScoreOverrideButton } from '~/components/UserProfile/UserNeynarScoreOverrideButton';
import { UserQualityButton } from '~/components/UserProfile/UserQualityButton';
import { FollowButton } from '~/components/users/FollowButton';
import { UserDisplayNameUsername } from '~/components/users/UserDisplayNameUsername';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAppStoreReview } from '~/contexts/AppStoreReviewProvider';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import { useLightbox } from '~/contexts/LightboxProvider';
import {
  AnimatedImageViewabilityScopeProvider,
  useVideoFeedViewablilityPairs,
} from '~/contexts/VideoFeedViewablilityProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToNestedScreen } from '~/hooks/navigation/useNavigateToNestedScreen';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { useHideAdminFeatures } from '~/hooks/useHideAdminFeatures';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { usePrefetchThreadCast } from '~/hooks/usePrefetchThreadCast';
import { useRecordCastOnView } from '~/hooks/useRecordCastOnView';
import {
  OnlyDragScrollProvider,
  useScrollHandlers,
} from '~/screens/Feed/HomeScreenScrollHandlers';
import { UserScreenInitialTab } from '~/types';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import { UserProfileWithNeynarScoreInfo } from '~/utils/NeynarScoreUtils';
import { ZERO_SCROLL_INSET_PROPS } from '~/utils/ScrollInsetUtils';
import { shareUrl } from '~/utils/SharingUtils';

import { IconPressable } from './IconPressable';
import { ProfileFloatingSearch } from './ProfileFloatingSearch';
import { ProfileNotificationsSettings } from './ProfileNotificationsSettings';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function transformProfileUrl({ url }: { url: string }): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return url;
    }
    const path = (u.pathname === '/' ? '' : u.pathname) + u.search + u.hash;
    if (path.length > 15) {
      return u.host + path.slice(0, 13) + '...';
    }
    return u.host + path;
  } catch (e) {
    return url;
  }
}

function resolvePublicProfileUrl(url: string): string | undefined {
  const fullUrl = toHttpsUrl(url);
  return isPublicUrl(fullUrl) ? fullUrl : undefined;
}

function resolveProfileUrlDomain(url: string): string | undefined {
  const fullUrl = resolvePublicProfileUrl(url);
  if (!fullUrl) {
    return undefined;
  }

  try {
    return new URL(fullUrl).hostname;
  } catch {
    return undefined;
  }
}

function resolveFarcasterMiniAppId(url: string): string | undefined {
  const fullUrl = resolvePublicProfileUrl(url);
  if (!fullUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(fullUrl);
    if (parsedUrl.hostname !== 'farcaster.xyz') {
      return undefined;
    }

    const [, miniAppId] = parsedUrl.pathname.match(
      /^\/miniapps\/([^/?#]+)/,
    ) ?? [undefined, undefined];

    return miniAppId ? decodeURIComponent(miniAppId) : undefined;
  } catch {
    return undefined;
  }
}

type ProfilePagerKey = 'casts' | 'replies' | 'assets' | 'snaps' | 'likes';
type PrototypeProfileTabIconName = Exclude<ProfilePagerKey, 'snaps'>;
type ProfilePagerItem = {
  key: ProfilePagerKey;
  label: string;
  renderIcon: ({
    color,
    size,
  }: {
    color: string;
    size: number;
  }) => React.ReactNode;
};

const prototypeProfileTabIconPaths = {
  casts: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  replies: [
    'M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z',
    'M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1',
  ],
  assets: [
    'M17 14h.01',
    'M7 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14',
  ],
  likes: [
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  ],
} satisfies Record<PrototypeProfileTabIconName, string[]>;

function PrototypeProfileTabIcon({
  color,
  icon,
  size,
}: {
  color: string;
  icon: PrototypeProfileTabIconName;
  size: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {prototypeProfileTabIconPaths[icon].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

function buildProfilePagerItems() {
  const items: ProfilePagerItem[] = [
    {
      key: 'casts',
      label: 'Casts',
      renderIcon: ({ color, size }: { color: string; size: number }) => (
        <PrototypeProfileTabIcon icon="casts" color={color} size={size} />
      ),
    },
    {
      key: 'replies',
      label: 'Replies and recasts',
      renderIcon: ({ color, size }: { color: string; size: number }) => (
        <PrototypeProfileTabIcon icon="replies" color={color} size={size} />
      ),
    },
    {
      key: 'assets',
      label: 'Assets',
      renderIcon: ({ color, size }: { color: string; size: number }) => (
        <PrototypeProfileTabIcon icon="assets" color={color} size={size} />
      ),
    },
    {
      key: 'snaps',
      label: 'Snaps',
      renderIcon: ({ color, size }: { color: string; size: number }) => (
        <SnapToolbarIcon color={color} size={size} />
      ),
    },
  ];

  items.push({
    key: 'likes',
    label: 'Likes',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <PrototypeProfileTabIcon icon="likes" color={color} size={size} />
    ),
  });

  return items;
}

export function UserProfileWithBanner({
  user,
  userProfile,
  initialTab,
  profileOpenIncludeReason,
  profileOpenCastHash,
  sourceOn,
}: {
  user: ApiUser;
  userProfile: ApiUserProfile;
  initialTab?: UserScreenInitialTab;
  profileOpenIncludeReason?: string;
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
}) {
  const scrollOffset = useSharedValue(0);
  const headerHeight = useSharedValue(0);
  const titleHeight = useSharedValue(0);
  const tabBarHeight = useSharedValue(0);
  const isRefreshing = useSharedValue(false);

  const profileSearchOpenRef = React.useRef<(() => void) | null>(null);
  const handleSearchPress = React.useCallback(() => {
    profileSearchOpenRef.current?.();
  }, []);
  const { trackEvent } = useAnalytics();

  const initialPage = React.useMemo(() => {
    const profilePagerItems = buildProfilePagerItems();
    const key: ProfilePagerKey =
      initialTab === 'castsAndReplies'
        ? 'replies'
        : initialTab === 'tokens'
          ? 'assets'
          : initialTab === 'snaps'
            ? 'snaps'
            : initialTab === 'likes'
              ? 'likes'
              : 'casts';
    const index = profilePagerItems.findIndex((item) => item.key === key);

    return index === -1 ? 0 : index;
  }, [initialTab]);

  useEffect(() => {
    trackEvent(AnalyticsEvent.ProfileOpen, {
      profile_fid: user.fid,
      ...(user.username ? { 'profile username': user.username } : {}),
      ...(profileOpenIncludeReason
        ? {
            includeReason: profileOpenIncludeReason,
            sourceSurface: 'home_feed',
          }
        : {}),
      ...(sourceOn ? { on: sourceOn } : {}),
      ...(profileOpenCastHash ? { castHash: profileOpenCastHash } : {}),
    });
  }, [
    profileOpenCastHash,
    profileOpenIncludeReason,
    sourceOn,
    trackEvent,
    user.fid,
    user.username,
  ]);

  return (
    <EventingProvider on="user-profile">
      <UserLinkHelpersProvider screenUserFid={user.fid}>
        <OnlyDragScrollProvider>
          <ProfilePagers
            user={user}
            userProfile={userProfile}
            initialPage={initialPage}
            profileOpenIncludeReason={profileOpenIncludeReason}
            profileOpenCastHash={profileOpenCastHash}
            sourceOn={sourceOn}
            scrollOffset={scrollOffset}
            headerHeight={headerHeight}
            titleHeight={titleHeight}
            tabBarHeight={tabBarHeight}
            isRefreshing={isRefreshing}
            onSearchPress={handleSearchPress}
          />
        </OnlyDragScrollProvider>
        <ProfileFloatingSearch user={user} openRef={profileSearchOpenRef} />
      </UserLinkHelpersProvider>
    </EventingProvider>
  );
}

function StickyProfileHeader({
  user: fallbackUser,
  userProfile,
  profileOpenIncludeReason,
  profileOpenCastHash,
  scrollOffset,
  titleHeight,
  headerHeight,
  isRefreshing,
  onSearchPress,
}: {
  user: ApiUser;
  userProfile: ApiUserProfile;
  profileOpenIncludeReason?: string;
  profileOpenCastHash?: string;
  scrollOffset: SharedValue<number>;
  titleHeight: SharedValue<number>;
  headerHeight: SharedValue<number>;
  isRefreshing: SharedValue<boolean>;
  onSearchPress?: () => void;
}) {
  const user = useGloballyCachedUser({ fallback: fallbackUser });

  const insets = useSafeAreaInsets();

  const t = useTheme();

  const goBack = useGoBack();

  const titleAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, headerHeight.value / 3],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, headerHeight.value / 3],
            [42, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const titleAnimStyleReverse = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, headerHeight.value / 3],
            [0, 42],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const imageUploaderRef = React.useRef<ImageUploaderInterface>(null);

  const onUserHeaderPress = React.useCallback(() => {
    if (scrollOffset.value === 0) {
      imageUploaderRef.current?.startHeaderImageUpload();
    }
  }, [scrollOffset.value]);

  const userIsProUser = user.profile.accountLevel === 'pro';

  const [hideAdminFeatures] = useHideAdminFeatures();
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const isAdmin = useIsAdmin();

  const { trackEvent } = useAnalytics();

  const [
    showMoreUserProfileActionsBottomSheet,
    setShowMoreUserProfileActionsBottomSheet,
  ] = React.useState(false);

  const [
    showFarcasterProUserProfileSheet,
    setShowFarcasterProUserProfileSheet,
  ] = React.useState<boolean>(false);

  const onProfileMenuPress = React.useCallback(() => {
    setShowMoreUserProfileActionsBottomSheet(true);
  }, []);

  const headerImageHeight = useSharedValue(0);

  const headerContainerStyle = useAnimatedStyle(() => {
    if (scrollOffset.value >= 0) {
      return {
        transform: [
          {
            translateY: Math.max(
              -scrollOffset.value,
              titleHeight.value - headerImageHeight.value,
            ),
          },
        ],
        zIndex: 3,
      };
    }
    return {
      transform: [{ translateY: 0 }],
      zIndex: 0,
    };
  });

  const headerImageStyle = useAnimatedStyle(() => {
    if (scrollOffset.value >= 0) {
      return {
        transform: [{ scale: 1 }],
      };
    }
    return {
      transform: [{ scale: 1 - scrollOffset.value / 50 }],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -scrollOffset.value,
        },
      ],
    };
  });

  const headerOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [-titleHeight.value, 0, titleHeight.value],
        [0.6, 0, 0.3],
        Extrapolation.CLAMP,
      ),
      transform:
        scrollOffset.value >= 0
          ? [{ scale: 1 }]
          : [{ scale: 1 - scrollOffset.value / 50 }],
    };
  });

  const refreshingStyle = useAnimatedStyle(() => {
    return {
      marginTop:
        headerImageHeight.value -
        titleHeight.value +
        interpolate(
          scrollOffset.value,
          [-100, 0],
          [64, 0],
          Extrapolation.CLAMP,
        ),
      opacity: isRefreshing.value
        ? 1
        : withDelay(100, withTiming(0, { duration: 100 })),
    };
  });

  const pfpWrapperStyle = useAnimatedStyle(() => {
    const scale = Math.min(Math.max(1 - scrollOffset.value / 100, 0.65), 1);
    return {
      transform: [{ translateY: -scrollOffset.value }],
      zIndex: scale === 0.65 ? 0 : 3,
    };
  });

  const pfpStyle = useAnimatedStyle(() => {
    const scale = Math.min(Math.max(1 - scrollOffset.value / 100, 0.65), 1);
    return {
      transform: [{ scale }],
    };
  });

  const { openLightbox } = useLightbox();
  const ref = useAnimatedRef<View>();

  const url = useMemo(() => {
    if (typeof user.pfp === 'undefined') {
      return;
    }

    return getStandardizedAvatarUrl({
      url: user.pfp.url,
      size: 'profile-header',
    });
  }, [user.pfp]);

  const onPfpPress = React.useCallback(() => {
    if (typeof url !== 'undefined') {
      trackEvent(AnalyticsEvent.ExpandPfp, { profile_fid: user.fid });
      runOnUI(() => {
        'worklet';
        runOnJS(openLightbox)({
          images: [
            {
              original: url,
              thumbnail: url,
              width: 72,
              aspectRatio: 1,
              rect: measure(ref),
              type: 'circle',
            },
          ],
          index: 0,
        });
      })();
    }
  }, [openLightbox, ref, trackEvent, user.fid, url]);

  const { activeLightboxRef } = useLightbox();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity:
        activeLightboxRef.value === url ? withTiming(0, { duration: 100 }) : 1,
    };
  });

  const showQualityButton =
    isAdmin && !hideAdminFeatures && typeof userProfile.quality !== 'undefined';
  const showNeynarScoreOverrideButton =
    canOverrideNeynarScore(currentUserFid) && !hideAdminFeatures;

  return (
    <Pressable
      onPress={onUserHeaderPress}
      pointerEvents="box-none"
      style={[{ zIndex: 1 }]}
      onLayout={(e) => {
        headerHeight.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View
        style={[{ zIndex: 3 }, headerContainerStyle]}
        onLayout={(e) => {
          headerImageHeight.value = e.nativeEvent.layout.height;
        }}
      >
        <Animated.View style={[headerImageStyle]}>
          <HeaderImage
            onImageChange={undefined}
            currentImageUrl={user.profile.bannerImageUrl}
            viewerCanUpdate={false}
            disabled={false}
            imageUploaderRef={null}
          />
        </Animated.View>
        <Animated.View
          style={[
            {
              backgroundColor: 'black',
            },
            t.absolute,
            t.inset0,
            headerOverlayStyle,
          ]}
        />
        <Animated.View
          style={[
            t.absolute,
            t.inset0,
            t.justifyCenter,
            t.itemsCenter,
            { zIndex: 4 },
            refreshingStyle,
          ]}
        >
          <ActivityIndicator />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[pfpWrapperStyle, t.bgDefault, { zIndex: 3 }]}>
        <View
          style={[
            t.relative,
            t.flexRow,
            t.itemsCenter,
            t.justifyEnd,
            { height: 56 },
          ]}
        >
          <AnimatedPressable
            style={[
              t.absolute,
              t.roundedFull,
              t.bgElevated,
              pfpStyle,
              { left: 8, top: -24, zIndex: 1, transformOrigin: 'bottom' },
            ]}
          >
            <Animated.View
              style={[
                {
                  borderWidth: 4,
                  borderRadius: 10000,
                  borderColor: t.colors.bgDefault,
                },
                t.relative,
                t.roundedFull,
              ]}
            >
              <Animated.View style={[animatedStyle]}>
                <TouchableOpacity
                  onPress={onPfpPress}
                  activeOpacity={0.75}
                  ref={ref}
                >
                  <Avatar
                    pfpUrl={user.pfp?.url}
                    diameter={72}
                    blockAnimated={true}
                    border={false}
                  />
                </TouchableOpacity>
              </Animated.View>
              {userIsProUser ? (
                <Pressable
                  onPress={() => setShowFarcasterProUserProfileSheet(true)}
                >
                  <FarcasterProBadgeRenderer />
                </Pressable>
              ) : undefined}
            </Animated.View>
          </AnimatedPressable>
        </View>
      </Animated.View>
      <Animated.View
        style={[headerStyle, { zIndex: 2 }]}
        pointerEvents="box-none"
      >
        <ProfileHeader
          user={user}
          userProfile={userProfile}
          profileOpenIncludeReason={profileOpenIncludeReason}
          profileOpenCastHash={profileOpenCastHash}
        />
      </Animated.View>
      <View
        style={[
          t.absolute,
          t.wFull,
          t.overflowHidden,
          { top: 0, zIndex: 3 },
          t.pX3,
          t.pB2,
          { paddingTop: insets.top },
        ]}
        onLayout={(e) => {
          titleHeight.value = e.nativeEvent.layout.height;
        }}
        pointerEvents="box-none"
      >
        <View style={[t.flexRow, t.justifyBetween]} pointerEvents="box-none">
          <View style={[t.flexRow, t.itemsCenter, t.flex1, { gap: 12 }]}>
            <IconPressable
              Icon={({ color, size }) => (
                <Octicons name="arrow-left" size={size} color={color} />
              )}
              onPress={goBack}
            />
            <View style={[t.relative, t.flexGrow, t.justifyCenter]}>
              <Animated.View
                style={[
                  t.flexRow,
                  t.itemsCenter,
                  {
                    gap: 8,
                    inset: 0,
                    position: 'absolute',
                    width: '100%',
                  },
                  titleAnimStyle,
                ]}
              >
                <View style={[{ width: 24, height: 24 }, t.relative]}>
                  <Avatar
                    pfpUrl={user.pfp?.url}
                    diameter={24}
                    blockAnimated={true}
                    border={false}
                  />
                  {userIsProUser ? (
                    <FarcasterProBadgeRenderer variant="sm" />
                  ) : undefined}
                </View>
                <Text2 size="lg" style={{ height: 24, color: '#ffffff' }}>
                  {resolveUsernameShort({
                    username: user.username,
                    fid: user.fid,
                  })}
                </Text2>
              </Animated.View>
              <Animated.View
                style={[
                  t.flexRow,
                  t.itemsCenter,
                  { gap: 8 },
                  titleAnimStyleReverse,
                ]}
              >
                {showNeynarScoreOverrideButton && (
                  <UserNeynarScoreOverrideButton
                    userProfile={userProfile as UserProfileWithNeynarScoreInfo}
                  />
                )}
                {showQualityButton && (
                  <UserQualityButton
                    user={user}
                    quality={userProfile.quality}
                    badness={userProfile.badness}
                  />
                )}
              </Animated.View>
            </View>
          </View>
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 12 }]}>
            <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <ProfileNotificationsSettings user={user} />
              {onSearchPress && (
                <IconPressable
                  Icon={({ color, size }) => (
                    <Search size={size} color={color} />
                  )}
                  onPress={onSearchPress}
                />
              )}
              <IconPressable
                Icon={({ color, size }) => (
                  <Octicons name="kebab-horizontal" size={size} color={color} />
                )}
                onPress={onProfileMenuPress}
              />
            </View>
          </View>
        </View>
      </View>
      {showMoreUserProfileActionsBottomSheet && (
        <MoreUserProfileActionsBottomSheet
          user={user}
          userProfile={userProfile}
          onDismiss={() => setShowMoreUserProfileActionsBottomSheet(false)}
          shouldManageStreaks={true}
        />
      )}
      {showFarcasterProUserProfileSheet && (
        <FarcasterProUserProfileSheet
          fid={user.fid}
          onDismiss={() => setShowFarcasterProUserProfileSheet(false)}
        />
      )}
    </Pressable>
  );
}

function ProfileHeader({
  user,
  profileOpenIncludeReason,
  profileOpenCastHash,
}: {
  user: ApiUser;
  userProfile: ApiUserProfile;
  profileOpenIncludeReason?: string;
  profileOpenCastHash?: string;
}) {
  const t = useTheme();

  const { linkifiedText } = useLinkifyText({
    text: (user.profile?.bio.text || '').replace(/\n/g, ' '),
    mentions: user.profile?.bio.mentions,
    channelMentions: user.profile.bio.channelMentions,
  });

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const navigate = useNavigate();

  const { triggerImpactAsync } = useHaptics();

  const { trackEvent } = useAnalytics();

  const onMessagePress = React.useCallback(() => {
    triggerImpactAsync();

    if (
      typeof user.viewerContext !== 'undefined' &&
      typeof user.viewerContext.blockedBy !== 'undefined' &&
      user.viewerContext.blockedBy
    ) {
      Alert.alert(
        'Unable to message',
        `${resolveUsername({
          username: user.username,
          fid: user.fid,
        })} has blocked you.`,
      );

      return;
    }

    trackEvent(AnalyticsEvent.ClickProfileDirectCast, {});

    navigate('PlaintextDirectCastsConversation', {
      counterParty: user,
      conversationId: buildNonGroupConversationId({
        participantFids: [user.fid, currentUserFid],
      }),
      create: true,
      intentText: undefined,
    });
  }, [currentUserFid, navigate, trackEvent, triggerImpactAsync, user]);

  const navigateToNestedScreen = useNavigateToNestedScreen();
  const { focusedBottomTabRef } = useBottomTab();

  const onEditProfilePress = React.useCallback(() => {
    triggerImpactAsync();

    navigateToNestedScreen(focusedBottomTabRef.current, 'EditProfile', {});
  }, [focusedBottomTabRef, navigateToNestedScreen, triggerImpactAsync]);

  const profileUrl = React.useMemo(() => {
    return user.username
      ? `https://farcaster.xyz/${user.username}`
      : `https://farcaster.xyz/profiles/${user.fid}`;
  }, [user.fid, user.username]);

  const handleShareProfile = React.useCallback(async () => {
    await shareUrl({
      title: `${resolveUsernameShort({ username: user.username, fid: user.fid })} on Farcaster`,
      url: profileUrl,
    });
  }, [profileUrl, user.fid, user.username]);

  const onShareProfilePress = React.useCallback(() => {
    triggerImpactAsync();

    handleShareProfile();
  }, [handleShareProfile, triggerImpactAsync]);

  const push = usePush();

  const onFollowingPress = React.useCallback(() => {
    push('Follows', {
      fid: user.fid,
      displayName: user.displayName,
      initialTab: 'following',
    });
  }, [push, user.displayName, user.fid]);

  const onFollowersPress = React.useCallback(() => {
    push('Follows', {
      fid: user.fid,
      displayName: user.displayName,
      initialTab: 'followers',
    });
  }, [push, user.displayName, user.fid]);

  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  const onProfileUrlPress = React.useCallback(() => {
    if (typeof user.profile.url !== 'undefined' && user.profile.url !== '') {
      trackEvent(AnalyticsEvent.PressProfileUrl, {});

      possiblyNavigateOrOpenUrl({ url: user.profile.url });
    }
  }, [possiblyNavigateOrOpenUrl, trackEvent, user.profile.url]);

  const { requestReview } = useAppStoreReview();

  const onAfterFollow = React.useCallback(() => {
    requestReview({ when: 'after-follow-on-profile' });
  }, [requestReview]);

  React.useEffect(() => {
    if (typeof user.pfp !== 'undefined') {
      Image.prefetch(user.pfp.url, {
        cachePolicy: 'memory-disk',
        headers: imageRequestHeaders,
      });
    }
  }, [user.pfp]);

  return (
    <View style={[t.pX3, t.pB1, t.bgDefault, t.wFull]} pointerEvents="box-none">
      <UserDisplayNameUsername
        user={user}
        headerSizing={true}
        isFollowingViewer={user.viewerContext?.followedBy}
        style="header"
        hideProBadge={true}
        showUpsell={true}
      />
      <View style={[t.flex, t.flexCol, t.mT2, { gap: 8 }]}>
        {!!user.profile?.bio.text && (
          <Text2 style={[t.texts.primary, t.textBase]}>{linkifiedText}</Text2>
        )}
        <View style={[t.flexRow, t.itemsCenter, t.wFull, { gap: 8 }]}>
          {typeof user.profile.url !== 'undefined' &&
            user.profile.url !== '' && (
              <TouchableOpacity
                onPress={onProfileUrlPress}
                style={[
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.h5,
                  { gap: 4, flexShrink: 1 },
                ]}
                activeOpacity={0.8}
              >
                <ProfileUrlContent url={user.profile.url} />
              </TouchableOpacity>
            )}
          {typeof user.profile.location !== 'undefined' &&
            user.profile.location.description !== '' && (
              <View style={[t.h5, t.flexRow, t.itemsCenter, { flexShrink: 1 }]}>
                <LocationSection location={user.profile.location} />
              </View>
            )}
          <View style={[t.flexRow, t.itemsCenter, { flexShrink: 0 }]}>
            <ConnectedAccountsSection user={user} />
          </View>
        </View>
        <ProfileTokenSection user={user} />
        <View style={[t.flexRow, t.itemsCenter, t.wFull, t.h5, { gap: 8 }]}>
          <Pressable
            style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
            onPress={onFollowingPress}
          >
            <Text2 size="sm" weight="semibold">
              {formatShorthandNumber(user.followingCount)}
            </Text2>
            <Text2 size="sm" color="secondary">
              Following
            </Text2>
          </Pressable>
          <Pressable
            style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
            onPress={onFollowersPress}
          >
            <Text2 size="sm" weight="semibold">
              {formatShorthandNumber(user.followerCount)}
            </Text2>
            <Text2 size="sm" color="secondary">
              Follower{user.followerCount > 1 && 's'}
            </Text2>
          </Pressable>
        </View>
        {user.fid !== currentUserFid && (
          <View style={[t.h8, t.flexRow, t.itemsCenter]}>
            <UpdatedFollowersYouKnowSection user={user} />
          </View>
        )}
      </View>
      <View style={[t.wFull, t.flexRow, t.itemsCenter, t.mT3, { gap: 8 }]}>
        {user.fid === currentUserFid && (
          <ButtonV2
            onPress={onEditProfilePress}
            variant="secondary"
            height="sm"
            width="flex1"
            title="Edit profile"
          />
        )}
        {user.fid === currentUserFid && (
          <ButtonV2
            onPress={onShareProfilePress}
            variant="secondary"
            height="sm"
            width="flex1"
            title="Share profile"
          />
        )}
        {user.fid !== currentUserFid && (
          <View style={[t.flex1]}>
            <FollowButton
              targetUser={user}
              size="sm"
              presentation="standalone"
              onAfterFollow={onAfterFollow}
              extraFollowAnalyticsData={
                profileOpenIncludeReason || profileOpenCastHash
                  ? {
                      ...(profileOpenIncludeReason
                        ? {
                            includeReason: profileOpenIncludeReason,
                            sourceSurface: 'home_feed',
                          }
                        : {}),
                      ...(profileOpenCastHash
                        ? { castHash: profileOpenCastHash }
                        : {}),
                    }
                  : undefined
              }
            />
          </View>
        )}
        {user.fid !== currentUserFid && (
          <ButtonV2
            onPress={onMessagePress}
            variant="secondary"
            height="sm"
            width="flex1"
            title="Message"
          />
        )}
        {user.fid !== currentUserFid && <UpdatedPayUserButton user={user} />}
      </View>
    </View>
  );
}

function ProfileUrlContent({ url }: { url: string }) {
  const t = useTheme();
  const domain = React.useMemo(() => resolveProfileUrlDomain(url), [url]);
  const miniAppId = React.useMemo(() => resolveFarcasterMiniAppId(url), [url]);
  const { data: domainManifestState } = useDomainManifestState({
    domain,
    enabled: typeof domain !== 'undefined' && typeof miniAppId === 'undefined',
  });
  const { data: miniAppFrame } = useNonSuspenseFrameDetails({
    id: miniAppId,
    enabled: typeof miniAppId !== 'undefined',
  });

  const miniApp = React.useMemo(() => {
    if (miniAppFrame) {
      return miniAppFrame;
    }

    const state = domainManifestState?.state;
    if (!state?.verified || !state.frameConfig) {
      return undefined;
    }

    return state.frameConfig;
  }, [domainManifestState?.state, miniAppFrame]);

  if (miniApp) {
    return (
      <>
        <FrameIconImage imageUrl={miniApp.iconUrl} size={16} />
        <Text2
          size="sm"
          weight="regular"
          color="brand"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ flexShrink: 1 }}
        >
          {miniApp.name}
        </Text2>
      </>
    );
  }

  return (
    <>
      <Link2Icon
        size={12}
        color={t.colors.text.brand}
        style={{ marginTop: 2, flexShrink: 0 }}
      />
      <Text2
        size="sm"
        weight="regular"
        color="brand"
        numberOfLines={1}
        ellipsizeMode="head"
        style={{ flexShrink: 1 }}
      >
        {transformProfileUrl({ url })}
      </Text2>
    </>
  );
}

function ProfilePagers({
  user: fallbackUser,
  initialPage,
  profileOpenIncludeReason,
  profileOpenCastHash,
  sourceOn,
  userProfile,
  scrollOffset,
  headerHeight,
  titleHeight,
  tabBarHeight,
  isRefreshing,
  onSearchPress,
}: {
  user: ApiUser;
  userProfile: ApiUserProfile;
  initialPage: number;
  profileOpenIncludeReason?: string;
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  titleHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  isRefreshing: SharedValue<boolean>;
  onSearchPress?: () => void;
}) {
  const user = useGloballyCachedUser({ fallback: fallbackUser });
  const prefetchUserCastsAndReplies = usePrefetchUserCastsAndReplies();
  const prefetchUserLikedCasts = usePrefetchUserLikedCasts();
  const prefetchProfileSnapCasts = usePrefetchProfileSnapCasts();

  useEffect(() => {
    prefetchUserCastsAndReplies({
      fid: user.fid,
      shouldSkipIfRecentlyPrefetched: true,
    });
    prefetchUserLikedCasts({
      fid: user.fid,
      shouldSkipIfRecentlyPrefetched: true,
    });
    prefetchProfileSnapCasts({
      fid: user.fid,
      shouldSkipIfRecentlyPrefetched: true,
    });
  }, [
    prefetchProfileSnapCasts,
    prefetchUserCastsAndReplies,
    prefetchUserLikedCasts,
    user.fid,
  ]);

  const profilePagerItems = React.useMemo(() => {
    return buildProfilePagerItems();
  }, []);

  const t = useTheme();

  const pagerRef = React.useRef<PagerRef>(null);

  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const onPageSelected = React.useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const { trackEvent } = useAnalytics();

  const onPageSelecting = React.useCallback(
    (index: number, reason: 'swipe' | 'tab-click') => {
      const profileViewEvent = (() => {
        switch (profilePagerItems[index]?.key) {
          case 'casts':
            return AnalyticsEvent.ViewProfileFeed;
          case 'replies':
            return AnalyticsEvent.ViewProfileReplies;
          case 'assets':
            return AnalyticsEvent.ViewProfileTokens;
          case 'snaps':
            return undefined;
          case 'likes':
            return AnalyticsEvent.ViewProfileLikes;
          default:
            return undefined;
        }
      })();

      if (!profileViewEvent) {
        return;
      }

      if (profileViewEvent === AnalyticsEvent.ViewProfileFeed && sourceOn) {
        trackEvent(profileViewEvent, {
          reason,
          on: sourceOn,
          ...(profileOpenCastHash ? { castHash: profileOpenCastHash } : {}),
        });
        return;
      }

      trackEvent(profileViewEvent, {
        reason,
        ...(profileOpenCastHash ? { castHash: profileOpenCastHash } : {}),
      });
    },
    [profileOpenCastHash, profilePagerItems, sourceOn, trackEvent],
  );

  const onAssetTabSelect = React.useCallback(
    (tab: ProfileAssetTab) => {
      trackEvent(
        tab === 'tokens'
          ? AnalyticsEvent.ViewProfileTokens
          : AnalyticsEvent.ViewProfileCollection,
        {
          reason: 'tab-click',
          ...(profileOpenCastHash ? { castHash: profileOpenCastHash } : {}),
        },
      );
    },
    [profileOpenCastHash, trackEvent],
  );

  const onPressSelected = React.useCallback(() => {}, []);

  const onPageScrollStateChanged = React.useCallback(
    (_state: 'idle' | 'dragging' | 'settling') => {},
    [],
  );

  const {
    onBeginDrag: onBeginDragFromContext,
    onEndDrag: onEndDragFromContext,
    onScroll: onScrollFromContext,
    onMomentumEnd: onMomentumEndFromContext,
  } = useScrollHandlers();

  const { height } = Dimensions.get('window');

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e, ctx) {
      onBeginDragFromContext?.(e, ctx);
    },
    onEndDrag(e, ctx) {
      onEndDragFromContext?.(e, ctx);
    },
    onScroll(e, ctx: { lastY?: number }) {
      onScrollFromContext?.(e, ctx);

      const newY = e.contentOffset.y as number;

      // If it's the first run, initialize lastY
      if (typeof ctx.lastY !== 'number') {
        ctx.lastY = newY;
        scrollOffset.value = newY;
        return;
      }

      // We don't need to animate the scroll past the screen's halfway point.
      if (newY < height / 2 && Math.abs(newY - ctx.lastY) >= 1) {
        ctx.lastY = newY;
        scrollOffset.value = newY;
      }
    },
    onMomentumEnd(e, ctx) {
      onMomentumEndFromContext?.(e, ctx);
    },
  });

  const onTabBarLayout = useNonReactiveCallback((evt: LayoutChangeEvent) => {
    tabBarHeight.value = evt.nativeEvent.layout.height;
  });

  const animatedTabBarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -Math.min(
            scrollOffset.value,
            headerHeight.value - titleHeight.value,
          ),
        },
      ],
    };
  });

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <Animated.View
          style={[t.bgDefault, animatedTabBarStyle, { zIndex: 1 }]}
        >
          <TabBar
            onSelect={props.onSelect}
            selectedPage={props.selectedPage}
            onLayout={onTabBarLayout}
            onPressSelected={onPressSelected}
            items={profilePagerItems}
          />
        </Animated.View>
      );
    },
    [
      animatedTabBarStyle,
      onPressSelected,
      onTabBarLayout,
      profilePagerItems,
      t.bgDefault,
    ],
  );

  const renderHeader = React.useCallback(() => {
    return (
      <StickyProfileHeader
        user={user}
        userProfile={userProfile}
        profileOpenIncludeReason={profileOpenIncludeReason}
        profileOpenCastHash={profileOpenCastHash}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        titleHeight={titleHeight}
        isRefreshing={isRefreshing}
        onSearchPress={onSearchPress}
      />
    );
  }, [
    user,
    userProfile,
    profileOpenIncludeReason,
    profileOpenCastHash,
    scrollOffset,
    headerHeight,
    titleHeight,
    isRefreshing,
    onSearchPress,
  ]);

  const containerComponent = React.useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <View style={[t.absolute, t.flex1, t.hFull, t.wFull]}>{children}</View>
      );
    },
    [t.absolute, t.flex1, t.hFull, t.wFull],
  );

  const pagerChildren = React.useMemo(() => {
    const children = [
      <ProfileCasts
        key="casts"
        fid={user.fid}
        displayName={user.displayName}
        onScroll={scrollHandler}
        enabled={selectedIndex === 0}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        isRefreshing={isRefreshing}
      />,
      <ProfileCastsAndReplies
        key="replies"
        fid={user.fid}
        displayName={user.displayName}
        onScroll={scrollHandler}
        enabled={selectedIndex === 1}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        isRefreshing={isRefreshing}
      />,
      <ProfileAssets
        key="assets"
        user={user}
        onScroll={scrollHandler}
        enabled={selectedIndex === 2}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        isRefreshing={isRefreshing}
        onAssetTabSelect={onAssetTabSelect}
      />,
      <ProfileSnapCasts
        key="snaps"
        fid={user.fid}
        onScroll={scrollHandler}
        enabled={selectedIndex === 3}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        isRefreshing={isRefreshing}
      />,
    ];

    const currentIndex = 4;

    children.push(
      <ProfileLikes
        key="likes"
        fid={user.fid}
        displayName={user.displayName}
        onScroll={scrollHandler}
        enabled={selectedIndex === currentIndex}
        scrollOffset={scrollOffset}
        headerHeight={headerHeight}
        tabBarHeight={tabBarHeight}
        isRefreshing={isRefreshing}
      />,
    );

    return children;
  }, [
    user,
    scrollHandler,
    selectedIndex,
    scrollOffset,
    headerHeight,
    tabBarHeight,
    isRefreshing,
    onAssetTabSelect,
  ]);

  return (
    <React.Suspense
      fallback={
        <FullScreenLoadingIndicator debugName="UserProfileWithBanner" />
      }
    >
      <Pager
        key={'profile-pager'}
        ref={pagerRef}
        initialPage={initialPage}
        onPageSelecting={onPageSelecting}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
        renderTabBar={renderTabBar}
        renderHeader={renderHeader}
        containerComponent={containerComponent}
      >
        {pagerChildren}
      </Pager>
    </React.Suspense>
  );
}

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<ApiCast>);

const LIST_BATCH_SIZE = 5;

function TabLoadingIndicator() {
  const t = useTheme();
  return (
    <View style={[t.h36, t.mT8]}>
      <LoadingIndicator />
    </View>
  );
}

function HeaderGap({
  headerHeight,
  tabBarHeight,
}: {
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value + tabBarHeight.value,
    };
  });
  return <Animated.View style={animatedStyle} />;
}

type PageProps = {
  enabled: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  tabBarHeight: SharedValue<number>;
  isRefreshing: SharedValue<boolean>;
};

function ProfileCasts(
  props: {
    fid: number;
    displayName: string;
  } & PageProps,
) {
  if (!props.enabled) {
    return <TabLoadingIndicator />;
  }

  return (
    <React.Suspense fallback={<TabLoadingIndicator />}>
      <ProfileCastsInner {...props} />
    </React.Suspense>
  );
}

function ProfileCastsInner(
  props: {
    fid: number;
    displayName: string;
  } & PageProps,
) {
  const {
    fid,
    displayName,
    onScroll,
    headerHeight,
    tabBarHeight,
    scrollOffset,
  } = props;
  const t = useTheme();
  const prefetchThreadCast = usePrefetchThreadCast();
  const extraData = useCommonFlatListExtraData();
  const { data, fetchNextPage, refetch, hasNextPage, isFetchingNextPage } =
    useUserCasts({
      fid,
    });

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [hasLaidOut, setHasLaidOut] = React.useState(false);
  const refresh = useRefreshInfiniteFirstPageOnly<UserCastsCache>(
    buildUserCastsKey({ fid }),
    refetch,
  );
  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    refresh().finally(() => {
      setIsRefreshing(false);
    });
  }, [refresh]);

  const casts = React.useMemo(
    () => data.pages.flatMap((page) => page.result.casts) || [],
    [data],
  );
  const { displayedItems: displayedCasts, handleEndReached } = useDisplayLimit({
    data: casts,
    batchSize: LIST_BATCH_SIZE,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  });

  const renderItem = React.useCallback(
    ({ item }: { item: ApiCast }) => {
      return (
        <Pressable onPressIn={() => prefetchThreadCast(item)}>
          <Cast cast={item} />
        </Pressable>
      );
    },
    [prefetchThreadCast],
  );
  const viewabilityPairsForRecordCastOnView = useRecordCastOnView({
    isFocused: true,
  });
  const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();
  const viewabilityConfigCallbackPairsRef = React.useRef([
    ...viewabilityPairsForVideos,
    ...viewabilityPairsForRecordCastOnView,
  ]);

  React.useEffect(() => {
    props.isRefreshing.value = isRefreshing;
  }, [isRefreshing, props.isRefreshing]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
    );
  }, [headerHeight, tabBarHeight]);

  const recentlyRefreshedRef = React.useRef(false);
  useAnimatedReaction(
    () => scrollOffset.value,
    (value) => {
      const approx = Math.round(value);
      if (approx < -100 && !recentlyRefreshedRef.current) {
        recentlyRefreshedRef.current = true;
        runOnJS(handleRefresh)();
      }
      if (approx >= 0) {
        recentlyRefreshedRef.current = false;
      }
    },
    [handleRefresh],
  );

  const insets = useSafeAreaInsets();

  const contentOffset = useMemo(() => {
    if (!hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, hasLaidOut]);

  const ListFooterComponent = useMemo(() => {
    // Show loader once we've revealed all cached casts so the user gets an
    // immediate cue while the next page is in flight.
    const reachedEndOfCached = displayedCasts.length === casts.length;
    const shouldShowLoader =
      hasNextPage && (isFetchingNextPage || reachedEndOfCached);
    return shouldShowLoader ? (
      <View style={[t.h36, t.mT8]}>
        <LoadingIndicator />
      </View>
    ) : null;
  }, [
    hasNextPage,
    isFetchingNextPage,
    displayedCasts.length,
    casts.length,
    t.h36,
    t.mT8,
  ]);

  const ListEmptyComponent = useMemo(() => {
    return (
      <Empty
        message=""
        justify="start"
        subMessage={`${displayName} hasn't casted yet.`}
      />
    );
  }, [displayName]);

  return (
    <AnimatedImageViewabilityScopeProvider>
      <AnimatedFlashList
        {...STANDARD_FLASHLIST_PERF_PROPS}
        onScroll={onScroll}
        data={displayedCasts}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        {...ZERO_SCROLL_INSET_PROPS}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        viewabilityConfigCallbackPairs={
          viewabilityConfigCallbackPairsRef.current
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentOffset={contentOffset}
        onLayout={() => {
          if (!hasLaidOut) {
            setHasLaidOut(true);
          }
        }}
      />
    </AnimatedImageViewabilityScopeProvider>
  );
}

function ProfileCastsAndReplies(
  props: {
    fid: number;
    displayName: string;
  } & PageProps,
) {
  if (!props.enabled) {
    return <TabLoadingIndicator />;
  }

  return (
    <React.Suspense fallback={<TabLoadingIndicator />}>
      <ProfileCastsAndRepliesInner {...props} />
    </React.Suspense>
  );
}

function ProfileCastsAndRepliesInner(
  props: {
    fid: number;
    displayName: string;
  } & PageProps,
) {
  const {
    fid,
    displayName,
    onScroll,
    headerHeight,
    tabBarHeight,
    scrollOffset,
  } = props;

  const t = useTheme();
  const prefetchThreadCast = usePrefetchThreadCast();
  const extraData = useCommonFlatListExtraData();
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  const { data, fetchNextPage, refetch, hasNextPage, isFetchingNextPage } =
    useUserCastsAndReplies({
      fid,
    });

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const refresh = useRefreshInfiniteFirstPageOnly<UserCastsCache>(
    buildUserCastsKey({ fid }),
    refetch,
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ApiCast }) => {
      return (
        <Pressable onPressIn={() => prefetchThreadCast(item)}>
          <Cast cast={item} />
        </Pressable>
      );
    },
    [prefetchThreadCast],
  );

  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    refresh().finally(() => {
      setIsRefreshing(false);
    });
  }, [refresh]);

  const casts = React.useMemo(
    () => data?.pages.flatMap((page) => page.result.casts) || [],
    [data],
  );

  const { displayedItems: displayedCasts, handleEndReached } = useDisplayLimit({
    data: casts,
    batchSize: LIST_BATCH_SIZE,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  });

  const viewabilityPairsForRecordCastOnView = useRecordCastOnView({
    isFocused: true,
  });
  const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();
  const viewabilityConfigCallbackPairsRef = React.useRef([
    ...viewabilityPairsForVideos,
    ...viewabilityPairsForRecordCastOnView,
  ]);

  React.useEffect(() => {
    props.isRefreshing.value = isRefreshing;
  }, [isRefreshing, props.isRefreshing]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
    );
  }, [headerHeight, tabBarHeight]);

  const recentlyRefreshedRef = React.useRef(false);
  useAnimatedReaction(
    () => scrollOffset.value,
    (value) => {
      const approx = Math.round(value);
      if (approx < -100 && !recentlyRefreshedRef.current) {
        recentlyRefreshedRef.current = true;
        runOnJS(handleRefresh)();
      }
      if (approx >= 0) {
        recentlyRefreshedRef.current = false;
      }
    },
    [handleRefresh],
  );

  const insets = useSafeAreaInsets();

  const contentOffset = useMemo(() => {
    if (!hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, hasLaidOut]);

  const ListFooterComponent = useMemo(() => {
    // Show loader once we've revealed all cached casts so the user gets an
    // immediate cue while the next page is in flight.
    const reachedEndOfCached = displayedCasts.length === casts.length;
    const shouldShowLoader =
      hasNextPage && (isFetchingNextPage || reachedEndOfCached);
    return shouldShowLoader ? (
      <View style={[t.h36, t.mT8]}>
        <LoadingIndicator />
      </View>
    ) : null;
  }, [
    hasNextPage,
    isFetchingNextPage,
    displayedCasts.length,
    casts.length,
    t.h36,
    t.mT8,
  ]);

  const ListEmptyComponent = useMemo(() => {
    return (
      <Empty
        message=""
        justify="start"
        subMessage={`${displayName} hasn't casted yet.`}
      />
    );
  }, [displayName]);

  return (
    <AnimatedImageViewabilityScopeProvider>
      <AnimatedFlashList
        {...STANDARD_FLASHLIST_PERF_PROPS}
        onScroll={onScroll}
        data={displayedCasts}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        {...ZERO_SCROLL_INSET_PROPS}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        viewabilityConfigCallbackPairs={
          viewabilityConfigCallbackPairsRef.current
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentOffset={contentOffset}
        onLayout={() => {
          if (!hasLaidOut) {
            setHasLaidOut(true);
          }
        }}
      />
    </AnimatedImageViewabilityScopeProvider>
  );
}

function ProfileSnapCasts(
  props: {
    fid: number;
  } & PageProps,
) {
  if (!props.enabled) {
    return <TabLoadingIndicator />;
  }

  return (
    <React.Suspense fallback={<TabLoadingIndicator />}>
      <ProfileSnapCastsInner {...props} />
    </React.Suspense>
  );
}

function ProfileSnapCastsInner(
  props: {
    fid: number;
  } & PageProps,
) {
  const { fid, onScroll, headerHeight, tabBarHeight, scrollOffset } = props;

  const t = useTheme();
  const prefetchThreadCast = usePrefetchThreadCast();
  const extraData = useCommonFlatListExtraData();
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  const { data, onEndReached, refetch, hasNextPage, isFetchingNextPage } =
    usePurgedProfileSnapCasts({
      fid,
    });

  const refresh = useRefreshProfileSnapCastsFirstPage({
    fid,
    refetch,
  });

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    refresh().finally(() => {
      setIsRefreshing(false);
    });
  }, [refresh]);

  const casts = React.useMemo(
    () => data?.pages.flatMap((page) => page.result.casts) || [],
    [data],
  );

  const { displayedItems: displayedCasts, handleEndReached } = useDisplayLimit({
    data: casts,
    batchSize: LIST_BATCH_SIZE,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage: onEndReached,
  });

  const renderItem = React.useCallback(
    ({ item }: { item: ApiCast }) => {
      return (
        <Pressable onPressIn={() => prefetchThreadCast(item)}>
          <Cast cast={item} />
        </Pressable>
      );
    },
    [prefetchThreadCast],
  );

  const viewabilityPairsForRecordCastOnView = useRecordCastOnView({
    isFocused: true,
  });
  const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();
  const viewabilityConfigCallbackPairsRef = React.useRef([
    ...viewabilityPairsForVideos,
    ...viewabilityPairsForRecordCastOnView,
  ]);

  React.useEffect(() => {
    props.isRefreshing.value = isRefreshing;
  }, [isRefreshing, props.isRefreshing]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
    );
  }, [headerHeight, tabBarHeight]);

  const recentlyRefreshedRef = React.useRef(false);
  useAnimatedReaction(
    () => scrollOffset.value,
    (value) => {
      const approx = Math.round(value);
      if (approx < -100 && !recentlyRefreshedRef.current) {
        recentlyRefreshedRef.current = true;
        runOnJS(handleRefresh)();
      }
      if (approx >= 0) {
        recentlyRefreshedRef.current = false;
      }
    },
    [handleRefresh],
  );

  const insets = useSafeAreaInsets();

  const contentOffset = useMemo(() => {
    if (!hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, hasLaidOut]);

  const ListFooterComponent = useMemo(() => {
    const reachedEndOfCached = displayedCasts.length === casts.length;
    const shouldShowLoader =
      hasNextPage && (isFetchingNextPage || reachedEndOfCached);
    return shouldShowLoader ? (
      <View style={[t.h36, t.mT8]}>
        <LoadingIndicator />
      </View>
    ) : null;
  }, [
    hasNextPage,
    isFetchingNextPage,
    displayedCasts.length,
    casts.length,
    t.h36,
    t.mT8,
  ]);

  const ListEmptyComponent = useMemo(() => {
    return <ProfileSnapCastsEmptyState />;
  }, []);

  return (
    <AnimatedImageViewabilityScopeProvider>
      <AnimatedFlashList
        {...STANDARD_FLASHLIST_PERF_PROPS}
        onScroll={onScroll}
        data={displayedCasts}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        {...ZERO_SCROLL_INSET_PROPS}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        viewabilityConfigCallbackPairs={
          viewabilityConfigCallbackPairsRef.current
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentOffset={contentOffset}
        onLayout={() => {
          if (!hasLaidOut) {
            setHasLaidOut(true);
          }
        }}
      />
    </AnimatedImageViewabilityScopeProvider>
  );
}

function ProfileSnapCastsEmptyState() {
  const t = useTheme();

  return (
    <View style={[t.flexGrow, t.mX5, t.mT10, t.itemsCenter]}>
      <Text2 size="lg" color="primary" weight="semibold" style={[t.textCenter]}>
        No snaps yet
      </Text2>
      <Text2 size="base" color="secondary" style={[t.textCenter, t.mT2]}>
        Published snaps will appear here.
      </Text2>
    </View>
  );
}

function ProfileLikes(
  props: {
    fid: number;
    displayName: string;
  } & PageProps,
) {
  if (!props.enabled) {
    return <TabLoadingIndicator />;
  }

  return (
    <React.Suspense fallback={<TabLoadingIndicator />}>
      <ProfileLikesInner {...props} />
    </React.Suspense>
  );
}

function ProfileLikesInner(
  props: {
    fid: number;
    displayName: string;
  } & PageProps,
) {
  const {
    fid,
    displayName,
    onScroll,
    headerHeight,
    tabBarHeight,
    scrollOffset,
  } = props;

  const t = useTheme();
  const prefetchThreadCast = usePrefetchThreadCast();

  const extraData = useCommonFlatListExtraData();
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  const { data, fetchNextPage, refetch, hasNextPage, isFetchingNextPage } =
    useUserLikedCasts({
      fid,
    });

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const refresh = useRefreshInfiniteFirstPageOnly<UserCastsCache>(
    buildUserCastsKey({ fid }),
    refetch,
  );
  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    refresh().finally(() => {
      setIsRefreshing(false);
    });
  }, [refresh]);

  const casts = React.useMemo(
    () => data?.pages.flatMap((page) => page.result.casts) || [],
    [data],
  );

  const { displayedItems: displayedCasts, handleEndReached } = useDisplayLimit({
    data: casts,
    batchSize: LIST_BATCH_SIZE,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  });

  const renderItem = React.useCallback(
    ({ item }: { item: ApiCast }) => {
      return (
        <Pressable onPressIn={() => prefetchThreadCast(item)}>
          <Cast cast={item} />
        </Pressable>
      );
    },
    [prefetchThreadCast],
  );

  const viewabilityPairsForRecordCastOnView = useRecordCastOnView({
    isFocused: true,
  });
  const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();
  const viewabilityConfigCallbackPairsRef = React.useRef([
    ...viewabilityPairsForVideos,
    ...viewabilityPairsForRecordCastOnView,
  ]);

  React.useEffect(() => {
    props.isRefreshing.value = isRefreshing;
  }, [isRefreshing, props.isRefreshing]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
    );
  }, [headerHeight, tabBarHeight]);

  const recentlyRefreshedRef = React.useRef(false);
  useAnimatedReaction(
    () => scrollOffset.value,
    (value) => {
      const approx = Math.round(value);
      if (approx < -100 && !recentlyRefreshedRef.current) {
        recentlyRefreshedRef.current = true;
        runOnJS(handleRefresh)();
      }
      if (approx >= 0) {
        recentlyRefreshedRef.current = false;
      }
    },
    [handleRefresh],
  );

  const insets = useSafeAreaInsets();

  const contentOffset = useMemo(() => {
    if (!hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, hasLaidOut]);

  const ListFooterComponent = useMemo(() => {
    // Show loader once we've revealed all cached casts so the user gets an
    // immediate cue while the next page is in flight.
    const reachedEndOfCached = displayedCasts.length === casts.length;
    const shouldShowLoader =
      hasNextPage && (isFetchingNextPage || reachedEndOfCached);
    return shouldShowLoader ? (
      <View style={[t.h36, t.mT8]}>
        <LoadingIndicator />
      </View>
    ) : null;
  }, [
    hasNextPage,
    isFetchingNextPage,
    displayedCasts.length,
    casts.length,
    t.h36,
    t.mT8,
  ]);

  const ListEmptyComponent = useMemo(() => {
    return (
      <Empty
        message=""
        justify="start"
        subMessage={`${displayName} hasn't liked any casts yet.`}
      />
    );
  }, [displayName]);

  return (
    <AnimatedImageViewabilityScopeProvider>
      <AnimatedFlashList
        {...STANDARD_FLASHLIST_PERF_PROPS}
        onScroll={onScroll}
        data={displayedCasts}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        {...ZERO_SCROLL_INSET_PROPS}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        viewabilityConfigCallbackPairs={
          viewabilityConfigCallbackPairsRef.current
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentOffset={contentOffset}
        onLayout={() => {
          if (!hasLaidOut) {
            setHasLaidOut(true);
          }
        }}
      />
    </AnimatedImageViewabilityScopeProvider>
  );
}

type ProfileAssetTab = 'tokens' | 'collectibles';

function ProfileAssets(
  props: {
    user: ApiUser;
    onAssetTabSelect: (tab: ProfileAssetTab) => void;
  } & PageProps,
) {
  if (!props.enabled) {
    return <TabLoadingIndicator />;
  }

  return (
    <React.Suspense fallback={<TabLoadingIndicator />}>
      <ProfileAssetsInner {...props} />
    </React.Suspense>
  );
}

function ProfileAssetsInner(
  props: {
    user: ApiUser;
    onAssetTabSelect: (tab: ProfileAssetTab) => void;
  } & PageProps,
) {
  const { user, headerHeight, onAssetTabSelect, tabBarHeight } = props;
  const [selectedAssetTab, setSelectedAssetTab] =
    React.useState<ProfileAssetTab>('tokens');

  const handleAssetTabSelect = React.useCallback(
    (tab: ProfileAssetTab) => {
      if (tab === selectedAssetTab) {
        return;
      }

      setSelectedAssetTab(tab);
      onAssetTabSelect(tab);
    },
    [onAssetTabSelect, selectedAssetTab],
  );

  const headerContent = useMemo(() => {
    return (
      <>
        <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
        <ProfileAssetsTabBar
          selectedAssetTab={selectedAssetTab}
          setSelectedAssetTab={handleAssetTabSelect}
        />
      </>
    );
  }, [handleAssetTabSelect, headerHeight, selectedAssetTab, tabBarHeight]);

  if (selectedAssetTab === 'collectibles') {
    return (
      <ProfileCollectibleCastsInner
        {...props}
        fid={user.fid}
        headerContent={headerContent}
      />
    );
  }

  return <ProfileTokensInner {...props} headerContent={headerContent} />;
}

function ProfileAssetsTabBar({
  selectedAssetTab,
  setSelectedAssetTab,
}: {
  selectedAssetTab: ProfileAssetTab;
  setSelectedAssetTab: (tab: ProfileAssetTab) => void;
}) {
  const t = useTheme();

  return (
    <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pT4, t.pB2, { gap: 20 }]}>
      {(
        [
          ['tokens', 'Wallet'],
          ['collectibles', 'Collectibles'],
        ] satisfies Array<[ProfileAssetTab, string]>
      ).map(([tab, label]) => {
        const selected = selectedAssetTab === tab;

        return (
          <Pressable
            key={tab}
            onPress={() => setSelectedAssetTab(tab)}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
          >
            <Text2
              size="sm"
              weight="semibold"
              color={selected ? 'primary' : 'secondary'}
            >
              {label}
            </Text2>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProfileTokensInner(
  props: {
    user: ApiUser;
    headerContent?: React.ReactElement;
  } & PageProps,
) {
  const {
    user,
    onScroll,
    headerHeight,
    tabBarHeight,
    scrollOffset,
    headerContent,
  } = props;

  const [hasLaidOut, setHasLaidOut] = React.useState(false);
  const [showUserActivitySheet, setShowUserActivitySheet] =
    React.useState<ApiTokenLink | null>(null);

  const insets = useSafeAreaInsets();

  const contentOffset = useMemo(() => {
    if (!hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, hasLaidOut]);

  const headerGap = useMemo(() => {
    return (
      headerContent ?? (
        <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
      )
    );
  }, [headerContent, headerHeight, tabBarHeight]);

  return (
    <>
      <TraderTokens
        user={user}
        contentOffset={contentOffset}
        headerGap={headerGap}
        componentType="animated"
        onTokenPress={(token) => setShowUserActivitySheet(token)}
        onScroll={onScroll}
        onLayout={() => {
          if (!hasLaidOut) {
            setHasLaidOut(true);
          }
        }}
      />
      {showUserActivitySheet && (
        <TokenUserActivityBottomSheetModal
          user={user}
          token={showUserActivitySheet}
          onDismiss={() => setShowUserActivitySheet(null)}
        />
      )}
    </>
  );
}

function ProfileCollectibleCastsInner(
  props: {
    fid: number;
    headerContent?: React.ReactElement;
  } & PageProps,
) {
  const {
    fid,
    onScroll,
    headerHeight,
    tabBarHeight,
    scrollOffset,
    headerContent,
  } = props;

  const extraData = useCommonFlatListExtraData();
  const [hasLaidOut, setHasLaidOut] = React.useState(false);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      headerContent ?? (
        <HeaderGap headerHeight={headerHeight} tabBarHeight={tabBarHeight} />
      )
    );
  }, [headerContent, headerHeight, tabBarHeight]);

  const insets = useSafeAreaInsets();

  const contentOffset = useMemo(() => {
    if (!hasLaidOut) {
      return { x: 0, y: 0 };
    }
    return {
      x: 0,
      y: Math.min(
        scrollOffset.value,
        headerHeight.value - tabBarHeight.value - insets.top,
      ),
    };
  }, [scrollOffset, headerHeight, tabBarHeight, insets, hasLaidOut]);

  return (
    <CollectibleCastCollection
      fid={fid}
      onScroll={onScroll}
      extraData={extraData}
      ListHeaderComponent={ListHeaderComponent}
      contentOffset={contentOffset}
      emptyMessage="This user doesn't have any collectibles yet."
      onLayout={() => {
        if (!hasLaidOut) {
          setHasLaidOut(true);
        }
      }}
    />
  );
}
// Callback can be anything so going with *any*
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

/**
 * Returns a callback whose identity never changes, but which always calls the
 * **latest** `fn`.  Fully preserves parameter and return types.
 */
function useNonReactiveCallback<F extends AnyFn>(fn: F): F {
  const ref = React.useRef<F>(fn);

  // Keep `ref.current` in sync with the newest callback
  React.useInsertionEffect(() => {
    ref.current = fn;
  }, [fn]);

  // `ref` itself is stable, so the dependency array can stay empty
  const stable = React.useCallback((...args: Parameters<F>): ReturnType<F> => {
    // `ref.current` is always defined here

    return ref.current!(...args);
  }, []);

  return stable as F;
}

function FarcasterProBadgeRenderer({
  variant = 'default',
}: {
  variant?: 'default' | 'sm';
}) {
  const t = useTheme();

  return (
    <View
      style={[
        t.absolute,
        t.bottom0,
        t.right0,
        {
          marginRight: variant === 'sm' ? -2 : -4,
          marginBottom: variant === 'sm' ? -2 : -4,
        },
        t.roundedFull,
        t.flex,
        t.itemsCenter,
        t.justifyCenter,
        t.flexShrink0,
      ]}
    >
      <FarcasterProBadge
        size={variant === 'sm' ? 12 : 24}
        showBorder={variant === 'default'}
      />
    </View>
  );
}
