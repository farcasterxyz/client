import {
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
  isUsdc,
} from 'farcaster-client-data';
import type { ApiTokenBonus } from 'farcaster-client-data/src/types/api';
import {
  formatAmount,
  useOnchainMorphoFarcasterVault,
} from 'farcaster-client-hooks';
import { BarChart3, Clock } from 'lucide-react-native';
import React, { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { useHaptics } from '../../../hooks/useHaptics';
import { usePrefetchTokenInfo } from '../../../hooks/usePrefetchTokenInfo';
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus';
import { useWalletBalances } from '../../../hooks/useWalletBalances';
import { formatAssetId, tokenPositionToTokenLink } from '../../../utils';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { TokenListItem, TokenListItemPlaceholder } from '../../crypto';
import { ExpandToggle, Text2 } from '../../design-system';

const AnimatedFlashList = Animated.FlatList;

// iOS doesn't really need pagination so just make it a big number
const PAGE_SIZE = Platform.OS === 'ios' ? 1000 : 25;

export const WalletTokenBalances = memo(
  ({
    fid,
    onScroll,
    onLayout,
    onTokenPress,
    extraData,
    ListHeaderComponent,
    contentOffset,
    setIsRefreshing,
    query,
    showVerticalScrollIndicator = true,
    shouldHideBalances = true,
    hideEarnings = false,
    hideUsdc = false,
  }: {
    fid?: number;
    onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onTokenPress?: (token: ApiTokenLink) => void;
    onLayout?: () => void;
    extraData?: boolean[];
    ListHeaderComponent?: React.ReactElement;
    contentOffset?: { x: number; y: number };
    setIsRefreshing?: (isRefreshing: boolean) => void;
    query?: string;
    showVerticalScrollIndicator?: boolean;
    shouldHideBalances?: boolean;
    hideEarnings?: boolean;
    hideUsdc?: boolean;
  }) => {
    const t = useTheme();
    const { trackError } = useSharedTelemetry();

    const [showHiddenPositions, setShowHiddenPositions] = useState(false);

    const { data: fcMorphoVault } = useOnchainMorphoFarcasterVault();

    const { balances, refetch, isPending, isError } = useWalletBalances(fid);

    const [page, setPage] = useState(1);

    const { filteredPositions, toggleIndex, hasMorePositions } = useMemo(() => {
      if (query) {
        const q = query.toLowerCase();
        return {
          filteredPositions: balances
            .filter(
              (position) =>
                position.symbol?.toLowerCase().includes(q) ||
                position.name?.toLowerCase().includes(q),
            )
            .map((position) => ({
              position,
              token: tokenPositionToTokenLink(position),
            })),
        };
      }

      const visible = balances
        .filter((p) => !p.userHidden)
        .filter((p) => {
          // If we're hiding USDC, then we are showing the Cash Balances section
          // which includes Lent USDC (Farcaster Morpho Vault)
          if (hideUsdc && isUsdc(p.address)) return false;
          if (
            hideUsdc &&
            fcMorphoVault?.token.ca?.toLowerCase() === p.address?.toLowerCase()
          ) {
            return false;
          }

          return true;
        });

      const nonHidden = visible.filter((p) => !p.hidden);
      const hidden = visible.filter((p) => p.hidden);

      const result = showHiddenPositions
        ? [...nonHidden, ...hidden]
        : nonHidden;

      // Pre-transform all tokens to avoid repeated computation
      const transformed = result.slice(0, page * PAGE_SIZE).map((position) => ({
        position,
        token: tokenPositionToTokenLink(position),
      }));

      return {
        filteredPositions: transformed,
        toggleIndex: nonHidden.length - 1,
        hasMorePositions: hidden.length > 0,
      };
    }, [balances, showHiddenPositions, page, query, fcMorphoVault, hideUsdc]);

    const { triggerImpactAsync } = useHaptics();
    const onRefresh = useCallback(async () => {
      try {
        setIsRefreshing?.(true);
        triggerImpactAsync();
        await refetch();
      } catch (e) {
        trackError(e);
      } finally {
        setIsRefreshing?.(false);
      }
    }, [refetch, triggerImpactAsync, trackError, setIsRefreshing]);

    useRefreshOnFocus(refetch);

    const { push } = useSharedNavigationContext();

    const onEndReached = useCallback(() => {
      setPage(page + 1);
    }, [page]);

    const handleTokenPress = useCallback(
      (token: ApiTokenLink) => {
        if (onTokenPress) {
          onTokenPress(token);
          return;
        }

        triggerImpactAsync();
        push({
          path: 'Token',
          params: { ca: token.ca, chain: token.chain, via: 'wallet_balance' },
        });
      },
      [triggerImpactAsync, push, onTokenPress],
    );

    const prefetchTokenInfo = usePrefetchTokenInfo();

    const handleExpandToggle = useCallback(() => {
      setShowHiddenPositions((prev) => !prev);
    }, []);

    const renderItem = useCallback(
      ({
        item,
        index,
      }: {
        item: {
          position: ApiEthFungibleTokenPosition;
          token: ApiTokenLink;
        };
        index: number;
      }) => {
        return (
          <>
            <TokenListItem
              token={item.token}
              onPress={handleTokenPress}
              onPressIn={(token) =>
                prefetchTokenInfo({
                  ca: token.ca,
                  chain: token.chain,
                })
              }
              variant="balance"
              ownedAmount={item.position.quantity.float}
              ownedValue={item.position.value}
              bonuses={item.position.bonuses}
              green={t.colors.green450}
              shouldHideBalance={shouldHideBalances}
              hideEarnings={hideEarnings}
              hidePriceChange
            />
            {index === toggleIndex && hasMorePositions && (
              <ExpandToggle
                expanded={showHiddenPositions}
                onToggle={handleExpandToggle}
              />
            )}
          </>
        );
      },
      [
        handleTokenPress,
        t.colors.green450,
        shouldHideBalances,
        hideEarnings,
        toggleIndex,
        hasMorePositions,
        showHiddenPositions,
        handleExpandToggle,
        prefetchTokenInfo,
      ],
    );

    const ListEmptyComponent = useMemo(() => {
      if (isPending && balances.length === 0) {
        return (
          <View>
            {[...Array(5)].map((_, idx) => (
              <TokenListItemPlaceholder key={idx} />
            ))}
          </View>
        );
      }

      if (isError && balances.length === 0) {
        return (
          <View
            style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 8 }]}
          >
            <Clock size={24} style={t.texts.tertiary} />
            <Text2 color="secondary" align="center">
              It's taking a little longer than usual to load your tokens. Please
              check back shortly.
            </Text2>
          </View>
        );
      }

      return null;
    }, [isPending, isError, balances.length, t]);

    const keyExtractor = useCallback(
      (item: {
        position: ApiEthFungibleTokenPosition;
        token: ApiTokenLink;
      }) => {
        return formatAssetId(item.position.chain, item.position.address);
      },
      [],
    );

    return (
      <AnimatedFlashList
        data={filteredPositions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          Platform.OS !== 'web' ? { paddingBottom: 150 } : undefined
        }
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          Platform.OS === 'ios' ? (
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              // Already wrapped with a Platform check above.
              // eslint-disable-next-line no-restricted-syntax
              tintColor="transparent"
              colors={[]}
              progressViewOffset={0}
            />
          ) : undefined
        }
        onScroll={onScroll}
        onLayout={onLayout}
        ListHeaderComponent={ListHeaderComponent}
        contentOffset={contentOffset}
        extraData={extraData}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        showsVerticalScrollIndicator={showVerticalScrollIndicator}
      />
    );
  },
);

