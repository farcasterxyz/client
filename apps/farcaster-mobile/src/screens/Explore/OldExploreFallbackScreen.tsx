import { Ionicons, Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiChannel,
  ApiFrame,
  ApiTokenLink,
  ApiUser,
} from 'farcaster-client-data';
import {
  formatTokenName,
  resolveUsername,
  useDebouncedState,
  useFetchUserByFid,
  useNonSuspenseToken,
  UserCache,
  useSearchSummary,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  FarcasterProBadge,
  FullScreenLoadingIndicator,
  isAddress,
  parseAssetId,
  RecentlySearchedToken,
  TokenIcon,
  tokenLinkToMinimalToken,
  TokenListItem,
  TokenListItemPlaceholder,
  useRecentlySearchedTokens,
  useUnfocusInputs,
  useUserLevel,
} from 'farcaster-expo';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AnimatedSearchPlaceholder } from '~/components/AnimatedSearchPlaceholder';
import { Avatar } from '~/components/Avatar';
import { ChannelSearchItem } from '~/components/channels/ChannelSearchItem';
import { MiniAppSearchItem } from '~/components/miniApps/MiniAppSearchItem';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { Text, Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { UserSearchItem } from '~/components/users/UserSearchItem';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useRecentlyViewedUsers } from '~/hooks/useRecentlyViewedUser';
import { useRecentSearchQueries } from '~/hooks/useRecentSearchQueries';
import { SearchPreview } from '~/screens/Explore/SearchPreview';
import { ExploreStackParamList } from '~/types';

import { SEARCH_PAGER_INDEX } from './searchPagerConstants';
import { SearchResults } from './SearchResults';

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

const OldExploreFallbackScreenName = 'OldExplore';

type OldExploreFallbackScreenProps = NativeStackScreenProps<
  ExploreStackParamList,
  typeof OldExploreFallbackScreenName
>;

const OldExploreFallbackScreen = buildScreen<OldExploreFallbackScreenProps>(
  { name: OldExploreFallbackScreenName, insetTop: true },
  () => <OldExploreFallbackScreenContent />,
);

type ExploreState = 'explore' | 'search' | 'searchResults' | 'tokenResults';

OldExploreFallbackScreen.displayName = 'SearchScreen';

