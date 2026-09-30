import { ApiEthNonFungibleToken } from 'farcaster-client-data';
import { useWalletNfts } from 'farcaster-client-hooks';
import { Clock } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { LoadFailureIndicator } from '../../../components/LoadFailureIndicator';
import { useEmbeddedWallet, useSharedTelemetry } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCurrentUserFid } from '../../../hooks';
import { useHaptics } from '../../../hooks/useHaptics';
import { useWalletFidOverride } from '../../../hooks/useWalletPreferences';
import {
  getFarcasterProNFTImage,
  isFarcasterProNFT,
} from '../../../utils/WalletUtils';
import { Text2 } from '../../design-system';
import {
  SPACING,
  WalletCollectiblesItem,
  WalletCollectiblesItemsPlaceholder,
} from './WalletCollectiblesItem';

const AnimatedFlashList = Animated.FlatList;

const COLLECTIONS_COLUMN_COUNT = 3;
const NUM_VISIBLE_ROWS = 6;

export function WalletCollectibles({
  onCollectiblePress,
  onScroll,
  onLayout,
  extraData,
  ListHeaderComponent,
  contentOffset,
  setIsRefreshing,
  paddingVertical = 12,
  showVerticalScrollIndicator = true,
}: {
  onCollectiblePress?: (nft: ApiEthNonFungibleToken) => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout?: () => void;
  extraData?: boolean[];
  ListHeaderComponent?: React.ReactElement;
  contentOffset?: { x: number; y: number };
  setIsRefreshing?: (isRefreshing: boolean) => void;
  paddingVertical?: number;
  showVerticalScrollIndicator?: boolean;
}) {
  const t = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const { trackError } = useSharedTelemetry();

  const userFid = useCurrentUserFid();
  const [walletFidOverride] = useWalletFidOverride();
  const { evmAddress } = useEmbeddedWallet();
  const fid = useMemo(
    () => walletFidOverride ?? userFid,
    [walletFidOverride, userFid],
  );

  // When viewing own wallet, pass address to include NFTs minted to embedded
  // wallet (e.g. Betrmint) which may differ from fid-resolved custody address
  const isViewingOwnWallet = !walletFidOverride && fid === userFid;
  const nftsParams = useMemo(
    () => ({
      fid,
      ...(isViewingOwnWallet && evmAddress ? { address: evmAddress } : {}),
    }),
    [fid, isViewingOwnWallet, evmAddress],
  );

  const imageSize =
    (screenWidth - SPACING * (COLLECTIONS_COLUMN_COUNT + 1)) /
    COLLECTIONS_COLUMN_COUNT;

  const {
    data,
    isPending,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWalletNfts({
    params: nftsParams,
    enabled: !!fid,
  });

  const nfts = useMemo(() => {
    const nfts = data?.pages.flatMap((page) => page.result.nfts) ?? [];
    // Sort Farcaster Pro tokens first
    return nfts.sort(
      (a, b) => (isFarcasterProNFT(b) ? 1 : 0) - (isFarcasterProNFT(a) ? 1 : 0),
    );
  }, [data]);

  const { triggerImpactAsync } = useHaptics();
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setIsRefreshing?.(true);
      triggerImpactAsync();
      await refetch();
    } catch (e) {
      trackError(e);
    } finally {
      setRefreshing(false);
      setIsRefreshing?.(false);
    }
  }, [refetch, triggerImpactAsync, trackError, setIsRefreshing]);

  const renderItem = useCallback(
    ({ item, index }: { item: ApiEthNonFungibleToken; index: number }) => {
      const isInFirstRow = index < COLLECTIONS_COLUMN_COUNT;
      const isPro = isFarcasterProNFT(item);
      const imageUrl = isPro
        ? getFarcasterProNFTImage({ token: item })
        : item.previewUrl || item.imageUrl;

      return (
        <WalletCollectiblesItem
          imageUrl={imageUrl ?? ''}
          name={item.name}
          amount={item.amount}
          imageSize={imageSize}
          onPress={() => onCollectiblePress?.(item)}
          style={{
            marginTop: Platform.OS === 'android' && isInFirstRow ? SPACING : 0,
          }}
          dangerouslyAllowAnimation={isPro}
        />
      );
    },
    [imageSize, onCollectiblePress],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isPending) {
      return (
        <WalletCollectiblesItemsPlaceholder
          imageSize={imageSize}
          columns={COLLECTIONS_COLUMN_COUNT}
          rows={NUM_VISIBLE_ROWS}
        />
      );
    }

    if (isError) {
      return (
        <View
          style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 8 }]}
        >
          <Clock size={24} style={t.texts.tertiary} />
          <Text2 color="secondary" align="center">
            It's taking a little longer than usual to load your collections.
            Please check back shortly.
          </Text2>
        </View>
      );
    }

    if (nfts.length === 0) {
      return (
        <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4]}>
          <Text2 color="secondary" align="center">
            No collectibles yet
          </Text2>
        </View>
      );
    }

    return null;
  }, [isPending, isError, nfts.length, t, imageSize]);

  const keyExtractor = useCallback((item: ApiEthNonFungibleToken) => {
    return `${item.contractAddress}:${item.tokenId}`;
  }, []);

  return (
    <AnimatedFlashList
      data={nfts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={COLLECTIONS_COLUMN_COUNT}
      ListEmptyComponent={ListEmptyComponent}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onScroll={onScroll}
      onLayout={onLayout}
      contentContainerStyle={{
        paddingVertical,
        paddingHorizontal: 6,
      }}
      scrollEnabled={true}
      overScrollMode="never"
      onEndReachedThreshold={0.2}
      onEndReached={() => {
        if (hasNextPage) {
          fetchNextPage();
        }
      }}
      ListFooterComponent={
        isError ? (
          <LoadFailureIndicator retry={onRefresh} />
        ) : hasNextPage && isFetchingNextPage ? (
          <WalletCollectiblesItemsPlaceholder
            imageSize={imageSize}
            columns={COLLECTIONS_COLUMN_COUNT}
            rows={1}
          />
        ) : null
      }
      extraData={extraData}
      ListHeaderComponent={ListHeaderComponent}
      contentOffset={contentOffset}
      showsVerticalScrollIndicator={showVerticalScrollIndicator}
    />
  );
}
