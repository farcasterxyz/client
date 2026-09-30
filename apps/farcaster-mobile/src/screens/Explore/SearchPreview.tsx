import { FlashList } from '@shopify/flash-list';
import {
  ApiChannel,
  ApiTokenLink,
  ApiTrendingToken,
  ApiTrendingTopic,
  ApiUser,
} from 'farcaster-client-data';
import {
  channelKeyExtractor,
  trendingTopicKeyExtractor,
  useDiscoverChannelsWithRefreshOnMount,
  userKeyExtractor,
  useSuggestedUsers,
  useTrendingTokens,
  useTrendingTopicsWithRefreshOnMount,
} from 'farcaster-client-hooks';
import { AnimatedPressable, TokenListItem } from 'farcaster-expo';
import React, { FC, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ChannelSearchItem } from '~/components/channels/ChannelSearchItem';
import { Text2 } from '~/components/Text';
import { TrendingTopicsListItem } from '~/components/TrendingTopics/TrendingTopics';
import { UserSearchItem } from '~/components/users/UserSearchItem';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type UserItem = ApiUser & { type: 'user' };
type ChannelItem = ApiChannel & { type: 'channel' };
type TrendingTopicsItem = {
  topics: ApiTrendingTopic[];
  type: 'trending-topics';
};
type TrendingTokensItem = {
  tokens: ApiTrendingToken[];
  type: 'trending-tokens';
};
type HeaderItem = {
  type: 'header';
  title: string;
  icon?: React.ReactNode;
  onViewAll?: () => void;
};

type CompositeFollowItem =
  | UserItem
  | ChannelItem
  | TrendingTopicsItem
  | TrendingTokensItem
  | HeaderItem;

const getSearchPreviewItemType = (item: CompositeFollowItem) => item.type;

const keyExtractor = (item: CompositeFollowItem) => {
  if (item.type === 'user') {
    return `user-${userKeyExtractor(item)}`;
  }
  if (item.type === 'channel') {
    return `channel-${channelKeyExtractor(item)}`;
  }
  if (item.type === 'trending-topics') {
    return `trending-topics-${trendingTopicKeyExtractor(item.topics)}`;
  }
  if (item.type === 'header') {
    return `header-${item.title}`;
  }
  return `${item.type}-button`;
};