const OldExploreFallbackScreenContent: FC = memo(() => {
  const t = useTheme();
  const push = usePush();

  const [exploreState, setExploreState] = useState<ExploreState>('explore');

  const [debouncedQ, setQ, forceSetQ, rawQ] = useDebouncedState('');
  const [initialSearchIndex, setInitialSearchIndex] = useState<number | null>(
    null,
  );

  const inputRef = useRef<TextInput>(null);

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (debouncedQ !== '') {
      setIsFetching(true);
    }
  }, [debouncedQ]);

  const { fid: viewerFid } = useCurrentUser_UNSAFE();
  const { data } = useSearchSummary({
    q: debouncedQ,
    maxChannels: SEARCH_PREVIEW_LIMITS.MAX_CHANNELS,
    maxUsers: SEARCH_PREVIEW_LIMITS.MAX_USERS,
    maxMiniApps: SEARCH_PREVIEW_LIMITS.MAX_MINI_APPS,
    maxTokens: SEARCH_PREVIEW_LIMITS.MAX_TOKENS,
    addFollowersYouKnowContext: false,
    contextFid: viewerFid,
  });

  const [cachedUsers, setCachedUsers] = useState<ApiUser[]>([]);
  const [cachedChannels, setCachedChannels] = useState<ApiChannel[]>([]);
  const [cachedMiniApps, setCachedMiniApps] = useState<ApiFrame[]>([]);
  const [cachedTokens, setCachedTokens] = useState<ApiTokenLink[]>([]);

  useEffect(() => {
    if (debouncedQ === '') {
      setCachedUsers([]);
      setCachedChannels([]);
      setCachedMiniApps([]);
      setCachedTokens([]);
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
  }, [debouncedQ, data]);

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

  const {
    recentlySearchedTokens,
    trackRecentlySearchedTokens,
    removeRecentlySearchedToken,
    removeAllRecentlySearchedTokens,
  } = useRecentlySearchedTokens();

  const searchPlaceholder = useMemo(() => {
    return <AnimatedSearchPlaceholder />;
  }, []);

  const searchInput = useMemo(
    () => (
      <View style={[t.mX3]}>
        <SearchInput
          onChangeText={(text) => {
            if (text === '') {
              forceSetQ('');
            } else {
              setQ(text);
            }
          }}
          onSubmitEditing={() => {
            if (rawQ.trim() !== '') {
              if (isAddress(rawQ.trim())) {
                setExploreState('tokenResults');
              } else {
                setExploreState('searchResults');
                setInitialSearchIndex(SEARCH_PAGER_INDEX.Top);
              }
            }
          }}
          value={rawQ}
          placeholder={searchPlaceholder}
          ref={inputRef}
          width={'100%'}
          autoCorrect={false}
          align={'left'}
          onFocus={() => {
            if (isAddress(rawQ.trim())) {
              setExploreState('tokenResults');
            } else {
              setExploreState('search');
            }
          }}
          onClose={() => {
            setExploreState('explore');
          }}
          onPaste={(text) => {
            forceSetQ(text);
            if (isAddress(text.trim())) {
              setExploreState('tokenResults');
            } else {
              setExploreState('searchResults');
              setInitialSearchIndex(SEARCH_PAGER_INDEX.Top);
            }
          }}
        />
      </View>
    ),
    [forceSetQ, rawQ, searchPlaceholder, setQ, t.mX3],
  );

  const { unfocusInputs } = useUnfocusInputs();

  // const { topBar } = useTopBar({
  //   title: searchInput,
  // });

  useEffect(() => {
    if (
      (exploreState === 'searchResults' || exploreState === 'tokenResults') &&
      rawQ !== ''
    ) {
      if (!isAddress(rawQ)) {
        updateRecentSearchQueries({ q: rawQ });
      }
    }
  }, [debouncedQ, exploreState, rawQ, updateRecentSearchQueries]);

  const onBackPress = useCallback(() => {
    forceSetQ('');
    inputRef.current?.blur();
    setExploreState('explore');
  }, [forceSetQ, inputRef, setExploreState]);

  const onViewAllTokensPress = useCallback(() => {
    setInitialSearchIndex(SEARCH_PAGER_INDEX.Tokens);
    setExploreState('searchResults');
  }, [setInitialSearchIndex]);

  const onViewAllUsersPress = useCallback(() => {
    setInitialSearchIndex(SEARCH_PAGER_INDEX.Users);
    setExploreState('searchResults');
  }, [setInitialSearchIndex]);

  const onViewAllChannelsPress = useCallback(() => {
    setInitialSearchIndex(SEARCH_PAGER_INDEX.Channels);
    setExploreState('searchResults');
  }, [setInitialSearchIndex]);

  React.useEffect(() => {
    if (exploreState !== 'searchResults') {
      setInitialSearchIndex(null);
    }
  }, [exploreState]);

  const searchScreenBody = React.useMemo(() => {
    return (
      <>
        {exploreState === 'search' && (
          <View style={[t.flex, t.flex1, t.flexCol, t.justifyStart]}>
            {rawQ !== '' ? (
              <ScrollView
                contentContainerStyle={[t.pB26]}
                style={[t.flexGrow, t.pT4]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {isFetching ? (
                  <>
                    {['Users', 'Tokens', 'Mini Apps', 'Channels'].map(
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
                                  trackRecentlySearchedTokens([
                                    tokenLinkToMinimalToken(token),
                                  ]);
                                  push('Token', {
                                    chain: token.chain,
                                    ca: token.ca,
                                    via: 'search_query',
                                  });
                                }}
                              />
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
                                onComplete={onBackPress}
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
                    forceSetQ(q);
                    if (isAddress(q)) {
                      setExploreState('tokenResults');
                    } else {
                      setExploreState('searchResults');
                      setInitialSearchIndex(SEARCH_PAGER_INDEX.Top);
                    }
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
                />
              </Animated.View>
            )}
          </View>
        )}
        {exploreState === 'searchResults' && initialSearchIndex !== null && (
          <Animated.View entering={FadeIn} style={[t.flex1]}>
            <React.Suspense fallback={<FullScreenLoadingIndicator />}>
              <SearchResults
                q={rawQ.trim()}
                initialIndex={initialSearchIndex}
              />
            </React.Suspense>
          </Animated.View>
        )}
        {exploreState === 'explore' && (
          <Animated.View style={[t.flex, t.flexCol, t.hFull]} entering={FadeIn}>
            <SearchPreview />
          </Animated.View>
        )}
      </>
    );
  }, [
    cachedChannels,
    cachedMiniApps,
    cachedTokens,
    cachedUsers,
    clearAllRecentSearchQueries,
    clearAllRecentlyViewedUsers,
    clearRecentSearchQuery,
    clearRecentlyViewedUser,
    exploreState,
    forceSetQ,
    initialSearchIndex,
    isFetching,
    onBackPress,
    onViewAllChannelsPress,
    onViewAllTokensPress,
    onViewAllUsersPress,
    push,
    rawQ,
    recentSearchQueries,
    recentlySearchedTokens,
    recentlyViewedUserFids,
    removeAllRecentlySearchedTokens,
    removeRecentlySearchedToken,
    t.flex,
    t.flex1,
    t.flexCol,
    t.flexGrow,
    t.flexRow,
    t.hFull,
    t.itemsCenter,
    t.justifyBetween,
    t.justifyStart,
    t.mB2,
    t.pB26,
    t.pB4,
    t.pT4,
    t.pX3,
    t.z10,
    trackRecentlySearchedTokens,
    unfocusInputs,
  ]);

  return (
    <View style={[t.hFull, t.bgDefault]}>
      <View style={[t.flex, t.flexRow, t.pT1, t.pB2, t.itemsCenter]}>
        {searchInput}
      </View>
      {searchScreenBody}
    </View>
  );
});

type RecentUserProps = {
  fid: number;
  onCloseButtonPress: ({ fid }: { fid: number }) => void;
  topBorder?: boolean;
  onTouchStart: () => void;
};

const RecentUser: FC<RecentUserProps> = memo(
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
            t.pX4,
            t.borderBHairline,
            t.pY4,
            t.wFull,
            t.justifyBetween,
            t.itemsStart,
            t.borderDefault,
            topBorder && [t.borderTHairline],
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 12 }]}>
            <Avatar pfpUrl={user.result.user.pfp?.url} diameter={45} />
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
          <Ionicons
            name={'close'}
            size={20}
            style={[t.texts.tertiary, t.pT1]}
            onPress={() => onCloseButtonPress({ fid })}
          />
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

