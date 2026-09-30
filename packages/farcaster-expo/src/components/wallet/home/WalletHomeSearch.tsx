import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiTokenLink } from 'farcaster-client-data';
import {
  formatTimeAgo,
  useBatchMergeIntoGloballyCachedTokens,
  useNonSuspenseTokenLinks,
  useNonSuspenseTokens,
} from 'farcaster-client-hooks';
import { Search, SearchX, X } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, Text2 } from '../../../components/design-system';
import { useSharedNavigationContext } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCurrentUserFid } from '../../../hooks/useCurrentUser';
import { formatAssetId, tokenLinkToMinimalToken } from '../../../utils';
import {
  TokenListItem,
  TokenListItemPlaceholder,
  useRecentlySearchedTokens,
} from '../../crypto';

export function WalletHomeSearch({
  searchQuery,
  onChangeText,
  onClose,
}: {
  searchQuery: string | null;
  onChangeText?: (text: string) => void;
  onClose?: () => void;
}) {
  const t = useTheme();
  const opacity = useSharedValue(0);
  const inputRef = React.useRef<TextInput>(null);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value === 1 ? 'auto' : 'none',
  }));

  React.useEffect(() => {
    if (searchQuery === null) {
      opacity.set(withTiming(0, { duration: 150 }));
      return;
    }

    opacity.set(withTiming(1, { duration: 150 }));
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, opacity]);

  return (
    <Animated.View
      style={[
        t.absolute,
        t.top0,
        t.left0,
        t.right0,
        t.bottom0,
        t.flex1,
        t.bgDefault,
        opacityStyle,
      ]}
    >
      {searchQuery !== null && onChangeText && (
        <View
          style={[
            {
              paddingTop: 8,
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
            <Search size={18} color={t.colors.text.secondary} />
            <View
              style={{
                backgroundColor: t.colors.background.secondary,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text2 size="sm" color="secondary">
                Tokens
              </Text2>
            </View>
            <TextInput
              ref={inputRef}
              value={searchQuery ?? ''}
              onChangeText={onChangeText}
              placeholder="Search..."
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
                if (searchQuery && searchQuery.length > 0) {
                  onChangeText?.('');
                } else {
                  onClose?.();
                }
              }}
              style={[t.itemsCenter, t.justifyCenter]}
            >
              <X size={18} color={t.colors.text.tertiary} />
            </AnimatedPressable>
          </View>
        </View>
      )}
      {searchQuery !== null ? (
        searchQuery ? (
          <SearchResults searchQuery={searchQuery} />
        ) : (
          <RecentSearches />
        )
      ) : null}
    </Animated.View>
  );
}

function SearchResults({ searchQuery }: { searchQuery: string }) {
  const t = useTheme();
  const { push } = useSharedNavigationContext();
  const insets = useSafeAreaInsets();
  const { trackRecentlySearchedTokens } = useRecentlySearchedTokens();
  const viewerFid = useCurrentUserFid();

  const [previousTokens, setPreviousTokens] = React.useState<
    ApiTokenLink[] | undefined
  >(undefined);

  const trimmedSearchQuery = searchQuery.trim();

  const { data, isPending } = useNonSuspenseTokenLinks({
    ticker: trimmedSearchQuery,
    intent: 'typeahead',
    contextFid: viewerFid,
    enabled: trimmedSearchQuery.length > 0,
  });

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  React.useEffect(() => {
    if (data) {
      setPreviousTokens(data.tokens);

      batchMergeIntoGloballyCachedTokens({
        batchUpdates: data.tokens,
      });
    }
  }, [data, batchMergeIntoGloballyCachedTokens]);

  const tokens = React.useMemo(() => {
    if (!data) {
      return previousTokens;
    }

    return data.tokens;
  }, [data, previousTokens]);

  const handleSelectToken = React.useCallback(
    (token: ApiTokenLink) => {
      trackRecentlySearchedTokens([tokenLinkToMinimalToken(token)]);
      push({
        path: 'Token',
        params: { chain: token.chain, ca: token.ca, via: 'search_query' },
      });
    },
    [push, trackRecentlySearchedTokens],
  );

  const renderItem = React.useCallback<ListRenderItem<ApiTokenLink>>(
    ({ item }) => {
      return (
        <TokenListItem
          token={item}
          onPress={handleSelectToken}
          variant="search"
        />
      );
    },
    [handleSelectToken],
  );

  const ListEmptyComponent = React.useMemo(() => {
    if ((isPending || !tokens) && searchQuery.length > 2) {
      return (
        <View>
          {Array.from({ length: 5 }).map((_, index) => (
            <TokenListItemPlaceholder key={index} hideValue gap={0} size="xs" />
          ))}
        </View>
      );
    }

    return (
      <View style={[t.flexRow, t.itemsCenter, t.justifyStart, t.pL3]}>
        <View
          style={[
            t.border,
            t.roundedFull,
            t.itemsCenter,
            t.p5,
            t.justifyCenter,
            { height: 30, width: 30, borderColor: t.colors.border.primary },
          ]}
        >
          <SearchX color={t.colors.text.secondary} size={20} />
        </View>
        <View style={[t.p3]}>
          <Text2 color="secondary" align="left" weight="semibold">
            {'No results found for "' + searchQuery + '"'}
          </Text2>
          <Text2 color="tertiary" align="left">
            {searchQuery.length < 3
              ? 'Try entering more characters'
              : 'Try searching for another ticker'}
          </Text2>
        </View>
      </View>
    );
  }, [
    isPending,
    searchQuery,
    tokens,
    t.p3,
    t.flexRow,
    t.itemsCenter,
    t.justifyStart,
    t.pL3,
    t.border,
    t.roundedFull,
    t.p5,
    t.justifyCenter,
    t.colors.border.primary,
    t.colors.text.secondary,
  ]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <View style={[t.pX3, t.pT3, t.pB2]}>
        <Text2 color="secondary" size="base" weight="semibold">
          Search Results
        </Text2>
      </View>
    );
  }, [t.pX3, t.pT3, t.pB2]);

  return (
    <FlashList
      data={tokens}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ paddingBottom: insets.bottom + 330 }}
      keyboardShouldPersistTaps="always"
    />
  );
}

