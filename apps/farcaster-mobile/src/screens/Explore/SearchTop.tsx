import { FlashList } from '@shopify/flash-list';
import { ApiCast, ApiFrame, ApiTokenLink } from 'farcaster-client-data';
import {
  useFlatSearchCastsData,
  useFlatSearchUsersData,
  useSearchCasts,
  useSearchMiniApps,
  useSearchUsers,
  useTokenLinks,
} from 'farcaster-client-hooks';
import { AnimatedPressable, TokenListItem } from 'farcaster-expo';
import React, { FC, Suspense } from 'react';
import { View } from 'react-native';

import { AppListItem } from '~/components/Apps/AppListItem';
import { Cast } from '~/components/casts/Cast';
import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text2 } from '~/components/Text';
import { UserSearchItem } from '~/components/users/UserSearchItem';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { SearchTabProps } from '~/screens/Explore/ExploreScreen';
import { extractCastKey } from '~/utils/CastUtils';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const SearchTop: FC<
  SearchTabProps & {
    onViewTokens: () => void;
    onViewUsers: () => void;
    onViewCasts: () => void;
    onViewMiniApps: () => void;
  }
> = ({
  q,
  onViewTokens,
  onViewUsers,
  onViewCasts,
  onViewMiniApps,
  enabled,
}) => {
  const t = useTheme();
  const topQ = q ? `${q.startsWith('$') ? `ticker:${q.slice(1)}` : q}` : '';
  const { data: castData, onEndReached } = useSearchCasts({
    q: topQ,
    limit: 10,
  });
  const casts = useFlatSearchCastsData({ data: castData });
  const { data: userData } = useSearchUsers({ q, limit: 5 });
  const users = useFlatSearchUsersData({ data: userData });
  const push = usePush();
  const { fid: viewerFid } = useCurrentUser_UNSAFE();

  const { data: tokenData } = useTokenLinks({
    ticker: q,
    intent: 'typeahead',
    contextFid: viewerFid,
  });
  const { flatData: miniApps } = useSearchMiniApps({
    query: enabled ? q : '',
    limit: 3,
  });

  const renderCast = React.useCallback(({ item }: { item: ApiCast }) => {
    return <Cast cast={item} />;
  }, []);

  const onViewTokenPress = React.useCallback(
    (token: ApiTokenLink) => {
      push('Token', {
        chain: token.chain,
        ca: token.ca,
        via: 'search_query',
      });
    },
    [push],
  );

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <View>
        {users && users.length > 0 && (
          <View style={[t.pB3]}>
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.pX3,
                t.pT3,
                t.pB1,
                { gap: 6 },
              ]}
            >
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text2 size="base" weight="semibold" color="tertiary">
                  Users
                </Text2>
              </View>
              <AnimatedPressable onPress={onViewUsers}>
                <Text2 color="brand" weight="semibold" size="sm">
                  View all
                </Text2>
              </AnimatedPressable>
            </View>
            {users.slice(0, 3).map((user) => (
              <View key={user.fid}>
                <UserSearchItem user={user} />
              </View>
            ))}
          </View>
        )}
        {tokenData?.tokens.length > 0 && (
          <View style={[t.pB3]}>
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.pX3,
                t.pT3,
                t.pB1,
                { gap: 6 },
              ]}
            >
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text2 size="base" weight="semibold" color="tertiary">
                  Tokens
                </Text2>
              </View>
              <AnimatedPressable onPress={onViewTokens}>
                <Text2 color="brand" weight="semibold" size="sm">
                  View all
                </Text2>
              </AnimatedPressable>
            </View>
            {tokenData.tokens.slice(0, 3).map((token) => (
              <TokenListItem
                key={token.ca}
                token={token}
                onPress={onViewTokenPress}
              />
            ))}
          </View>
        )}
        {miniApps && miniApps.length > 0 && (
          <View style={[t.pB3]}>
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.pX3,
                t.pT3,
                t.pB1,
                { gap: 6 },
              ]}
            >
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text2 size="base" weight="semibold" color="tertiary">
                  Mini Apps
                </Text2>
              </View>
              <AnimatedPressable onPress={onViewMiniApps}>
                <Text2 color="brand" weight="semibold" size="sm">
                  View all
                </Text2>
              </AnimatedPressable>
            </View>
            {miniApps.slice(0, 3).map((frame: ApiFrame) => (
              <View key={frame.domain} style={[t.pX3, t.pY2]}>
                <AppListItem frame={frame} />
              </View>
            ))}
          </View>
        )}
        <View
          style={[
            t.pX3,
            t.pT3,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 6 },
          ]}
        >
          <Text2 size="base" weight="semibold" color="tertiary">
            Casts
          </Text2>
          <AnimatedPressable onPress={onViewCasts}>
            <Text2 color="brand" weight="semibold" size="sm">
              View all
            </Text2>
          </AnimatedPressable>
        </View>
      </View>
    );
  }, [
    users,
    tokenData,
    miniApps,
    onViewUsers,
    onViewTokens,
    onViewCasts,
    onViewMiniApps,
    onViewTokenPress,
    t,
  ]);

  if (!casts || !enabled) {
    return (
      <View style={[t.hFull, t.mT12]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (casts.length === 0) {
    return (
      <View style={[t.flexGrow]}>
        <Empty message={'No results match your query.'} />
      </View>
    );
  }

  return (
    <Suspense fallback={<FullScreenLoadingIndicator debugName="SearchTop" />}>
      <FlashList
        data={casts.slice(0, 10)}
        renderItem={renderCast}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ListHeaderComponent}
        {...STANDARD_FLASHLIST_PERF_PROPS}
      />
    </Suspense>
  );
};

const WrappedSearchTop: FC<
  SearchTabProps & {
    onViewTokens: () => void;
    onViewUsers: () => void;
    onViewCasts: () => void;
    onViewMiniApps: () => void;
  }
> = React.memo(
  ({ q, onViewTokens, onViewUsers, onViewCasts, onViewMiniApps, enabled }) => {
    return (
      <React.Suspense fallback={<FullScreenLoadingIndicator />}>
        <SearchTop
          q={q}
          onViewTokens={onViewTokens}
          onViewUsers={onViewUsers}
          onViewCasts={onViewCasts}
          onViewMiniApps={onViewMiniApps}
          enabled={enabled}
        />
      </React.Suspense>
    );
  },
);

SearchTop.displayName = 'SearchTop';

export { WrappedSearchTop as SearchTop };
