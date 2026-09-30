import { FlashList } from '@shopify/flash-list';
import {
  ApiTokenLink,
  ApiUser,
  ApiWalletActivity,
  isUsdc,
} from 'farcaster-client-data';
import {
  formatAmount,
  formatPrice,
  formatTokenStat,
  useGloballyCachedToken,
  useNonSuspenseTokenWalletContext,
  useWalletActivity,
} from 'farcaster-client-hooks';
import { Circle } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import {
  useActiveWallet,
  useCurrentUserFid,
  useHaptics,
  useWalletFidOverride,
} from '../../../hooks';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { AnimatedPressable, Text2 } from '../../design-system';
import { TextPlaceholder } from '../../design-system/SkeletonPlaceholder';
import { WalletActivityBottomSheet } from '../../wallet/activity/WalletActivity';
import { WalletScreenHeader } from '../../wallet/WalletScreenHeader';
import { TraderBottomSheetHeader } from '../traders/TraderBottomSheetHeader';
import { TraderTokenBottomSheetContent } from '../traders/TraderTokenBottomSheetContent';
import { estimateMarketCapAtPrice, getCanonicalMarketCap } from './mcap';

export function TokenActivity({
  token: fallbackToken,
}: {
  token: ApiTokenLink;
}) {
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  const { triggerImpactAsync } = useHaptics();
  const { trackError } = useSharedTelemetry();

  const userFid = useCurrentUserFid();
  const [maybeFidOverride] = useWalletFidOverride();
  const { activeWalletId } = useActiveWallet();

  const fid = useMemo(() => {
    return maybeFidOverride ?? userFid;
  }, [userFid, maybeFidOverride]);

  const walletId = fid === userFid ? activeWalletId : undefined;

  const token = useGloballyCachedToken({ fallback: fallbackToken });

  const { refetch: refetchTokenWalletContext } =
    useNonSuspenseTokenWalletContext({
      params: {
        fid,
        walletId,
        chain: token.chain,
        ca: token.ca,
      },
    });

  const {
    data,
    refetch: refetchActivity,
    hasNextPage,
    fetchNextPage,
    isError,
    isLoading,
    isFetchingNextPage,
  } = useWalletActivity({
    params: {
      fid,
      walletId,
      hideSpam: false,
      hideMicrotransactions: false,
      token: `${token.chain}:${token.ca}`,
    },
    enabled: !!fid,
  });

  const activities = useMemo(() => {
    return data?.pages.flatMap((page) => page.result.activity) ?? [];
  }, [data]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      triggerImpactAsync();
      await Promise.all([refetchActivity(), refetchTokenWalletContext()]);
    } catch (e) {
      trackError(e);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchActivity,
    refetchTokenWalletContext,
    triggerImpactAsync,
    trackError,
  ]);

  const [item, setItem] = useState<ApiWalletActivity | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const ListHeaderComponent = useMemo(() => {
    return (
      <View style={[t.pB3, { gap: 12 }]}>
        <Text2 weight="medium" size="lg" style={[t.pX3]}>
          {activities.length > 0 ? `${activities.length}` : ''}
          {hasNextPage ? '+ ' : ' '}Transaction
          {activities.length > 1 ? 's' : ''}
        </Text2>
      </View>
    );
  }, [t.pB3, t.pX3, activities.length, hasNextPage]);

  const ListFooterComponent = useMemo(() => {
    return isFetchingNextPage ? <TokenActivityPlaceHolderItem /> : null;
  }, [isFetchingNextPage]);

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View>
          <TokenActivityPlaceHolderItem />
          <TokenActivityPlaceHolderItem />
          <TokenActivityPlaceHolderItem />
        </View>
      );
    }

    return (
      <View style={[t.h36, t.pX3, t.mT8]}>
        <Text2 color="secondary" align="center">
          {!isError
            ? 'No swap activity found'
            : "It's taking a little longer than usual to load your activity. Please check back shortly."}
        </Text2>
      </View>
    );
  }, [t, isError, isLoading]);

  const renderItem = useCallback(
    ({ item }: { item: ApiWalletActivity }) => {
      return (
        <TokenActivityItem
          key={`${item.transaction.txHash}`}
          token={token}
          item={item}
          onPress={() => setItem(item)}
        />
      );
    },
    [token],
  );

  return (
    <View style={[t.flex1]}>
      <WalletScreenHeader
        title={'Your Position'}
        onBackCallback={goBack}
        style={Platform.OS !== 'web' ? [t.pT2] : undefined}
      />
      <FlashList
        data={activities}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      {item && (
        <WalletActivityBottomSheet
          item={item}
          onDismiss={() => setItem(null)}
        />
      )}
    </View>
  );
}