function RecentSearches() {
  const t = useTheme();
  const { recentlySearchedTokens } = useRecentlySearchedTokens();
  const { push } = useSharedNavigationContext();
  const { data } = useNonSuspenseTokens({
    ids: recentlySearchedTokens.map((token) => token.id),
  });

  const tokens = React.useMemo(() => {
    const sorted = recentlySearchedTokens.sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    const tokens = [];
    for (const { id, timestamp } of sorted) {
      const token = data?.find(
        (t) => formatAssetId(t.chain, t.ca, true) === id,
      );
      if (!token) {
        continue;
      }

      tokens.push({
        ...token,
        timestamp,
      });
    }

    return tokens;
  }, [recentlySearchedTokens, data]);

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  React.useEffect(() => {
    if (tokens) {
      batchMergeIntoGloballyCachedTokens({
        batchUpdates: tokens,
      });
    }
  }, [tokens, batchMergeIntoGloballyCachedTokens]);

  const handleSelectToken = React.useCallback(
    (token: ApiTokenLink) => {
      push({
        path: 'Token',
        params: { chain: token.chain, ca: token.ca, via: 'search_query' },
      });
    },
    [push],
  );

  if (recentlySearchedTokens.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={SlideInUp.duration(150)}>
      <View style={[t.pX3, t.pT3]}>
        <Text2 color="secondary" size="base" weight="semibold">
          Recent Searches
        </Text2>
      </View>
      {tokens.length > 0 && (
        <View>
          {tokens.map((token) => (
            <TokenListItem
              key={formatAssetId(token.chain, token.ca)}
              token={token}
              subtitle={`Searched ${formatTimeAgo(token.timestamp)} ago`}
              onPress={handleSelectToken}
              variant="search"
            />
          ))}
        </View>
      )}
      {tokens.length === 0 && (
        <View>
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <TokenListItemPlaceholder key={index} hideValue gap={0} size="xs" />
          ))}
        </View>
      )}
    </Animated.View>
  );
}
