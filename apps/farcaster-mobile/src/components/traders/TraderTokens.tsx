import { BottomSheetFlashList } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { ApiTokenLink, ApiUser } from 'farcaster-client-data';
import {
  formatBalance,
  formatPrice,
  formatTokenName,
  useWalletPositionsOpen,
} from 'farcaster-client-hooks';
import {
  AnimatedBalanceDisplay,
  AnimatedPressable,
  ExpandToggle,
  Text2,
  TextPlaceholder,
  TokenIcon,
  TokenListItemPlaceholder,
  useTheme,
} from 'farcaster-expo';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TraderTokens({
  user,
  contentOffset,
  headerGap,
  componentType = 'flashlist',
  onTokenPress,
  onScroll,
  onLayout,
}: {
  user: ApiUser;
  headerGap?: React.ReactNode;
  componentType?: 'flashlist' | 'bottomsheet' | 'animated';
  contentOffset?: { x: number; y: number };
  onTokenPress: (token: ApiTokenLink) => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout?: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  // By default, we expand with the preview tokens, rest are collapsed
  const [expandOpenPositions, setExpandOpenPositions] = useState(true);
  const [loadingOpenPositions, setLoadingOpenPositions] = useState(true);
  const [showAllOpenPositions, setShowAllOpenPositions] = useState(false);

  const {
    data: openPositions,
    isPending: isOpenPositionsPending,
    hasNextPage: hasOpenPositionsNextPage,
    fetchNextPage: fetchOpenPositionsNextPage,
  } = useWalletPositionsOpen({ fid: user.fid });

  const allOpenPositions = useMemo(() => {
    const tokens = openPositions?.pages.flatMap((page) => page.tokens);
    return {
      totalBalanceUsd: openPositions?.pages[0]?.totalBalanceUsd ?? 0,
      tokens: tokens ?? [],
    };
  }, [openPositions]);

  // Load balances over $10
  useEffect(() => {
    const tokens = allOpenPositions.tokens;
    if (isOpenPositionsPending || tokens.length === 0) return;
    if (!loadingOpenPositions) return;

    const lastToken = tokens[tokens.length - 1];
    if ((lastToken?.walletContext?.position.valueUsd ?? 0) <= 5) {
      setLoadingOpenPositions(false);
      return;
    }

    if (hasOpenPositionsNextPage) {
      fetchOpenPositionsNextPage();
      return;
    }

    // nothing else to load.
    setLoadingOpenPositions(false);
  }, [
    allOpenPositions,
    loadingOpenPositions,
    isOpenPositionsPending,
    hasOpenPositionsNextPage,
    fetchOpenPositionsNextPage,
  ]);

  const ListHeaderComponent = useMemo(() => {
    const preview = allOpenPositions.tokens.slice(0, 3);
    const filteredRest = allOpenPositions.tokens.slice(3).filter(
      (token, i) =>
        // First 7 including preview, then filter out anything less than $5
        i < 7 || (token.walletContext?.position.valueUsd ?? 0) >= 5,
    );

    return (
      <View>
        {headerGap}
        <View style={[t.pX3, t.pB3]}>
          {isOpenPositionsPending && <TextPlaceholder size="3xl" width={50} />}
          {/** Balance */}
          {!isOpenPositionsPending && (
            <AnimatedBalanceDisplay
              size="3xl"
              amount={allOpenPositions.totalBalanceUsd}
            />
          )}
        </View>
        <View style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.p3]}>
          <Text2
            size="sm"
            weight="semibold"
            color="tertiary"
            style={[{ lineHeight: 16 }]}
          >
            OPEN POSITIONS
          </Text2>
          {allOpenPositions.tokens.length > 3 && (
            <AnimatedPressable
              onPress={() => {
                // Also collapse all open positions
                setExpandOpenPositions(!expandOpenPositions);
                setShowAllOpenPositions(false);
              }}
              style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
            >
              <Text2 weight="semibold" color="tertiary">
                {preview.length + filteredRest.length}
              </Text2>
              {expandOpenPositions && (
                <ChevronDown size={20} color={t.colors.text.tertiary} />
              )}
              {!expandOpenPositions && (
                <ChevronUp size={20} color={t.colors.text.tertiary} />
              )}
            </AnimatedPressable>
          )}
        </View>
        {isOpenPositionsPending && (
          <View>
            <TokenListItemPlaceholder />
            <TokenListItemPlaceholder />
            <TokenListItemPlaceholder />
          </View>
        )}
        {expandOpenPositions &&
          !isOpenPositionsPending &&
          preview.length === 0 && (
            <View>
              <Text2
                size="xs"
                align="center"
                weight="semibold"
                color="tertiary"
                style={[t.p3]}
              >
                No open positions found
              </Text2>
            </View>
          )}
        {expandOpenPositions &&
          preview.map((token) => (
            <Position
              key={`${token.chain}:${token.ca}`}
              token={token}
              onPress={() => onTokenPress(token)}
            />
          ))}
        {expandOpenPositions &&
          showAllOpenPositions &&
          filteredRest.length > 0 && (
            <View>
              {filteredRest.map((token) => (
                <Position
                  key={`${token.chain}:${token.ca}`}
                  token={token}
                  onPress={() => onTokenPress(token)}
                />
              ))}
            </View>
          )}
        {expandOpenPositions &&
          showAllOpenPositions &&
          loadingOpenPositions && <TokenListItemPlaceholder />}
        {expandOpenPositions && allOpenPositions.tokens.length > 3 && (
          <ExpandToggle
            expanded={showAllOpenPositions}
            onToggle={() => setShowAllOpenPositions(!showAllOpenPositions)}
          />
        )}
      </View>
    );
  }, [
    t,
    headerGap,
    allOpenPositions,
    isOpenPositionsPending,
    loadingOpenPositions,
    expandOpenPositions,
    showAllOpenPositions,
    onTokenPress,
  ]);

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom,
    }),
    [insets.bottom],
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiTokenLink }) => {
      return <Position token={item} onPress={() => onTokenPress(item)} />;
    },
    [onTokenPress],
  );

  const onEndReached = useCallback(() => {
    if (hasOpenPositionsNextPage) {
      fetchOpenPositionsNextPage();
    }
  }, [fetchOpenPositionsNextPage, hasOpenPositionsNextPage]);

  const ListComponent =
    componentType === 'flashlist'
      ? FlashList
      : componentType === 'bottomsheet'
        ? BottomSheetFlashList
        : Animated.FlatList;

  return (
    <ListComponent
      data={allOpenPositions.tokens}
      renderItem={renderItem}
      contentOffset={contentOffset}
      onEndReachedThreshold={0.2}
      onEndReached={onEndReached}
      onLayout={onLayout}
      onScroll={onScroll}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
    />
  );
}

