import { FlashList } from '@shopify/flash-list';
import { ApiCast } from 'farcaster-client-data';
import { useUserCastCollectibles } from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Text2,
  useHaptics,
  useWalletTransactions,
  WalletCollectiblesItemsPlaceholder,
} from 'farcaster-expo';
import React from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { Empty } from '~/components/Empty';
import { usePush } from '~/hooks/navigation/usePush';
import { trackError } from '~/utils/ErrorUtils';

import { CollectibleCastArtifact } from './CollectibleCastArtifact';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedFlashList = Animated.FlatList;

const PADDING = 6;
const COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - PADDING * 2) / COLUMNS - PADDING * 2;
const LIST_BATCH_SIZE = 12;
const SCROLL_DEBOUNCE_MS = Platform.select({ default: 50, android: 150 });

export function CollectibleCastCollection({
  fid,
  onScroll,
  extraData,
  ListHeaderComponent,
  contentOffset,
  ListComponent = AnimatedFlashList,
  emptyMessage,
  includeTransactions,
  setIsRefreshing,
  onLayout,
}: {
  fid: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  extraData?: boolean[];
  ListHeaderComponent?: React.ReactElement;
  contentOffset?: { x: number; y: number };
  ListComponent?: typeof AnimatedFlashList | typeof FlashList;
  emptyMessage: string;
  includeTransactions?: boolean;
  setIsRefreshing?: (isRefreshing: boolean) => void;
  onLayout?: () => void;
}) {
  const { data, isPending, refetch } = useUserCastCollectibles({ fid });
  const [refreshing, setRefreshing] = React.useState(false);
  const { walletTransactions } = useWalletTransactions();

  const { triggerImpactAsync } = useHaptics();
  const onRefresh = React.useCallback(async () => {
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
  }, [refetch, triggerImpactAsync, setIsRefreshing]);

  const all = React.useMemo(() => {
    const owned = data?.owned ?? [];
    const bids = data?.bids ?? [];
    if (includeTransactions && walletTransactions) {
      for (const tx of walletTransactions) {
        const metadata = tx.metadata;
        if (metadata.type !== 'bid') {
          continue;
        }
        const bid = bids.find((bid) => bid.hash === metadata.cast.hash);
        const own = owned.find((own) => own.hash === metadata.cast.hash);
        if (!bid && !own) {
          bids.push(metadata.cast);
        }
      }
    }
    return [
      ...bids.sort((a, b) => {
        const aEnd =
          a.collectible?.state === 'auction-active'
            ? a.collectible.auction.end
            : 0;
        const bEnd =
          b.collectible?.state === 'auction-active'
            ? b.collectible.auction.end
            : 0;
        return bEnd - aEnd;
      }),
      ...owned.sort((a, b) => b.timestamp - a.timestamp),
    ];
  }, [data, includeTransactions, walletTransactions]);

  const renderItem = React.useCallback(({ item }: { item: ApiCast }) => {
    return <CollectibleCastItem cast={item} />;
  }, []);

  const ListEmptyComponent = React.useMemo(() => {
    if (isPending) {
      return (
        <View style={{ paddingVertical: PADDING }}>
          <WalletCollectiblesItemsPlaceholder
            imageSize={ITEM_SIZE}
            columns={COLUMNS}
            rows={3}
          />
        </View>
      );
    }
    if (all?.length === 0) {
      return <Empty message={''} justify="start" subMessage={emptyMessage} />;
    }
    return <Empty message={''} justify="start" subMessage={emptyMessage} />;
  }, [all, emptyMessage, isPending]);

  const contentContainerStyle = React.useMemo(() => {
    return {
      paddingTop: ListHeaderComponent ? 0 : PADDING * 2,
      paddingBottom: PADDING * 2,
      paddingHorizontal: PADDING,
    };
  }, [ListHeaderComponent]);

  const resolvedListHeaderComponent = React.useMemo(() => {
    if (!ListHeaderComponent) {
      return undefined;
    }

    return (
      <View style={{ marginHorizontal: -PADDING }}>{ListHeaderComponent}</View>
    );
  }, [ListHeaderComponent]);

  const [displayLimit, setDisplayLimit] = React.useState(LIST_BATCH_SIZE);
  const itemsLength = Math.min(all.length, displayLimit);

  // Use useDeferredValue to defer non-critical updates
  const deferredAllItems = React.useDeferredValue(all);

  const displayedItems = React.useMemo(
    () => deferredAllItems.slice(0, itemsLength),
    [deferredAllItems, itemsLength],
  );

  const handleEndReachedTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  React.useEffect(() => {
    return () => {
      if (handleEndReachedTimeoutRef.current) {
        clearTimeout(handleEndReachedTimeoutRef.current);
      }
    };
  }, []);

  const handleEndReached = React.useCallback(() => {
    if (handleEndReachedTimeoutRef.current) {
      clearTimeout(handleEndReachedTimeoutRef.current);
    }

    // Debounce with a small delay to batch multiple rapid calls
    handleEndReachedTimeoutRef.current = setTimeout(() => {
      React.startTransition(() => {
        setDisplayLimit(all.length);
      });
    }, SCROLL_DEBOUNCE_MS);
  }, [all.length]);

  return (
    <ListComponent
      data={displayedItems}
      numColumns={COLUMNS}
      renderItem={renderItem}
      contentContainerStyle={contentContainerStyle}
      onScroll={onScroll}
      extraData={extraData}
      contentOffset={contentOffset}
      ListHeaderComponent={resolvedListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      onEndReached={handleEndReached}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onLayout={onLayout}
    />
  );
}

function CollectibleCastItem({ cast }: { cast: ApiCast }) {
  const push = usePush();

  const contentContainerStyle = React.useMemo(() => {
    return {
      marginHorizontal: PADDING,
      marginBottom: PADDING * 2,
    };
  }, []);

  const onCollectibleCastItemPress = React.useCallback(() => {
    push('CollectibleCast', {
      castHash: cast.hash,
      username: cast.author.username,
    });
  }, [cast.author.username, cast.hash, push]);

  return (
    <AnimatedPressable onPress={onCollectibleCastItemPress}>
      <View style={contentContainerStyle}>
        <CollectibleCastArtifact
          cast={cast}
          size={ITEM_SIZE}
          enableParallax={false}
          shadowed={false}
          variant="thumbnail"
        />
      </View>
      {cast.collectible?.state === 'auction-active' && (
        <>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 16,
                marginLeft: PADDING + 10,
                marginTop: 10,
                gap: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 50,
                  height: 25,
                  backgroundColor: '#E8F5E9',
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#43B748',
                  borderRadius: 100,
                }}
              />
              <Text2 weight="medium" size="xs" style={{ color: '#43B748' }}>
                Live
              </Text2>
            </View>
          </View>
        </>
      )}
    </AnimatedPressable>
  );
}
