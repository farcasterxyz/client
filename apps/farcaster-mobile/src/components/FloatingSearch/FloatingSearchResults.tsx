import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChannel,
  ApiFrame,
  ApiTokenLink,
  ApiUser,
} from 'farcaster-client-data';
import {
  resolveUsername,
  useFetchUserByFid,
  UserCache,
  useSearchSummary,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  FarcasterProBadge,
  FullScreenLoadingIndicator,
  isAddress,
  parseAssetId,
  RecentlySearchedToken,
  Text,
  TextWithPress,
  tokenLinkToMinimalToken,
  TokenListItem,
  TokenListItemPlaceholder,
  TypographyBody,
  useCachedOrQueryToken,
  useRecentlySearchedTokens,
  useUnfocusInputs,
  useUserLevel,
} from 'farcaster-expo';
import { Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChannelSearchItem } from '~/components/channels/ChannelSearchItem';
import { MiniAppSearchItem } from '~/components/miniApps/MiniAppSearchItem';
import { Text2 } from '~/components/Text';
import { UserSearchItem } from '~/components/users/UserSearchItem';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useRecentlyViewedUsers } from '~/hooks/useRecentlyViewedUser';
import { useRecentSearchQueries } from '~/hooks/useRecentSearchQueries';
import { SearchResults } from '~/screens/Explore/SearchResults';

import { SEARCH_ICON_INPUT_SIZE, SEARCH_RESULTS_Z_INDEX } from './ZIndexLookup';

// Search preview constants
const SEARCH_PREVIEW_LIMITS = {
  MAX_USERS: 4,
  MAX_MINI_APPS: 4,
  MAX_CHANNELS: 2,
  MAX_TOKENS: 3,
  PREVIEW_USERS: 3,
  PREVIEW_MINI_APPS: 2,
  PREVIEW_CHANNELS: 3,
  PREVIEW_TOKENS: 3,
} as const;

const FLOATING_SEARCH_BOTTOM_SPACING = 16;
const FLOATING_SEARCH_PREVIEW_BOTTOM_SPACING = 16;

