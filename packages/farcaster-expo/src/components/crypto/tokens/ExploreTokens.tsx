import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainDisplayName,
  ApiEthFungibleTokenPosition,
  ApiOnchainTokenMinimal,
  ApiTokenLink,
  isUsdc,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  useDebouncedValue,
  useNonSuspenseTokenLinks,
  useNonSuspenseTokens,
  useTrendingTokens,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  useEmbeddedWallet,
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import {
  useCurrentUserFid,
  useHaptics,
  useOptionalSafeAreaInsets,
  useWalletBalances,
} from '../../../hooks';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  formatAssetId,
  isAddress,
  isNativeAsset,
  isSameAsset,
  parseAssetId,
  SOLANA_NATIVE_ASSET_ADDRESS,
  tokenPositionSupportsLimitOrder,
  tokenPositionSupportsLimitOrderQuote,
  tokenPositionToMinimalToken,
  tokenPositionToTokenLink,
  tokenSupportsLimitOrder,
  tokenSupportsLimitOrderQuote,
  USDC_ADDRESSES,
} from '../../../utils';
import { AnimatedPressable, SearchInput, Text2 } from '../../design-system';
import { WalletScreenHeader } from '../../wallet/WalletScreenHeader';
import { useOptionalSwapTokens } from './swap';
import { SwapTokensSelectNoTokensFound } from './swap/SwapTokensSelectNoTokensFound';
import { SwapTokensSelectTokenChainSheet } from './swap/SwapTokensSelectTokenChainSheet';
import { useRecentlySearchedTokens } from './swap/useRecentlySearchedTokens';
import { useRecentlySwappedTokens } from './swap/useRecentlySwappedTokens';
import { TokenListItem, TokenListItemPlaceholder } from './TokenListItem';
import { TrendingTokens } from './TrendingTokens';

export type ExploreTokensVia =
  | 'explore_trending'
  | 'explore_common'
  | 'explore_balance'
  | 'explore_recent_search'
  | 'explore_recent_swap'
  | 'explore_search_query'
  | 'explore_search_ca';

type TabOption = 'for-you' | 'your-tokens' | 'trending' | ApiChain;

const isTabChain = (tab: TabOption): boolean => {
  return tab !== 'for-you' && tab !== 'your-tokens' && tab !== 'trending';
};