export function TokenUserActivityBottomSheetModal({
  user,
  token,
  onUserPress,
  onDismiss,
}: {
  user: ApiUser;
  token: ApiTokenLink;
  onUserPress?: ({ fid }: { fid: number }) => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const { push } = useSharedNavigationContext();

  const onTokenPress = React.useCallback(() => {
    triggerImpactAsync();

    push({
      path: 'Token',
      params: {
        chain: token.chain,
        ca: token.ca,
        via: 'token-user-positions',
      },
    });
  }, [push, token.ca, token.chain, triggerImpactAsync]);

  return (
    <AutoDisplayingBottomSheetModal
      name="token-user-activity"
      handleIndicatorStyle={{ backgroundColor: t.colors.text.tertiary }}
      onDismiss={onDismiss}
      snapPoints={['100%']}
      enableDynamicSizing={false}
      disableBottomSheetContentContainer
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
      ]}
    >
      <TraderBottomSheetHeader
        user={user}
        token={token}
        onUserPress={onUserPress}
        onTokenPress={onTokenPress}
      />
      <TraderTokenBottomSheetContent user={user} token={token} />
    </AutoDisplayingBottomSheetModal>
  );
}

const TokenActivityItem = ({
  token,
  item,
  onPress,
}: {
  token: ApiTokenLink;
  item: ApiWalletActivity;
  onPress?: () => void;
}) => {
  const t = useTheme();
  const { chain, ca } = token;

  const stateChange = item.stateChanges.find(
    (s) =>
      s.assetMetadata.chain?.toLowerCase() === chain.toLowerCase() &&
      s.assetMetadata.ca?.toLowerCase() === ca.toLowerCase(),
  );

  const typeText = useMemo(() => {
    if (item.type === 'swap' && stateChange?.direction === 'OUT') {
      return 'Sell';
    }
    if (item.type === 'swap' && stateChange?.direction === 'IN') {
      return 'Buy';
    }
    if (item.type === 'send') {
      return 'Send';
    }
    if (item.type === 'receive') {
      return 'Receive';
    }
    return 'Unknown';
  }, [item.type, stateChange?.direction]);

  const content = useMemo(() => {
    if (!stateChange) {
      return null;
    }

    const sign = stateChange.direction === 'OUT' ? -1 : 1;

    // Unit Price -- Clearer when `usdPrice` is renamed
    const priceUsd = stateChange.usdPrice
      ? stateChange.usdPrice / stateChange.value
      : undefined;

    // Total USD Value -- Clearer when `usdPrice` is renamed
    const valueUsd = stateChange.usdPrice ? stateChange.usdPrice : undefined;

    // If available, use the estimated mcp price
    const currPriceUsd = token.priceUsd
      ? parseFloat(token.priceUsd)
      : undefined;

    const currentMarketCap = getCanonicalMarketCap({
      marketCap: token.marketCap,
      circulatingSupply: token.circulatingSupply,
      effectivePriceUsd: currPriceUsd,
    });
    const mcap = estimateMarketCapAtPrice({
      currentMarketCap,
      currentPriceUsd: currPriceUsd,
      targetPriceUsd: priceUsd,
    });

    const priceColor = sign === -1 ? t.colors.red500 : t.colors.green450;

    return (
      <View
        style={[
          t.flex1,
          t.flexRow,
          t.pY2,
          t.pX3,
          t.itemsCenter,
          t.justifyBetween,
          { borderRadius: 6 },
        ]}
      >
        <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <Circle size={8} color={priceColor} fill={priceColor} />
            <Text2 weight="medium" color="primary">
              {typeText}
            </Text2>
          </View>
          <Text2 size="sm" color="secondary">
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            {' at '}
            {new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text2>
        </View>
        <View style={[t.flex1, t.flexCol, t.itemsEnd, { gap: 4 }]}>
          <Text2 weight="medium" color="primary">
            {!valueUsd && 'N/A'}
            {valueUsd &&
              formatPrice(sign * valueUsd, { showPositiveSign: true })}
          </Text2>
          <Text2 size="sm" color="secondary" numberOfLines={1}>
            {formatAmount(stateChange.value)}
            {isUsdc(ca) || (!mcap && !priceUsd)
              ? ''
              : // price will be available if all the conditions fail. ?? 0 for the typechecker
                ` at ${mcap && (!priceUsd || priceUsd < 0.1) ? formatTokenStat(mcap) : formatPrice(priceUsd ?? 0)}`}
          </Text2>
        </View>
      </View>
    );
  }, [
    t,
    token.marketCap,
    token.circulatingSupply,
    token.priceUsd,
    item,
    stateChange,
    ca,
    typeText,
  ]);

  if (onPress && stateChange) {
    return <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable>;
  }

  return content;
};

const TokenActivityPlaceHolderItem = () => {
  const t = useTheme();
  return (
    <View
      style={[
        t.flex1,
        t.flexRow,
        t.pY2,
        t.pX3,
        t.itemsCenter,
        t.justifyBetween,
        { borderRadius: 6 },
      ]}
    >
      <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
        <TextPlaceholder width={40} size="base" />
        <TextPlaceholder width={80} size="sm" />
      </View>
      <View style={[t.flex1, t.flexCol, t.itemsEnd, { gap: 4 }]}>
        <TextPlaceholder width={40} size="base" />
        <TextPlaceholder width={80} size="sm" />
      </View>
    </View>
  );
};