const SearchPreview: FC = () => {
  const t = useTheme();
  const extraData = useCommonFlatListExtraData();

  const { data: userData } = useSuggestedUsers({
    randomized: false,
  });
  const { data: channelData } = useDiscoverChannelsWithRefreshOnMount();
  const { data: trendingTopicsData } = useTrendingTopicsWithRefreshOnMount();
  const { data: trendingTokensData } = useTrendingTokens();

  const push = usePush();

  const users: UserItem[] = useMemo(() => {
    return (
      userData?.pages
        .flatMap((page) => page.result.users)
        .map((user) => ({ ...user, type: 'user' })) || []
    );
  }, [userData]);

  const channels: ChannelItem[] = useMemo(() => {
    return (
      channelData?.pages
        .flatMap((page) => page.result.channels)
        .map((channel) => ({ ...channel, type: 'channel' })) || []
    );
  }, [channelData]);

  const trendingTopics: TrendingTopicsItem = useMemo(() => {
    return {
      topics: trendingTopicsData.topics,
      type: 'trending-topics',
    };
  }, [trendingTopicsData]);

  const trendingTokens: TrendingTokensItem = useMemo(() => {
    if (!trendingTokensData || trendingTokensData.pages.length === 0) {
      return {
        tokens: [],
        type: 'trending-tokens',
      };
    }

    return {
      tokens: trendingTokensData.pages[0].tokens.slice(0, 3) || [],
      type: 'trending-tokens',
    };
  }, [trendingTokensData]);

  const combinedData: CompositeFollowItem[] = useMemo(() => {
    const data: CompositeFollowItem[] = [];

    if (trendingTopics.topics.length > 0) {
      data.push({
        type: 'header',
        title: 'Trending topics',
        icon: (
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
              d="M10.6667 4.66675H14.6667V8.66675"
              stroke={t.colors.text.tertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M14.6666 4.66675L8.99998 10.3334L5.66665 7.00008L1.33331 11.3334"
              stroke={t.colors.text.tertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      });
      data.push(trendingTopics);
    }

    if (users.length > 0) {
      data.push({
        type: 'header',
        title: 'Suggested users',
        icon: (
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
              d="M12.0834 13.25V12.0833C12.0834 11.4645 11.8375 10.871 11.3999 10.4334C10.9623 9.99583 10.3689 9.75 9.75002 9.75H6.25002C5.63118 9.75 5.03769 9.99583 4.6001 10.4334C4.16252 10.871 3.91669 11.4645 3.91669 12.0833V13.25"
              fill={t.colors.text.tertiary}
            />
            <Path
              d="M12.0834 13.25V12.0833C12.0834 11.4645 11.8375 10.871 11.3999 10.4334C10.9623 9.99583 10.3689 9.75 9.75002 9.75H6.25002C5.63118 9.75 5.03769 9.99583 4.6001 10.4334C4.16252 10.871 3.91669 11.4645 3.91669 12.0833V13.25H12.0834Z"
              stroke={t.colors.text.tertiary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M8.00002 7.41667C9.28869 7.41667 10.3334 6.372 10.3334 5.08333C10.3334 3.79467 9.28869 2.75 8.00002 2.75C6.71136 2.75 5.66669 3.79467 5.66669 5.08333C5.66669 6.372 6.71136 7.41667 8.00002 7.41667Z"
              fill={t.colors.text.tertiary}
              stroke={t.colors.text.tertiary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      });
    }

    data.push(...users.slice(0, 3));

    if (trendingTokens.tokens.length > 0) {
      data.push({
        type: 'header',
        title: 'Trending tokens',
        icon: (
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.99998 14.8541C4.21453 14.8541 1.14581 11.7854 1.14581 7.99992C1.14581 4.21446 4.21453 1.14575 7.99998 1.14575C11.7854 1.14575 14.8541 4.21446 14.8541 7.99992C14.8541 11.7854 11.7854 14.8541 7.99998 14.8541ZM3.47915 7.99992C3.47915 10.4967 5.5032 12.5208 7.99998 12.5208C10.4968 12.5208 12.5208 10.4967 12.5208 7.99992C12.5208 5.50314 10.4968 3.47909 7.99998 3.47909C5.5032 3.47909 3.47915 5.50314 3.47915 7.99992ZM7.99998 13.3958C5.01993 13.3958 2.60415 10.98 2.60415 7.99992C2.60415 5.01987 5.01993 2.60409 7.99998 2.60409C10.98 2.60409 13.3958 5.01987 13.3958 7.99992C13.3958 10.98 10.98 13.3958 7.99998 13.3958ZM5.81248 7.99992C5.81248 9.20803 6.79187 10.1874 7.99998 10.1874C8.2416 10.1874 8.43748 10.3833 8.43748 10.6249C8.43748 10.8665 8.2416 11.0624 7.99998 11.0624C6.3086 11.0624 4.93748 9.69129 4.93748 7.99992C4.93748 7.7583 5.13336 7.56242 5.37498 7.56242C5.6166 7.56242 5.81248 7.7583 5.81248 7.99992ZM7.56248 5.37492C7.56248 5.1333 7.75836 4.93742 7.99998 4.93742C9.69135 4.93742 11.0625 6.30854 11.0625 7.99992C11.0625 8.24154 10.8666 8.43742 10.625 8.43742C10.3834 8.43742 10.1875 8.24154 10.1875 7.99992C10.1875 6.79181 9.20809 5.81242 7.99998 5.81242C7.75836 5.81242 7.56248 5.61654 7.56248 5.37492Z"
              fill={t.colors.text.tertiary}
            />
          </Svg>
        ),
        onViewAll: () => push('TrendingTokens', {}),
      });
      data.push(trendingTokens);
    }

    if (channels.length > 0) {
      data.push({
        type: 'header',
        title: 'Suggested channels',
        icon: (
          <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
              d="M10.0626 7.58765C9.95328 7.69704 9.89185 7.84539 9.89185 8.00007C9.89185 8.15474 9.95328 8.30309 10.0626 8.41248L11.4486 9.79907C11.558 9.90842 11.7064 9.96986 11.8611 9.96986C12.0157 9.96986 12.1641 9.90842 12.2735 9.79907L13.6601 8.41248C13.7694 8.30309 13.8308 8.15474 13.8308 8.00007C13.8308 7.84539 13.7694 7.69704 13.6601 7.58765L12.2735 6.20107C12.1641 6.09171 12.0157 6.03027 11.8611 6.03027C11.7064 6.03027 11.558 6.09171 11.4486 6.20107L10.0626 7.58765Z"
              fill={t.colors.text.tertiary}
              stroke={t.colors.text.tertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M2.33992 7.58765C2.23056 7.69704 2.16913 7.84539 2.16913 8.00007C2.16913 8.15474 2.23056 8.30309 2.33992 8.41248L3.7265 9.79907C3.83589 9.90842 3.98424 9.96986 4.13892 9.96986C4.2936 9.96986 4.44195 9.90842 4.55134 9.79907L5.93792 8.41248C6.04728 8.30309 6.10871 8.15474 6.10871 8.00007C6.10871 7.84539 6.04728 7.69704 5.93792 7.58765L4.55134 6.20107C4.44195 6.09171 4.2936 6.03027 4.13892 6.03027C3.98424 6.03027 3.83589 6.09171 3.7265 6.20107L2.33992 7.58765Z"
              fill={t.colors.text.tertiary}
              stroke={t.colors.text.tertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M6.20099 11.4486C6.14676 11.5028 6.10373 11.5671 6.07437 11.638C6.04502 11.7088 6.02991 11.7847 6.02991 11.8613C6.02991 11.938 6.04502 12.0139 6.07437 12.0847C6.10373 12.1555 6.14676 12.2199 6.20099 12.2741L7.58757 13.6601C7.69697 13.7694 7.84531 13.8308 7.99999 13.8308C8.15467 13.8308 8.30302 13.7694 8.41241 13.6601L9.79899 12.2741C9.85323 12.2199 9.89625 12.1555 9.92561 12.0847C9.95497 12.0139 9.97008 11.938 9.97008 11.8613C9.97008 11.7847 9.95497 11.7088 9.92561 11.638C9.89625 11.5671 9.85323 11.5028 9.79899 11.4486L8.41241 10.0626C8.30302 9.95328 8.15467 9.89185 7.99999 9.89185C7.84531 9.89185 7.69697 9.95328 7.58757 10.0626L6.20099 11.4486Z"
              fill={t.colors.text.tertiary}
              stroke={t.colors.text.tertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M6.201 3.72656C6.09165 3.83596 6.03021 3.9843 6.03021 4.13898C6.03021 4.29366 6.09165 4.44201 6.201 4.5514L7.58759 5.9374C7.69698 6.04676 7.84533 6.10819 8 6.10819C8.15468 6.10819 8.30303 6.04676 8.41242 5.9374L9.799 4.5514C9.90836 4.44201 9.9698 4.29366 9.9698 4.13898C9.9698 3.9843 9.90836 3.83596 9.799 3.72656L8.41242 2.33998C8.30303 2.23062 8.15468 2.16919 8 2.16919C7.84533 2.16919 7.69698 2.23062 7.58759 2.33998L6.201 3.72656Z"
              fill={t.colors.text.tertiary}
              stroke={t.colors.text.tertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      });
    }

    data.push(...channels.slice(0, 3));

    return data;
  }, [
    users,
    channels,
    trendingTopics,
    trendingTokens,
    push,
    t.colors.text.tertiary,
  ]);

  const handleTokenPress = useCallback(
    (token: ApiTokenLink) => {
      push('Token', {
        chain: token.chain,
        ca: token.ca,
        via: 'search_trending',
      });
    },
    [push],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CompositeFollowItem; index: number }) => {
      if (item.type === 'header') {
        return (
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.pX3,
              index > 0 ? t.pT4 : t.pT2,
              t.mB1,
              { gap: 6 },
              t.z10,
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              {item.icon}
              <Text2 size="sm" weight="semibold" color="tertiary">
                {item.title}
              </Text2>
            </View>
            {item.onViewAll && (
              <AnimatedPressable onPress={item.onViewAll}>
                <View>
                  <Text2 color="tertiary" weight="regular" size="sm">
                    Show more
                  </Text2>
                </View>
              </AnimatedPressable>
            )}
          </View>
        );
      }
      if (item.type === 'user') {
        return <UserSearchItem user={item} />;
      }
      if (item.type === 'channel') {
        return <ChannelSearchItem channel={item} />;
      }
      if (item.type === 'trending-topics') {
        return (
          <View>
            {item.topics.map((topic) => (
              <TrendingTopicsListItem key={topic.id} topic={topic} />
            ))}
          </View>
        );
      }
      if (item.type === 'trending-tokens') {
        return (
          <View>
            {item.tokens.map((token) => (
              <TokenListItem
                key={token.token.ca}
                token={token.token}
                onPress={handleTokenPress}
              />
            ))}
          </View>
        );
      }
      return null;
    },
    [t, handleTokenPress],
  );

  return (
    <View style={[t.hFull]}>
      <FlashList
        data={combinedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getSearchPreviewItemType}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={() => (
          <Text2 size="sm" color="tertiary">
            No suggestions available.
          </Text2>
        )}
        extraData={extraData}
        {...STANDARD_FLASHLIST_PERF_PROPS}
      />
    </View>
  );
};

export { SearchPreview };