export function ExploreTokens({
  onSelectToken,
  selectedToken,
  prefilledQuery,
  variant = 'default',
  hideHeader = false,
  limitOrdersOnly = false,
  limitOrderQuoteOnly = false,
}: {
  onSelectToken: (token: ApiTokenLink, via: ExploreTokensVia) => void;
  selectedToken?: ApiTokenLink;
  prefilledQuery?: string;
  variant?: 'default' | 'explore';
  hideHeader?: boolean;
  limitOrdersOnly?: boolean;
  limitOrderQuoteOnly?: boolean;
}) {
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  const [tab, setTab] = useState<TabOption>('for-you');
  const [isSearching, setIsSearching] = useState(false);
  const { trackEvent } = useSharedTelemetry();
  const swapTokensContext = useOptionalSwapTokens();
  const isBuyExperience = swapTokensContext?.isBuyExperience ?? false;
  const excludeUsdc = isBuyExperience || limitOrdersOnly;

  const [query, setQuery] = React.useState('');

  const onClose = useCallback(() => {
    setIsSearching(false);
    if (isTabChain(tab)) {
      setTab('for-you');
    }
  }, [tab]);

  const onPaste = useCallback((text: string) => {
    if (!text) {
      return;
    }
    setQuery(text);
    setIsSearching(true);
    setTab('for-you');
  }, []);

  React.useEffect(() => {
    if (
      query === '' &&
      typeof prefilledQuery !== 'undefined' &&
      query !== prefilledQuery
    ) {
      onPaste(prefilledQuery);
    }
  }, [onPaste, prefilledQuery, query]);

  const handleSetTab = useCallback(
    (tab: TabOption) => {
      setTab(tab);
      if (variant === 'explore') {
        trackEvent(AnalyticsEvent.ViewWalletExploreTab, {
          tab,
        });
      }
    },
    [variant, trackEvent],
  );

  const handleSelectTrendingToken = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_trending');
    },
    [onSelectToken],
  );

  const handleSelectYourToken = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_balance');
    },
    [onSelectToken],
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={[t.flex1, t.bgDefault]}>
      {!hideHeader && (
        <WalletScreenHeader
          title={
            limitOrdersOnly || limitOrderQuoteOnly
              ? 'Choose token'
              : variant === 'explore'
                ? 'Explore'
                : 'Buy'
          }
          onBackCallback={goBack}
        />
      )}
      <View style={[t.pX3]}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for tokens or CA"
          width="100%"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            t.backgrounds.secondary,
            t.borderHairline,
            t.borders.primary,
            { borderRadius: 12 },
          ]}
          placeholderStyle={[t.fontNormal, t.texts.secondary]}
          onPaste={onPaste}
          pasteColor={t.colors.text.secondary}
          onFocus={() => setIsSearching(true)}
          onClose={onClose}
        />
      </View>
      <View style={[t.pY3]}>
        <Tabs
          isSearching={isSearching}
          selectedTab={tab}
          onSelectTab={handleSetTab}
          query={query}
        />
      </View>
      {tab === 'for-you' && query.length === 0 && (
        <Animated.View entering={FadeIn} style={[t.flex1]}>
          <ForYou
            onSelectToken={onSelectToken}
            variant={variant}
            limitOrdersOnly={limitOrdersOnly}
            limitOrderQuoteOnly={limitOrderQuoteOnly}
            selectedToken={selectedToken}
          />
        </Animated.View>
      )}
      {tab === 'your-tokens' && (
        <Animated.View entering={FadeIn} style={[t.flex1]}>
          <YourTokens
            query={query}
            onSelectToken={handleSelectYourToken}
            selectedToken={selectedToken}
            limitOrdersOnly={limitOrdersOnly}
            limitOrderQuoteOnly={limitOrderQuoteOnly}
          />
        </Animated.View>
      )}
      {tab === 'trending' && (
        <Animated.View entering={FadeIn} style={[t.flex1]}>
          <TrendingTokens
            enabled
            query={query}
            onPress={handleSelectTrendingToken}
            tokenFilter={
              limitOrderQuoteOnly
                ? (token) => {
                    if (excludeUsdc && isUsdc(token.ca)) {
                      return false;
                    }
                    return tokenSupportsLimitOrderQuote(token, selectedToken);
                  }
                : limitOrdersOnly
                  ? (token) => {
                      if (excludeUsdc && isUsdc(token.ca)) {
                        return false;
                      }
                      return tokenSupportsLimitOrder(token);
                    }
                  : excludeUsdc
                    ? (token) => !isUsdc(token.ca)
                    : undefined
            }
          />
        </Animated.View>
      )}
      {isSearching &&
        (query.length > 0 || tab !== 'for-you') &&
        tab !== 'your-tokens' &&
        tab !== 'trending' && (
          <Animated.View entering={FadeIn} style={[t.flex1]}>
            <SearchResults
              query={query}
              tab={tab}
              intent={
                typeof prefilledQuery !== 'undefined' &&
                query === prefilledQuery
                  ? 'submit'
                  : 'typeahead'
              }
              onSelectToken={onSelectToken}
              selectedToken={selectedToken}
              limitOrdersOnly={limitOrdersOnly}
              limitOrderQuoteOnly={limitOrderQuoteOnly}
            />
          </Animated.View>
        )}
    </KeyboardAvoidingView>
  );
}