function Position({
  token,
  onPress,
}: {
  token: ApiTokenLink;
  onPress: () => void;
}) {
  const t = useTheme();

  const walletContext = token.walletContext;
  if (!walletContext) {
    return null;
  }

  const quantity = walletContext.position.quantity.float;
  return (
    <AnimatedPressable onPress={onPress}>
      <View style={[t.flexRow, t.itemsCenter, t.p3, { gap: 12 }]}>
        <TokenIcon
          iconUrl={token?.imageUrl}
          diameter={40}
          chain={token.chain}
          symbol={token.ticker}
          features={token?.features}
          badgeOffset={{ top: -2, right: -2 }}
          imageBordered
        />
        <View
          style={[
            t.flexRow,
            t.flexShrink,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 8 },
          ]}
        >
          <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
            <Text2 color="primary" weight="semibold" numberOfLines={1}>
              {formatTokenName(token.name, token.ca, token.chain)}
            </Text2>
            <Text2
              size="sm"
              color="tertiary"
              weight="semibold"
              numberOfLines={1}
            >
              {`${formatBalance(quantity ?? 0)} ${token.ticker ?? token.name}`}
            </Text2>
          </View>
          <Text2 color="primary" weight="semibold" numberOfLines={1}>
            {formatPrice(walletContext.position.valueUsd)}
          </Text2>
        </View>
      </View>
    </AnimatedPressable>
  );
}