const RecentSearchQuery: FC<RecentSearchQueryProps> = memo(
  ({ q, onCloseButtonPress, onPress, onTouchStart, topBorder }) => {
    const t = useTheme();
    return (
      <Pressable onPress={() => onPress(q)} onTouchStart={onTouchStart}>
        <View
          style={[
            t.flex,
            t.flexRow,
            t.pX4,
            t.borderBHairline,
            t.pY4,
            t.wFull,
            t.justifyBetween,
            t.itemsCenter,
            t.borderDefault,
            topBorder && [t.borderTHairline],
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Octicons name={'search'} size={20} style={[t.texts.primary]} />
            <Text style={[t.textBase, t.texts.primary, t.pL3]}>{q}</Text>
          </View>
          <Ionicons
            name={'close'}
            size={20}
            style={[t.texts.tertiary]}
            onPress={() => onCloseButtonPress(q)}
          />
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

const RecentToken: FC<RecentTokenProps> = memo(
  ({ id, onCloseButtonPress, topBorder, onTouchStart }) => {
    const t = useTheme();
    const push = usePush();
    const { chain, ca } = parseAssetId(id);
    const { data } = useNonSuspenseToken({ params: { chain, ca } });

    const goToToken = useCallback(() => {
      push('Token', { chain, ca, via: 'search_recent' });
    }, [push, chain, ca]);

    return data?.token ? (
      <Pressable onPress={goToToken} onTouchStart={onTouchStart}>
        <View
          style={[
            t.flex,
            t.flexRow,
            t.pX4,
            t.borderBHairline,
            t.pY4,
            t.wFull,
            t.justifyBetween,
            t.itemsStart,
            t.borderDefault,
            topBorder && [t.borderTHairline],
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <TokenIcon
              iconUrl={data.token.imageUrl}
              diameter={45}
              chain={data.token.chain}
              chainImageSize={14}
              symbol={data.token.ticker}
              features={data.token.features}
              badgeOffset={{ top: -2, right: -2 }}
            />
            <View style={[t.flexCol, t.flex, t.pL3]}>
              <Text2 weight="medium" numberOfLines={1}>
                {formatTokenName(
                  data.token.name,
                  data.token.ca,
                  data.token.chain,
                )}
              </Text2>
            </View>
          </View>
          <Ionicons
            name={'close'}
            size={20}
            style={[t.texts.tertiary, t.pT1]}
            onPress={() => onCloseButtonPress({ id })}
          />
        </View>
      </Pressable>
    ) : null;
  },
);

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
};

const SuggestedSearches: FC<SuggestedSearchesProps> = memo(
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
  }) => {
    const t = useTheme();
    const recentSearchScrollView = useRef<ScrollView>(null);

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
          <Text style={[t.texts.tertiary, t.textBase, t.fontSemibold]}>
            Recent
          </Text>
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

OldExploreFallbackScreenContent.displayName = 'OldExploreFallbackScreenContent';

export { OldExploreFallbackScreen };