function ForYou({
  onSelectToken,
  variant,
  limitOrdersOnly = false,
  limitOrderQuoteOnly = false,
  selectedToken,
}: {
  onSelectToken: (token: ApiTokenLink, via: ExploreTokensVia) => void;
  variant: 'default' | 'explore';
  limitOrdersOnly?: boolean;
  limitOrderQuoteOnly?: boolean;
  selectedToken?: ApiTokenLink;
}) {
  const t = useTheme();
  const { recentlySwappedTokens } = useRecentlySwappedTokens();
  const { recentlySearchedTokens } = useRecentlySearchedTokens();
  const [tokenForChainSelector, setTokenForChainSelector] =
    useState<ApiTokenLink | null>(null);
  const { data: trendingTokens } = useTrendingTokens();
  const insets = useOptionalSafeAreaInsets();
  const { balances } = useWalletBalances();
  const swapTokensContext = useOptionalSwapTokens();
  const isBuyExperience = swapTokensContext?.isBuyExperience ?? false;
  const excludeUsdc = isBuyExperience || limitOrdersOnly;

  const forYouTrendingTokens = useMemo(() => {
    if (!trendingTokens?.pages[0]?.tokens) {
      return [];
    }
    return trendingTokens.pages[0].tokens
      .filter((token) => {
        if (excludeUsdc && isUsdc(token.token.ca)) {
          return false;
        }
        if (limitOrderQuoteOnly) {
          return tokenSupportsLimitOrderQuote(token.token, selectedToken);
        }
        if (limitOrdersOnly) {
          return tokenSupportsLimitOrder(token.token);
        }
        return true;
      })
      .slice(0, 3);
  }, [
    limitOrderQuoteOnly,
    limitOrdersOnly,
    selectedToken,
    trendingTokens,
    excludeUsdc,
  ]);

  const usdcId = formatAssetId('base', USDC_ADDRESSES.base!, true);
  const ethId = formatAssetId('base', EIP7528_NATIVE_ASSET_ADDRESS, true);
  const solanaId = formatAssetId('solana', SOLANA_NATIVE_ASSET_ADDRESS, true);
  const polygonId = formatAssetId(
    'polygon',
    EIP7528_NATIVE_ASSET_ADDRESS,
    true,
  );

  const recentTokens = useMemo(() => {
    return [
      ...recentlySwappedTokens.map((t) => ({
        ...t,
        type: 'swapped',
      })),
      ...recentlySearchedTokens.map((t) => ({
        ...t,
        type: 'searched',
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
      .filter((t) => !(excludeUsdc && isUsdc(parseAssetId(t.id).ca)))
      .slice(0, 5);
  }, [recentlySearchedTokens, recentlySwappedTokens, excludeUsdc]);

  const ids = useMemo(() => {
    return [
      ...(excludeUsdc ? [] : [usdcId]),
      ethId,
      solanaId,
      polygonId,
      ...recentTokens.map((t) => t.id),
    ];
  }, [ethId, recentTokens, solanaId, usdcId, polygonId, excludeUsdc]);

  const { data: tokens, isFetching } = useNonSuspenseTokens({ ids });

  // Cache balance lookups for the three specific token IDs in a single pass
  const cachedBalances = useMemo(() => {
    const cache = new Map<
      string,
      { ownedAmount?: number; ownedValue?: number }
    >();

    // Initialize cache with default values for our three target tokens
    cache.set(usdcId, { ownedAmount: undefined, ownedValue: undefined });
    cache.set(ethId, { ownedAmount: undefined, ownedValue: undefined });
    cache.set(solanaId, { ownedAmount: undefined, ownedValue: undefined });
    cache.set(polygonId, { ownedAmount: undefined, ownedValue: undefined });

    if (!tokens) {
      return cache;
    }

    // Single pass through balances to find our three tokens
    for (const balance of balances) {
      const balanceAsset = tokenPositionToMinimalToken(balance);

      // Check against each of our three target tokens
      for (const token of tokens) {
        const tokenId = formatAssetId(token.chain, token.ca, true);
        if (
          (tokenId === usdcId || tokenId === ethId || tokenId === solanaId) &&
          isSameAsset({
            chain: token.chain,
            ca: token.ca,
            asset: balanceAsset,
          })
        ) {
          cache.set(tokenId, {
            ownedAmount: balance.quantity.float,
            ownedValue: balance.value,
          });
        }
      }
    }

    return cache;
  }, [balances, tokens, usdcId, ethId, solanaId, polygonId]);

  // Helper to get cached balance data
  const getTokenBalanceById = useCallback(
    (id: string) => {
      return (
        cachedBalances.get(id) ?? {
          ownedAmount: undefined,
          ownedValue: undefined,
        }
      );
    },
    [cachedBalances],
  );

  const handleSelectCommonToken = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_common');
    },
    [onSelectToken],
  );

  const handleSelectRecentSearchToken = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_recent_search');
    },
    [onSelectToken],
  );

  const handleSelectRecentSwapToken = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_recent_swap');
    },
    [onSelectToken],
  );

  const handleSelectTrendingToken = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_trending');
    },
    [onSelectToken],
  );

  return (
    <ScrollView
      contentContainerStyle={[{ paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      {variant !== 'explore' && (
        <>
          {!excludeUsdc && (
            <ForYouToken
              id={usdcId}
              tokens={tokens}
              onSelectToken={setTokenForChainSelector}
              isFetching={isFetching}
              hideChain
              variant="balance"
              limitOrdersOnly={limitOrdersOnly}
              limitOrderQuoteOnly={limitOrderQuoteOnly}
              selectedToken={selectedToken}
              {...getTokenBalanceById(usdcId)}
            />
          )}
          <ForYouToken
            id={ethId}
            tokens={tokens}
            onSelectToken={setTokenForChainSelector}
            isFetching={isFetching}
            hideChain
            variant="balance"
            limitOrdersOnly={limitOrdersOnly}
            limitOrderQuoteOnly={limitOrderQuoteOnly}
            selectedToken={selectedToken}
            {...getTokenBalanceById(ethId)}
          />
          <ForYouToken
            id={solanaId}
            tokens={tokens}
            onSelectToken={handleSelectCommonToken}
            isFetching={isFetching}
            hideChain
            variant="balance"
            limitOrdersOnly={limitOrdersOnly}
            limitOrderQuoteOnly={limitOrderQuoteOnly}
            selectedToken={selectedToken}
            {...getTokenBalanceById(solanaId)}
          />
          <ForYouToken
            id={polygonId}
            tokens={tokens}
            onSelectToken={handleSelectCommonToken}
            isFetching={isFetching}
            hideChain
            variant="balance"
            limitOrdersOnly={limitOrdersOnly}
            limitOrderQuoteOnly={limitOrderQuoteOnly}
            selectedToken={selectedToken}
            {...getTokenBalanceById(polygonId)}
          />
        </>
      )}
      {recentTokens.length > 0 && (!isFetching || variant === 'explore') && (
        <>
          <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2, { gap: 4 }]}>
            <Svg width="15" height="16" viewBox="0 0 15 16" fill="none">
              <Path
                d="M7.5 1C11.366 1 14.5 4.13401 14.5 8C14.5 11.866 11.366 15 7.5 15C3.63401 15 0.5 11.866 0.5 8C0.5 4.13401 3.63401 1 7.5 1ZM7.5 3.5C7.08579 3.5 6.75 3.83579 6.75 4.25V8C6.75 8.28408 6.91095 8.54385 7.16504 8.6709L9.66504 9.9209C10.0354 10.1058 10.4857 9.95531 10.6709 9.58496C10.8558 9.21455 10.7053 8.76428 10.335 8.5791L8.25 7.53613V4.25C8.25 3.83579 7.91421 3.5 7.5 3.5Z"
                fill="#0094FF"
              />
            </Svg>
            <Text2 weight="semibold" size="sm" color="secondary">
              Recent
            </Text2>
          </View>
          {recentTokens.map((token) => (
            <ForYouToken
              key={token.id}
              id={token.id}
              tokens={tokens}
              onSelectToken={
                token.type === 'swapped'
                  ? handleSelectRecentSwapToken
                  : handleSelectRecentSearchToken
              }
              isFetching={isFetching}
              variant="default"
              limitOrdersOnly={limitOrdersOnly}
              limitOrderQuoteOnly={limitOrderQuoteOnly}
              selectedToken={selectedToken}
              subtitle={
                token.type === 'swapped'
                  ? `Swapped ${formatTimeAgo(token.timestamp)} ago`
                  : `Searched ${formatTimeAgo(token.timestamp)} ago`
              }
            />
          ))}
        </>
      )}
      {forYouTrendingTokens.length > 0 && !isFetching && (
        <>
          <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2, { gap: 4 }]}>
            <Svg width="15" height="16" viewBox="0 0 15 16" fill="none">
              <Path
                d="M5.3125 9.5625C5.7269 9.5625 6.12433 9.39788 6.41735 9.10485C6.71038 8.81183 6.875 8.4144 6.875 8C6.875 7.1375 6.5625 6.75 6.25 6.125C5.58 4.78562 6.11 3.59125 7.5 2.375C7.8125 3.9375 8.75 5.4375 10 6.4375C11.25 7.4375 11.875 8.625 11.875 9.875C11.875 10.4495 11.7618 11.0184 11.542 11.5492C11.3221 12.08 10.9998 12.5623 10.5936 12.9686C10.1873 13.3748 9.70504 13.6971 9.17424 13.917C8.64344 14.1368 8.07453 14.25 7.5 14.25C6.92547 14.25 6.35656 14.1368 5.82576 13.917C5.29496 13.6971 4.81266 13.3748 4.40641 12.9686C4.00015 12.5623 3.67789 12.08 3.45803 11.5492C3.23816 11.0184 3.125 10.4495 3.125 9.875C3.125 9.15438 3.39563 8.44125 3.75 8C3.75 8.4144 3.91462 8.81183 4.20765 9.10485C4.50067 9.39788 4.8981 9.5625 5.3125 9.5625Z"
                fill="#F24822"
                stroke="#F24822"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>

            <Text2 weight="semibold" size="sm" color="secondary">
              Trending
            </Text2>
          </View>
          {forYouTrendingTokens.map((token) => {
            return (
              <TokenListItem
                key={`${token.chain}:${token.ca}`}
                token={token.token}
                onPress={handleSelectTrendingToken}
                variant="default"
              />
            );
          })}
        </>
      )}
      {tokenForChainSelector && (
        <SwapTokensSelectTokenChainSheet
          token={tokenForChainSelector}
          onDismiss={() => setTokenForChainSelector(null)}
          onSelectToken={handleSelectCommonToken}
        />
      )}
    </ScrollView>
  );
}