type PulseFloatingSearchProps = {
  searchQuery: string | null;
  rawQuery: string;
  debouncedQuery: string;
  searchMode: 'preview' | 'results';
  initialSearchIndex: number | null;
  setSearchMode: (mode: 'preview' | 'results') => void;
  setInitialSearchIndex: (index: number | null) => void;
  setSearchQuery: (query: string | null) => void;
  forceSetQuery: (query: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onChangeText: (text: string) => void;
  searchPlaceholder: string;
  source: 'home' | 'home-stacked' | 'pulse' | 'notifications';
};

function FloatingSearchResults({
  searchQuery,
  rawQuery,
  debouncedQuery,
  searchMode,
  initialSearchIndex,
  setSearchMode,
  setInitialSearchIndex,
  setSearchQuery,
  forceSetQuery,
  onSubmit,
  onClose,
  onChangeText,
  searchPlaceholder,
  source,
}: PulseFloatingSearchProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  const push = usePush();
  const { trackEvent } = useAnalytics();
  const { unfocusInputs } = useUnfocusInputs();

  const {
    recentlySearchedTokens,
    trackRecentlySearchedTokens,
    removeRecentlySearchedToken,
    removeAllRecentlySearchedTokens,
  } = useRecentlySearchedTokens();

  const {
    getRecentlyViewedUsers,
    clearAllRecentlyViewedUsers,
    clearRecentlyViewedUser,
  } = useRecentlyViewedUsers();
  const recentlyViewedUserFids = getRecentlyViewedUsers();

  const {
    getRecentSearchQueries,
    clearAllRecentSearchQueries,
    updateRecentSearchQueries,
    clearRecentSearchQuery,
  } = useRecentSearchQueries();
  const recentSearchQueries = getRecentSearchQueries();

  const opacity = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const [isSearchVisible, setIsSearchVisible] = React.useState(false);

  React.useEffect(() => {
    if (searchQuery === null) {
      setIsSearchVisible(false);
      opacity.set(withTiming(0, { duration: 150 }));
      return;
    }

    setIsSearchVisible(true);
    opacity.set(withTiming(1, { duration: 150 }));
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [opacity, searchQuery]);

  const [isFetching, setIsFetching] = useState(false);

  const [cachedUsers, setCachedUsers] = useState<ApiUser[]>([]);
  const [cachedChannels, setCachedChannels] = useState<ApiChannel[]>([]);
  const [cachedMiniApps, setCachedMiniApps] = useState<ApiFrame[]>([]);
  const [cachedTokens, setCachedTokens] = useState<ApiTokenLink[]>([]);

  useEffect(() => {
    if (searchQuery !== null && debouncedQuery !== '') {
      setIsFetching(true);
    } else if (searchQuery === null) {
      setIsFetching(false);
    }
  }, [debouncedQuery, searchQuery]);

  const { fid: viewerFid } = useCurrentUser_UNSAFE();
  const { data } = useSearchSummary({
    q: debouncedQuery,
    maxChannels: SEARCH_PREVIEW_LIMITS.MAX_CHANNELS,
    maxUsers: SEARCH_PREVIEW_LIMITS.MAX_USERS,
    maxMiniApps: SEARCH_PREVIEW_LIMITS.MAX_MINI_APPS,
    maxTokens: SEARCH_PREVIEW_LIMITS.MAX_TOKENS,
    addFollowersYouKnowContext: false,
    contextFid: viewerFid,
  });

  useEffect(() => {
    if (searchQuery === null) {
      setCachedUsers([]);
      setCachedChannels([]);
      setCachedMiniApps([]);
      setCachedTokens([]);
      return;
    }

    if (debouncedQuery === '') {
      setCachedUsers([]);
      setCachedChannels([]);
      setCachedMiniApps([]);
      setCachedTokens([]);
      setIsFetching(false);
    } else if (data?.result) {
      setIsFetching(false);
      if (data.result.users) {
        setCachedUsers(data.result.users);
      }
      if (data.result.channels) {
        setCachedChannels(data.result.channels);
      }
      if (data.result.miniApps) {
        setCachedMiniApps(data.result.miniApps);
      }
      if (data.result.tokens) {
        setCachedTokens(data.result.tokens);
      }
    }
  }, [data, debouncedQuery, searchQuery]);

  useEffect(() => {
    if (searchMode !== 'results') {
      return;
    }

    const trimmedQuery = rawQuery.trim();
    if (trimmedQuery === '' || isAddress(trimmedQuery)) {
      return;
    }

    // Keep search-history writes independent from typeahead debounce/network timing.
    updateRecentSearchQueries({ q: trimmedQuery });
  }, [rawQuery, searchMode, updateRecentSearchQueries]);

  const onViewAllTokensPress = useCallback(() => {
    trackEvent(AnalyticsEvent.PressFloatingSearchViewAll, {
      section: 'tokens',
      source,
    });

    setInitialSearchIndex(3);
    setSearchMode('results');
  }, [setInitialSearchIndex, setSearchMode, source, trackEvent]);

  const onViewAllUsersPress = useCallback(() => {
    trackEvent(AnalyticsEvent.PressFloatingSearchViewAll, {
      section: 'users',
      source,
    });

    setInitialSearchIndex(2);
    setSearchMode('results');
  }, [setInitialSearchIndex, setSearchMode, source, trackEvent]);

  const onViewAllChannelsPress = useCallback(() => {
    trackEvent(AnalyticsEvent.PressFloatingSearchViewAll, {
      section: 'channels',
      source,
    });

    setInitialSearchIndex(4);
    setSearchMode('results');
  }, [setInitialSearchIndex, setSearchMode, source, trackEvent]);

  const onSelectSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      forceSetQuery(q);
      setInitialSearchIndex(0);
      setSearchMode('results');
    },
    [forceSetQuery, setInitialSearchIndex, setSearchMode, setSearchQuery],
  );

  const resultsBottomPadding = FLOATING_SEARCH_BOTTOM_SPACING;
  const previewPaddingBottom = FLOATING_SEARCH_PREVIEW_BOTTOM_SPACING;

  const searchContent = (
    <>
      {searchQuery !== null && (
        <View
          style={[
            {
              paddingTop: source === 'pulse' ? insets.top + 8 : 8,
              paddingBottom: 8,
              paddingHorizontal: 12,
            },
          ]}
        >
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.border,
              t.borders.secondary,
              {
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 10,
                gap: 8,
              },
            ]}
          >
            <Search
              size={SEARCH_ICON_INPUT_SIZE}
              color={t.colors.text.secondary}
            />
            <TextInput
              ref={inputRef}
              value={rawQuery}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmit}
              placeholder={searchPlaceholder}
              placeholderTextColor={t.colors.text.tertiary}
              style={[
                t.fontNormal,
                {
                  flex: 1,
                  fontSize: 16,
                  color: t.colors.text.primary,
                  outlineWidth: 0,
                },
              ]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedPressable
              onPress={() => {
                if (rawQuery.length > 0) {
                  onChangeText('');
                } else {
                  onClose();
                }
              }}
              style={[t.itemsCenter, t.justifyCenter]}
            >
              <X size={16} color={t.colors.text.tertiary} />
            </AnimatedPressable>
          </View>
        </View>
      )}
      {searchQuery !== null ? (
        searchMode === 'results' && initialSearchIndex !== null ? (
          <Animated.View entering={FadeIn} style={[t.flex1]}>
            <View style={[t.flex1, { paddingBottom: resultsBottomPadding }]}>
              <React.Suspense fallback={<FullScreenLoadingIndicator />}>
                <SearchResults q={rawQuery} initialIndex={initialSearchIndex} />
              </React.Suspense>
            </View>
          </Animated.View>
        ) : (
          <View style={[t.flex, t.flex1, t.flexCol, t.justifyStart]}>
            {rawQuery !== '' ? (
              <ScrollView
                contentContainerStyle={[
                  { paddingBottom: previewPaddingBottom },
                ]}
                style={[t.flexGrow, t.pT4]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {isFetching ? (
                  <>
                    {['Users', 'Mini Apps', 'Tokens', 'Channels'].map(
                      (title) => (
                        <View key={title} style={[{ gap: 8 }, t.pB4]}>
                          <Text2
                            color="tertiary"
                            weight="semibold"
                            style={[t.pX3]}
                          >
                            {title}
                          </Text2>
                          <View>
                            {Array.from({ length: 3 }).map((_, index) => (
                              <TokenListItemPlaceholder
                                key={index}
                                hideValue={true}
                                avatarSize={40}
                              />
                            ))}
                          </View>
                        </View>
                      ),
                    )}
                  </>
                ) : (
                  <>
                    {cachedUsers.length > 0 && (
                      <View style={[t.pB4]}>
                        <View
                          style={[
                            t.flexRow,
                            t.itemsCenter,
                            t.justifyBetween,
                            t.pX3,
                            t.mB2,
                            t.z10,
                          ]}
                        >
                          <Text2 color="tertiary" weight="semibold">
                            Users
                          </Text2>
                          <AnimatedPressable onPress={onViewAllUsersPress}>
                            <Text2 color="brand" weight="semibold" size="sm">
                              View all
                            </Text2>
                          </AnimatedPressable>
                        </View>
                        {cachedUsers
                          .slice(0, SEARCH_PREVIEW_LIMITS.PREVIEW_USERS)
                          .map((user) => (
                            <View key={user.fid}>
                              <UserSearchItem user={user} />
                            </View>
                          ))}
                      </View>
                    )}
                    {cachedMiniApps.length > 0 && (
                      <View style={[t.pB4]}>
                        <View
                          style={[
                            t.flexRow,
                            t.itemsCenter,
                            t.justifyBetween,
                            t.pX3,
                            t.mB2,
                            t.z10,
                          ]}
                        >
                          <Text2 color="tertiary" weight="semibold">
                            Mini Apps
                          </Text2>
                        </View>
                        {cachedMiniApps
                          .slice(0, SEARCH_PREVIEW_LIMITS.PREVIEW_MINI_APPS)
                          .map((miniApp) => (
                            <View key={miniApp.domain}>
                              <MiniAppSearchItem
                                miniApp={miniApp}
                                onComplete={onClose}
                              />
                            </View>
                          ))}
                      </View>
                    )}
                    {cachedTokens.length > 0 && (
                      <View style={[t.pB4]}>
                        <View
                          style={[
                            t.flexRow,
                            t.itemsCenter,
                            t.justifyBetween,
                            t.pX3,
                            t.mB2,
                            t.z10,
                          ]}
                        >
                          <Text2 color="tertiary" weight="semibold">
                            Tokens
                          </Text2>
                          <AnimatedPressable onPress={onViewAllTokensPress}>
                            <Text2 color="brand" weight="semibold" size="sm">
                              View all
                            </Text2>
                          </AnimatedPressable>
                        </View>
                        {cachedTokens
                          .slice(0, SEARCH_PREVIEW_LIMITS.PREVIEW_TOKENS)
                          .map((token) => (
                            <View key={token.ca}>
                              <TokenListItem
                                token={token}
                                onPress={() => {
                                  trackEvent(
                                    AnalyticsEvent.PressFloatingSearchToken,
                                    {
                                      chain: token.chain,
                                      ca: token.ca,
                                      source,
                                    },
                                  );
                                  trackRecentlySearchedTokens([
                                    tokenLinkToMinimalToken(token),
                                  ]);
                                  push('Token', {
                                    chain: token.chain,
                                    ca: token.ca,
                                    via: 'search_query',
                                  });
                                  onClose();
                                }}
                                variant="search"
                              />
                            </View>
                          ))}
                      </View>
                    )}
                    {cachedChannels.length > 0 && (
                      <View style={[t.pB4]}>
                        <View
                          style={[
                            t.flexRow,
                            t.itemsCenter,
                            t.justifyBetween,
                            t.pX3,
                            t.mB2,
                            t.z10,
                          ]}
                        >
                          <Text2 color="tertiary" weight="semibold">
                            Channels
                          </Text2>
                          <AnimatedPressable onPress={onViewAllChannelsPress}>
                            <Text2 color="brand" weight="semibold" size="sm">
                              View all
                            </Text2>
                          </AnimatedPressable>
                        </View>
                        {cachedChannels
                          .slice(0, SEARCH_PREVIEW_LIMITS.PREVIEW_CHANNELS)
                          .map((channel) => (
                            <View key={channel.key}>
                              <ChannelSearchItem channel={channel} />
                            </View>
                          ))}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            ) : (
              <Animated.View entering={FadeIn} style={[t.flex1]}>
                <SuggestedSearches
                  onClearAllPress={() => {
                    clearAllRecentSearchQueries();
                    clearAllRecentlyViewedUsers();
                    removeAllRecentlySearchedTokens();
                  }}
                  recentlyViewedUserFids={recentlyViewedUserFids}
                  recentSearchQueries={recentSearchQueries}
                  recentlySearchedTokens={recentlySearchedTokens}
                  onSearchPress={(q) => {
                    onSelectSearch(q);
                    onSubmit();
                  }}
                  onUserCloseButtonPress={({ fid }) => {
                    clearRecentlyViewedUser({ fid });
                  }}
                  onSearchCloseButtonPress={({ q }) => {
                    clearRecentSearchQuery({ q });
                  }}
                  onTokenCloseButtonPress={({ id }) => {
                    removeRecentlySearchedToken(id);
                  }}
                  onTouchStart={unfocusInputs}
                  bottomPadding={resultsBottomPadding}
                />
              </Animated.View>
            )}
          </View>
        )
      ) : null}
    </>
  );

  return (
    <Animated.View
      pointerEvents={isSearchVisible ? 'auto' : 'none'}
      style={[
        t.absolute,
        t.top0,
        t.left0,
        t.right0,
        t.bottom0,
        t.flex1,
        t.bgDefault,
        {
          zIndex: SEARCH_RESULTS_Z_INDEX,
        },
        opacityStyle,
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[t.flex1]}
        keyboardVerticalOffset={0}
      >
        {searchContent}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

type SuggestedSearchesProps = {
  recentSearchQueries: string[];
  recentlyViewedUserFids: number[];
  recentlySearchedTokens: RecentlySearchedToken[];
  onClearAllPress: () => void;
  onUserCloseButtonPress: ({ fid }: { fid: number }) => void;
  onSearchCloseButtonPress: ({ q }: { q: string }) => void;
  onTokenCloseButtonPress: ({ id }: { id: string }) => void;
  onSearchPress: (q: string) => void;
  onTouchStart: () => void;
  bottomPadding: number;
};

const SuggestedSearches: React.FC<SuggestedSearchesProps> = React.memo(
  ({
    recentSearchQueries,
    recentlyViewedUserFids,
    recentlySearchedTokens,
    onClearAllPress,
    onSearchPress,
    onSearchCloseButtonPress,
    onUserCloseButtonPress,
    onTokenCloseButtonPress,
    onTouchStart,
    bottomPadding,
  }) => {
    const t = useTheme();
    const recentSearchScrollView = React.useRef<ScrollView>(null);

    if (
      recentSearchQueries.length === 0 &&
      recentlyViewedUserFids.length === 0
    ) {
      return null;
    }
    return (
      <>
        <View
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.pX4,
            t.itemsCenter,
            t.wFull,
            t.pT2,
            t.pB4,
          ]}
        >
          <TypographyBody label="Large/Strong" color={'tertiary'}>
            Recent
          </TypographyBody>
          <TextWithPress
            style={[t.texts.brand, t.textBase]}
            onPress={() => {
              onClearAllPress();
            }}
          >
            Clear all
          </TextWithPress>
        </View>
        <ScrollView
          ref={recentSearchScrollView}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps={'handled'}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
        >
          {recentSearchQueries.map((item, index) => (
            <RecentSearchQuery
              q={item}
              onPress={onSearchPress}
              onTouchStart={onTouchStart}
              onCloseButtonPress={(q) => onSearchCloseButtonPress({ q })}
              topBorder={index === 0}
              key={index}
            />
          ))}
          {recentlyViewedUserFids.map((fid, index) => (
            <RecentUser
              fid={fid}
              onCloseButtonPress={onUserCloseButtonPress}
              onTouchStart={onTouchStart}
              key={index}
            />
          ))}
          {recentlySearchedTokens.map((token, index) => (
            <RecentToken
              id={token.id}
              onCloseButtonPress={onTokenCloseButtonPress}
              onTouchStart={onTouchStart}
              key={index}
            />
          ))}
        </ScrollView>
      </>
    );
  },
);

type RecentUserProps = {
  fid: number;
  onCloseButtonPress: ({ fid }: { fid: number }) => void;
  topBorder?: boolean;
  onTouchStart: () => void;
};

const RecentUser: React.FC<RecentUserProps> = React.memo(
  ({ fid, onCloseButtonPress, topBorder, onTouchStart }) => {
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();
    const [user, setUser] = useState<UserCache | undefined>(undefined);
    const fetchUser = useFetchUserByFid();

    useEffect(() => {
      const fetch = async () => {
        const user = await fetchUser({ fid });
        setUser(user);
      };
      fetch();
    }, [fid, fetchUser]);

    const isProUser = useUserLevel(user?.result?.user) === 'pro';

    return user?.result ? (
      <Pressable
        onPress={() => {
          pushToUserProfile({ fid: user.result.user.fid });
        }}
        onTouchStart={onTouchStart}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.p3,
            t.borderBHairline,
            t.wFull,
            t.justifyBetween,
            t.itemsCenter,
            t.borderDefault,
            topBorder && [t.borderTHairline],
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 12 }]}>
            <Avatar pfpUrl={user.result.user.pfp?.url} diameter={40} />
            <View>
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text2 weight="semibold" numberOfLines={1} ellipsizeMode="tail">
                  {user.result.user.displayName}
                </Text2>
                {isProUser && <FarcasterProBadge size={18} />}
              </View>
              <Text2
                size="sm"
                color="secondary"
                style={[t.flexShrink]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {resolveUsername(user.result.user)}
              </Text2>
            </View>
          </View>
          <AnimatedPressable
            style={[t.itemsCenter, t.justifyCenter]}
            onPress={() => onCloseButtonPress({ fid })}
          >
            <X size={20} style={[t.texts.tertiary, t.p1]} />
          </AnimatedPressable>
        </View>
      </Pressable>
    ) : null;
  },
);

type RecentSearchQueryProps = {
  q: string;
  onPress: (q: string) => void;
  onCloseButtonPress: (q: string) => void;
  topBorder?: boolean;
  onTouchStart: () => void;
};

const RecentSearchQuery: React.FC<RecentSearchQueryProps> = React.memo(
  ({ q, onCloseButtonPress, onPress, onTouchStart, topBorder }) => {
    const t = useTheme();
    return (
      <Pressable onPress={() => onPress(q)} onTouchStart={onTouchStart}>
        <View
          style={[
            t.flex,
            t.flexRow,
            t.p3,
            t.borderBHairline,
            t.wFull,
            t.justifyBetween,
            t.itemsCenter,
            t.borderDefault,
            topBorder && [t.borderTHairline],
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Search size={SEARCH_ICON_INPUT_SIZE} style={[t.texts.primary]} />
            <Text style={[t.textBase, t.texts.primary, t.pL3]}>{q}</Text>
          </View>
          <AnimatedPressable
            style={[t.itemsCenter, t.justifyCenter]}
            onPress={() => onCloseButtonPress(q)}
          >
            <X size={20} style={[t.texts.tertiary, t.p1]} />
          </AnimatedPressable>
        </View>
      </Pressable>
    );
  },
);

type RecentTokenProps = {
  id: string;
  onCloseButtonPress: ({ id }: { id: string }) => void;
  topBorder?: boolean;
  onTouchStart: () => void;
};

const RecentToken: React.FC<RecentTokenProps> = React.memo(
  ({ id, onCloseButtonPress, topBorder, onTouchStart }) => {
    const t = useTheme();
    const push = usePush();
    const { chain, ca } = parseAssetId(id);
    const { data } = useCachedOrQueryToken({
      chain,
      ca,
    });

    const goToToken = useCallback(() => {
      push('Token', { chain, ca, via: 'search_recent' });
    }, [push, chain, ca]);

    return data ? (
      <Pressable onPress={goToToken} onTouchStart={onTouchStart}>
        <View
          style={[
            t.borderBHairline,
            t.borderDefault,
            topBorder && [t.borderTHairline],
          ]}
        >
          <TokenListItem
            token={data}
            onPress={goToToken}
            variant="search"
            right={
              <AnimatedPressable
                style={[t.itemsCenter, t.justifyCenter]}
                onPress={() => onCloseButtonPress({ id })}
              >
                <X size={20} style={[t.texts.tertiary, t.p1]} />
              </AnimatedPressable>
            }
          />
        </View>
      </Pressable>
    ) : null;
  },
);

export { FloatingSearchResults };