export type DepositBonusStatsProps = {
  tokenTicker: string;
  tokenBalance: number;
  tokenBonus: ApiTokenBonus;
  tokenImageUrl?: string;
  onDismiss: () => void;
};

export const DepositBonusStatsBottomSheet = forwardRef<
  { dismiss: () => void },
  DepositBonusStatsProps
>(
  (
    { tokenTicker, tokenBalance, tokenBonus, tokenImageUrl, onDismiss },
    ref,
  ) => {
    const t = useTheme();

    const formatCurrency = useCallback((amount: number) => {
      return `$${formatAmount(amount)}`;
    }, []);

    const content = useMemo(
      () => (
        <View style={[t.flex1, t.flexCol, { gap: 16 }]}>
          {/* Header */}
          <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
            <View
              style={[
                { width: 40, height: 40, borderRadius: 20 },
                t.justifyCenter,
                t.itemsCenter,
                t.overflowHidden,
              ]}
            >
              {tokenImageUrl ? (
                <Image
                  source={{ uri: tokenImageUrl }}
                  style={{ width: 40, height: 40 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    t.backgrounds.brand,
                    { width: 40, height: 40, borderRadius: 20 },
                    t.justifyCenter,
                    t.itemsCenter,
                  ]}
                >
                  <Text2 size="lg" weight="semibold" color="light">
                    $
                  </Text2>
                </View>
              )}
            </View>
            <View>
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <BarChart3 size={16} color={t.colors.text.secondary} />
                <Text2 size="sm" color="secondary">
                  Deposit bonus
                </Text2>
              </View>
              <Text2 size="lg" weight="semibold">
                {tokenTicker}
              </Text2>
            </View>
          </View>

          {/* Stats */}
          <View>
            {/* Total Balance Row */}
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.backgrounds.secondary,
                { padding: 6 },
                t.roundedLg,
              ]}
            >
              <Text2 size="base" color="secondary">
                {tokenTicker} total
              </Text2>
              <Text2 size="base" weight="semibold">
                {formatCurrency(tokenBalance)}
              </Text2>
            </View>

            {/* Eligible Amount Row */}
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                { padding: 6 },
                t.roundedLg,
              ]}
            >
              <Text2 size="base" color="secondary">
                {tokenTicker} eligible
              </Text2>
              <Text2 size="base" weight="semibold">
                {formatCurrency(tokenBonus.eligibleAmount)}
              </Text2>
            </View>

            {/* Payout Row */}
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.backgrounds.secondary,
                { padding: 6 },
                t.roundedLg,
              ]}
            >
              <Text2 size="base" color="secondary">
                Payout this week
              </Text2>
              <Text2 size="base" weight="semibold">
                {formatCurrency(tokenBonus.currentPeriodPayoutAmount)}
              </Text2>
            </View>
          </View>
        </View>
      ),
      [t, tokenTicker, tokenBalance, tokenBonus, tokenImageUrl, formatCurrency],
    );

    return (
      <AutoDisplayingBottomSheetModal
        name="depositBonusStats"
        onDismiss={onDismiss}
        ref={ref}
        displayedInModalPresentationScreen={true}
      >
        {content}
      </AutoDisplayingBottomSheetModal>
    );
  },
);

DepositBonusStatsBottomSheet.displayName = 'DepositBonusStatsBottomSheet';