function ForYouToken({
  id,
  tokens,
  onSelectToken,
  isFetching,
  hideChain = false,
  variant,
  subtitle,
  ownedAmount,
  ownedValue,
  limitOrdersOnly = false,
  limitOrderQuoteOnly = false,
  selectedToken,
}: {
  id: string;
  tokens?: ApiTokenLink[];
  onSelectToken: (token: ApiTokenLink) => void;
  isFetching: boolean;
  hideChain?: boolean;
  variant: 'balance' | 'default';
  subtitle?: string;
  ownedAmount?: number;
  ownedValue?: number;
  limitOrdersOnly?: boolean;
  limitOrderQuoteOnly?: boolean;
  selectedToken?: ApiTokenLink;
}) {
  const token = tokens?.find((t) => formatAssetId(t.chain, t.ca, true) === id);

  const handlePress = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token);
    },
    [onSelectToken],
  );

  if (isFetching) {
    return <TokenListItemPlaceholder hideValue />;
  }

  if (!token) {
    return null;
  }

  if (token.walletContext?.hidden) {
    return null;
  }

  if (
    limitOrderQuoteOnly &&
    !tokenSupportsLimitOrderQuote(token, selectedToken)
  ) {
    return null;
  }

  if (limitOrdersOnly && !tokenSupportsLimitOrder(token)) {
    return null;
  }

  return (
    <TokenListItem
      token={token}
      onPress={handlePress}
      variant={variant}
      hideChain={hideChain}
      subtitle={subtitle}
      hidePriceChange={variant === 'balance'}
      ownedAmount={ownedAmount}
      ownedValue={ownedValue}
    />
  );
}

function YourTokens({
  query,
  onSelectToken,
  selectedToken,
  limitOrdersOnly = false,
  limitOrderQuoteOnly = false,
}: {
  query: string;
  onSelectToken: (token: ApiTokenLink) => void;
  selectedToken?: ApiTokenLink;
  limitOrdersOnly?: boolean;
  limitOrderQuoteOnly?: boolean;
}) {
  const insets = useOptionalSafeAreaInsets();
  const { balances } = useWalletBalances();
  const { evmAddress } = useEmbeddedWallet();
  const swapTokensContext = useOptionalSwapTokens();
  const isBuyExperience = swapTokensContext?.isBuyExperience ?? false;
  const excludeUsdc = isBuyExperience || limitOrdersOnly;

  const filteredPositions = useMemo(() => {
    let filtered = balances;
    if (selectedToken) {
      filtered = balances.filter((p) => {
        if (p.chain !== selectedToken.chain) {
          return true;
        }

        const isBuyNative = isNativeAsset(selectedToken.ca);
        const isTokenNative = isNativeAsset(p.address);
        if (isBuyNative && isTokenNative) {
          return false;
        }

        return p.address?.toLowerCase() !== selectedToken?.ca?.toLowerCase();
      });
    }

    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (token) =>
          token.symbol?.toLowerCase().includes(q) ||
          token.name?.toLowerCase().includes(q) ||
          token.address?.toLowerCase().includes(q),
      );
    }

    return filtered.filter((p) => {
      if (p.userHidden) {
        return false;
      }
      if (excludeUsdc && isUsdc(p.address)) {
        return false;
      }
      if (limitOrderQuoteOnly) {
        return tokenPositionSupportsLimitOrderQuote(p, selectedToken);
      }
      if (limitOrdersOnly && !tokenPositionSupportsLimitOrder(p)) {
        return false;
      }
      return true;
    });
  }, [
    balances,
    query,
    selectedToken,
    limitOrdersOnly,
    limitOrderQuoteOnly,
    excludeUsdc,
  ]);

  const keyExtractor = useCallback((position: ApiEthFungibleTokenPosition) => {
    return position.id;
  }, []);

  const renderItem = useCallback<ListRenderItem<ApiEthFungibleTokenPosition>>(
    ({ item: position }) => {
      const token = tokenPositionToTokenLink(position);
      return (
        <TokenListItem
          token={tokenPositionToTokenLink(position)}
          onPress={() => {
            onSelectToken(token);
          }}
          variant="balance"
          ownedAmount={position.quantity.float}
          ownedValue={position.value}
        />
      );
    },
    [onSelectToken],
  );

  const ListEmptyComponent = useMemo(() => {
    if (balances.length === 0) {
      return <SwapTokensSelectNoTokensFound address={evmAddress!} />;
    }

    return (
      <View>
        <Text2 color="tertiary" align="center">
          No results found for "{query}"
        </Text2>
      </View>
    );
  }, [balances, evmAddress, query]);

  return (
    <FlashList
      data={filteredPositions}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
    />
  );
}

function SearchResults({
  query,
  tab,
  intent,
  onSelectToken,
  selectedToken,
  limitOrdersOnly = false,
  limitOrderQuoteOnly = false,
}: {
  query: string;
  tab: TabOption;
  intent: 'typeahead' | 'submit';
  onSelectToken: (token: ApiTokenLink, via: ExploreTokensVia) => void;
  selectedToken?: ApiTokenLink;
  limitOrdersOnly?: boolean;
  limitOrderQuoteOnly?: boolean;
}) {
  const insets = useOptionalSafeAreaInsets();
  const viewerFid = useCurrentUserFid();
  const swapTokensContext = useOptionalSwapTokens();
  const isBuyExperience = swapTokensContext?.isBuyExperience ?? false;
  const excludeUsdc = isBuyExperience || limitOrdersOnly;

  const chain = isTabChain(tab) ? (tab as ApiChain) : undefined;

  const debouncedQuery = useDebouncedValue({
    value: query.trim(),
    debounceDuration: 300,
  });

  const { data, isPending } = useNonSuspenseTokenLinks({
    ticker: debouncedQuery,
    chain,
    intent,
    contextFid: viewerFid,
    enabled: debouncedQuery.length > 0,
  });

  const filteredTokens = useMemo(() => {
    if (!data?.tokens) {
      return data?.tokens ?? [];
    }
    let filtered = data.tokens;
    filtered = filtered.filter((t) => !t.walletContext?.hidden);
    if (excludeUsdc) {
      filtered = filtered.filter((t) => !isUsdc(t.ca));
    }
    if (limitOrderQuoteOnly) {
      filtered = filtered.filter((t) =>
        tokenSupportsLimitOrderQuote(t, selectedToken),
      );
    } else if (limitOrdersOnly) {
      filtered = filtered.filter((t) => tokenSupportsLimitOrder(t));
    }
    if (selectedToken) {
      filtered = filtered.filter((t) => {
        return !isSameAsset({
          chain: t.chain,
          ca: t.ca,
          asset: selectedToken,
        });
      });
    }
    return filtered;
  }, [
    data?.tokens,
    selectedToken,
    limitOrdersOnly,
    limitOrderQuoteOnly,
    excludeUsdc,
  ]);

  const handleSelectTokenQuery = useCallback(
    (token: ApiTokenLink) => {
      onSelectToken(token, 'explore_search_query');
    },
    [onSelectToken],
  );

  const keyExtractor = useCallback((token: ApiTokenLink) => {
    return `${token.chain}:${token.ca}`;
  }, []);

  const t = useTheme();

  const renderItem = useCallback<ListRenderItem<ApiTokenLink>>(
    ({ item }) => {
      // Show ticker + formatTimeAgo as subtitle
      const subtitleComponent = (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          {item.ticker && (
            <Text2
              color="tertiary"
              weight="medium"
              style={{ fontSize: 13, lineHeight: 15 }}
            >
              {item.ticker}
            </Text2>
          )}
          {item.source?.createdAt && (
            <>
              {item.ticker && (
                <Text2
                  color="tertiary"
                  weight="medium"
                  style={{ fontSize: 13, lineHeight: 15 }}
                >
                  ∙
                </Text2>
              )}
              <Text2
                color="tertiary"
                weight="medium"
                style={{ fontSize: 13, lineHeight: 15 }}
              >
                {formatTimeAgo(item.source.createdAt)}
              </Text2>
            </>
          )}
        </View>
      );

      return (
        <TokenListItem
          token={item}
          onPress={handleSelectTokenQuery}
          subtitleComponent={subtitleComponent}
        />
      );
    },
    [handleSelectTokenQuery, t],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isPending) {
      return (
        <View>
          {Array.from({ length: isAddress(query.trim()) ? 1 : 5 }).map(
            (_, index) => (
              <TokenListItemPlaceholder key={index} hideValue />
            ),
          )}
        </View>
      );
    }

    return (
      <View>
        <Text2 color="tertiary" align="center">
          No results found for "{debouncedQuery}"
        </Text2>
      </View>
    );
  }, [isPending, query, debouncedQuery]);

  return (
    <FlashList
      data={filteredTokens}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="always"
    />
  );
}

function Tabs({
  selectedTab,
  onSelectTab,
  isSearching,
  query,
  selectedToken,
}: {
  selectedTab: TabOption;
  onSelectTab: (tab: TabOption) => void;
  isSearching: boolean;
  query: string;
  selectedToken?: ApiOnchainTokenMinimal;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const { solanaAddress } = useEmbeddedWallet();

  const defaultChain =
    selectedToken?.chain === 'solana'
      ? 'solana'
      : selectedToken?.chain === 'hyperevm'
        ? 'hyperevm'
        : selectedToken?.chain === 'bsc'
          ? 'bsc'
          : 'base';

  const options: TabOption[] = React.useMemo(() => {
    if (isAddress(query.trim())) {
      return [];
    }

    const result: TabOption[] = ['for-you', 'your-tokens', 'trending'];

    if (!isSearching) {
      return result;
    }

    const OTHER_CHAINS: ApiChain[] = [
      'ethereum',
      'bsc',
      'monad',
      'arbitrum',
      'optimism',
      'polygon',
      'hyperevm',
      'gnosis',
      'degen',
      'zora',
      'unichain',
      'celo',
      'robinhood',
    ];

    let priority: ApiChain[] = [];
    if (!solanaAddress) {
      priority = ['base'];
    } else if (defaultChain === 'hyperevm') {
      priority = ['hyperevm', 'base'];
    } else if (defaultChain === 'solana') {
      priority = ['solana', 'base'];
    } else {
      priority = ['base', 'solana'];
    }

    result.push(...priority, ...OTHER_CHAINS);

    return result;
  }, [solanaAddress, defaultChain, isSearching, query]);

  if (options.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[t.flexRow, { gap: 8, paddingHorizontal: 12 }]}
      keyboardShouldPersistTaps="always"
    >
      {options.map((option) => (
        <TabPill
          key={option}
          onPress={() => {
            triggerImpactAsync();
            onSelectTab(option);
          }}
          selected={selectedTab === option}
          label={
            option === 'for-you'
              ? 'For You'
              : option === 'your-tokens'
                ? 'Your Tokens'
                : option === 'trending'
                  ? 'Trending'
                  : apiChainDisplayName(option as ApiChain)
          }
        />
      ))}
    </ScrollView>
  );
}

function TabPill({
  onPress,
  selected,
  label,
}: {
  onPress: () => void;
  selected: boolean;
  label: string;
}) {
  const t = useTheme();
  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={[
          t.flex,
          t.itemsCenter,
          t.borderHairline,
          {
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 9,
            borderRadius: 16,
          },
          selected ? t.backgrounds.brandLight : t.backgrounds.default,
          t.borders.primary,
        ]}
      >
        <Text2
          weight="medium"
          style={
            selected
              ? t.dark
                ? t.texts.primary
                : t.texts.brand
              : t.texts.secondary
          }
        >
          {label}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}
