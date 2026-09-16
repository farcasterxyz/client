import { FlashList, FlashListProps, ListRenderItem } from '@shopify/flash-list';
import format from 'date-fns/format';
import isThisMonth from 'date-fns/isThisMonth';
import isThisWeek from 'date-fns/isThisWeek';
import isToday from 'date-fns/isToday';
import {
  ApiChain,
  apiChainDisplayName,
  ApiUser,
  ApiWalletActivity,
  ApiWalletActivityType,
  SUPPORTED_WALLET_CHAINS,
} from 'farcaster-client-data';
import { useWalletActivity } from 'farcaster-client-hooks';
import { Clock, ListFilter } from 'lucide-react-native';
import React, {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ListRenderItem as RNListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { LoadFailureIndicator } from '../../../components/LoadFailureIndicator';
import {
  useEmbeddedWallet,
  useSharedNavigationContext,
  useSharedTelemetry,
  useWalletTransactions,
} from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActiveWallet, useCurrentUserFid, useHaptics } from '../../../hooks';
import {
  useWalletActivityHideMicrotransactions,
  useWalletActivityHideSpam,
  useWalletFidOverride,
} from '../../../hooks/useWalletPreferences';
import { LaunchFrameParams } from '../../../types';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { TokenListItemPlaceholder } from '../../crypto';
import { AnimatedPressable, Text2 } from '../../design-system';
import { LoadingIndicator } from '../../design-system/atoms/LoadingIndicator';
import { WalletScreenHeader } from '../WalletScreenHeader';
import {
  useNavigateToTransactionExplorer,
  WalletActivityApprovalBottomSheet,
  WalletActivityMintBottomSheet,
  WalletActivityReceiveBottomSheet,
  WalletActivitySendBottomSheet,
  WalletActivitySwapBottomSheet,
} from './activity-bottom-sheets';
import { ActivityBottomSheetProvider } from './activity-bottom-sheets/context';
import { ActivityGroupHeader, WalletActivityItem } from './WalletActivityItem';
import { WalletActivitySettingsModal } from './WalletActivitySettingsModal';
import { WalletPendingActivity } from './WalletPendingActivity';
import { WalletTransactions } from './WalletTransactions';

const AnimatedFlashList = Animated.FlatList;

export function WalletActivityBottomSheet({
  item,
  onUserPress,
  onLaunchFrame,
  onDismiss,
}: {
  item: ApiWalletActivity;
  onUserPress?: (user: ApiUser) => void;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onDismiss?: () => void;
}) {
  const bottomSheetRef = useRef<{ dismiss: () => void }>(null);
  const inner = useMemo(() => {
    switch (item.type) {
      case 'send':
        return <WalletActivitySendBottomSheet item={item} />;
      case 'receive':
        return <WalletActivityReceiveBottomSheet item={item} />;
      case 'approve':
        return <WalletActivityApprovalBottomSheet item={item} />;
      case 'swap':
        return <WalletActivitySwapBottomSheet item={item} />;
      case 'mint':
        return <WalletActivityMintBottomSheet item={item} />;
      default:
        return null;
    }
  }, [item]);

  return (
    <AutoDisplayingBottomSheetModal
      name="walletSwapBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      stackBehavior="push"
    >
      <ActivityBottomSheetProvider
        onUserPress={onUserPress}
        onLaunchFrame={onLaunchFrame}
        onDismiss={onDismiss}
      >
        {inner}
      </ActivityBottomSheetProvider>
    </AutoDisplayingBottomSheetModal>
  );
}

const MIN_NUM_ACTIVITIES_TO_FETCH = 15;
const MAX_PAGES_TO_FETCH_AUTO = 20; // Safety limit for auto-fetch to prevent infinite loops

type GroupedActivity = {
  idx: number;
  title: string;
  data: ApiWalletActivity[];
};

const getActivityGroupTitle = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  } else if (isThisWeek(date)) {
    return 'This Week';
  } else if (isThisMonth(date)) {
    return 'This Month';
  } else {
    return format(date, 'MMMM yyyy');
  }
};

const groupActivitiesByDate = (
  activities: ApiWalletActivity[],
): GroupedActivity[] => {
  const groups = new Map<string, ApiWalletActivity[]>();

  for (const activity of activities) {
    const date = new Date(activity.timestamp);
    const title = getActivityGroupTitle(date);

    if (!groups.has(title)) {
      groups.set(title, []);
    }
    groups.get(title)?.push(activity);
  }

  return Array.from(groups.entries()).map(([title, data], idx) => ({
    idx,
    title,
    data,
  }));
};

function RenderedItemWithHeader({
  title,
  data,
  onRowPress,
  rightIcon,
}: {
  title?: string;
  data: ApiWalletActivity[];
  onRowPress?: (item: ApiWalletActivity) => void;
  rightIcon?: React.ReactNode;
}) {
  const activityItems = useMemo(() => {
    return data.map((activity, i) => (
      <WalletActivityItem
        key={`${activity.transaction.txHash}-${i}`}
        item={activity}
        onRowPress={onRowPress}
      />
    ));
  }, [data, onRowPress]);

  return (
    <>
      {!!title && <ActivityGroupHeader title={title} rightIcon={rightIcon} />}
      {activityItems}
    </>
  );
}

export function WalletActivity({
  ListComponent = FlashList,
  onLaunchFrame,
  onUserPress,
}: {
  ListComponent?: ComponentType<FlashListProps<GroupedActivity>>;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onUserPress?: (user: ApiUser) => void;
}) {
  const t = useTheme();
  const { pendingTransactions } = useEmbeddedWallet();
  const [showActivitySettingsModal, setShowActivitySettingsModal] =
    useState(false);
  const [selectedChain, setSelectedChain] = useState<ApiChain>('base');

  const userFid = useCurrentUserFid();
  const [walletFidOverride] = useWalletFidOverride();
  const [hideSpam] = useWalletActivityHideSpam();
  const [hideMicrotransactions] = useWalletActivityHideMicrotransactions();

  const { activeWalletId } = useActiveWallet();

  const fid = useMemo(() => {
    return walletFidOverride ?? userFid;
  }, [userFid, walletFidOverride]);

  const walletId = fid === userFid ? activeWalletId : undefined;

  const {
    data,
    isPending,
    refetch,
    hasNextPage,
    fetchNextPage,
    isError,
    isFetchingNextPage,
  } = useWalletActivity({
    params: {
      fid,
      walletId,
      hideSpam,
      hideMicrotransactions,
      chain: selectedChain,
    },
    enabled: !!fid,
  });
  const { walletTransactions } = useWalletTransactions();

  const filteredPendingTransactions = useMemo(() => {
    return pendingTransactions.filter((tx) => tx.chain === selectedChain);
  }, [pendingTransactions, selectedChain]);

  const filteredWalletTransactions = useMemo(() => {
    return walletTransactions.filter((tx) => tx.chain === selectedChain);
  }, [walletTransactions, selectedChain]);

  // isError isn't cleared when the retry button is pressed so created a separate
  // state-based error so we can clear it on button press so the failure indicator
  // doesn't render.
  const [fetchError, setFetchError] = useState<boolean>(isError);
  useEffect(() => {
    setFetchError(isError);
  }, [isError]);

  useEffect(() => {
    setTimeout(() => {
      void refetch();
    }, 2000);
  }, [pendingTransactions.length, refetch]);

  const activities = useMemo(() => {
    const activities =
      data?.pages.flatMap((page) => page.result.activity) ?? [];

    return activities
      .filter((activity) => {
        const hasPendingTx = filteredPendingTransactions.some(
          (tx) => tx.txHash === activity.transaction.txHash,
        );

        const hasWalletTx = filteredWalletTransactions.some(
          (tx) => tx.txHash === activity.transaction.txHash,
        );

        if (hasPendingTx || hasWalletTx) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        return b.timestamp - a.timestamp;
      });
  }, [data, filteredPendingTransactions, filteredWalletTransactions]);

  const pendingActivities = useMemo(() => {
    return (
      data?.pages
        .flatMap((page) => page.result.activity)
        .filter(
          (activity) =>
            activity.status === 'pending' &&
            filteredPendingTransactions.some(
              (tx) => tx.txHash === activity.transaction.txHash,
            ),
        ) ?? []
    );
  }, [data, filteredPendingTransactions]);

  const groupedActivity = useMemo(() => {
    return groupActivitiesByDate(activities);
  }, [activities]);

  const ListEmptyComponent = useMemo(() => {
    if (isPending) {
      return (
        <View>
          {Array.from({ length: 8 }).map((_, index) => (
            <TokenListItemPlaceholder key={index} />
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View
          style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 8 }]}
        >
          <Clock size={24} style={t.texts.tertiary} />
          <Text2 color="secondary" align="center">
            It's taking a little longer than usual to load your activity. Please
            check back shortly.
          </Text2>
        </View>
      );
    }

    if (
      activities.length === 0 &&
      filteredPendingTransactions.length === 0 &&
      filteredWalletTransactions.length === 0
    ) {
      return (
        <View style={[t.itemsCenter, t.justifyCenter, { paddingTop: 60 }]}>
          <Text2 color="secondary" align="center">
            No transactions found
          </Text2>
        </View>
      );
    }

    return null;
  }, [
    isPending,
    isError,
    activities.length,
    filteredPendingTransactions.length,
    filteredWalletTransactions.length,
    t,
  ]);

  const { triggerImpactAsync } = useHaptics();
  const activitySettingsToggle = useMemo(() => {
    return (
      <View style={[t.itemsEnd]}>
        <AnimatedPressable
          onPress={() => {
            triggerImpactAsync();
            setShowActivitySettingsModal((prev) => !prev);
          }}
          color="transparent"
          style={[t.p1, t.roundedFull]}
        >
          <ListFilter size={20} style={t.texts.primary} />
        </AnimatedPressable>
      </View>
    );
  }, [triggerImpactAsync, t.p1, t.roundedFull, t.texts.primary, t.itemsEnd]);
  const [pressedItem, setPressedItem] = useState<ApiWalletActivity | null>(
    null,
  );
  const navigateToTransactionExplorer = useNavigateToTransactionExplorer();
  const onHandleRowPress = useCallback(
    (item: ApiWalletActivity) => {
      // Only show bottom sheet for certain activity types
      const compatibleWithBottomSheet = new Set<ApiWalletActivityType>([
        'send',
        'receive',
        'approve',
        'swap',
        'mint',
      ]);
      if (!compatibleWithBottomSheet.has(item.type)) {
        navigateToTransactionExplorer(item);
        return;
      }

      setPressedItem(item);
    },
    [navigateToTransactionExplorer],
  );

  const renderItemWithHeader = useCallback<ListRenderItem<GroupedActivity>>(
    ({ item: group }) => {
      return (
        <RenderedItemWithHeader
          title={group.title === 'Today' ? undefined : group.title}
          data={group.data}
          onRowPress={onHandleRowPress}
        />
      );
    },
    [onHandleRowPress],
  );

  // On the backend, we filter out spam activities AFTER fetching the data.
  // This means that the number of activities in the response may be less than
  // the number requested, even if there are more activities to fetch.
  useEffect(() => {
    const pagesFetched = data?.pages.length ?? 0;
    if (
      !isFetchingNextPage &&
      hasNextPage &&
      activities.length < MIN_NUM_ACTIVITIES_TO_FETCH &&
      pagesFetched < MAX_PAGES_TO_FETCH_AUTO
    ) {
      fetchNextPage();
    }
  }, [
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    activities,
    data?.pages.length,
  ]);

  const handleEndReached = React.useCallback(() => {
    setFetchError(false);
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const ListHeaderComponent = useMemo(() => {
    const showTodayHeader =
      filteredPendingTransactions.length > 0 ||
      filteredWalletTransactions.length > 0 ||
      (groupedActivity[0]?.title === 'Today' &&
        groupedActivity[0]?.data.length > 0);
    return (
      <>
        <ChainSelectorChips
          selectedChain={selectedChain}
          onSelectChain={setSelectedChain}
        />
        {showTodayHeader && <ActivityGroupHeader title="Today" />}
        <WalletTransactions transactions={filteredWalletTransactions} />
        <WalletPendingActivity
          transactions={filteredPendingTransactions}
          activities={pendingActivities}
        />
      </>
    );
  }, [
    filteredPendingTransactions,
    filteredWalletTransactions,
    groupedActivity,
    pendingActivities,
    selectedChain,
  ]);

  const { goBack } = useSharedNavigationContext();

  const [refreshing, setRefreshing] = useState(false);
  const { trackError } = useSharedTelemetry();
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      triggerImpactAsync();
      await refetch();
    } catch (e) {
      trackError(e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, triggerImpactAsync, trackError]);

  return (
    <View style={[t.flex1]}>
      <WalletScreenHeader
        title="Activity"
        onBackCallback={goBack}
        style={[t.pT2]}
        rightIcon={activitySettingsToggle}
      />
      <ListComponent
        data={groupedActivity}
        renderItem={renderItemWithHeader}
        contentContainerStyle={{ paddingBottom: 12 }}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={
          fetchError ? (
            <LoadFailureIndicator retry={handleEndReached} />
          ) : hasNextPage && !isPending && isFetchingNextPage ? (
            <View style={[t.h36, t.mT8]}>
              <LoadingIndicator />
            </View>
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      {pressedItem && (
        <WalletActivityBottomSheet
          item={pressedItem}
          onUserPress={onUserPress}
          onLaunchFrame={onLaunchFrame}
          onDismiss={() => setPressedItem(null)}
        />
      )}
      {showActivitySettingsModal && (
        <WalletActivitySettingsModal
          onDismiss={() => setShowActivitySettingsModal(false)}
        />
      )}
    </View>
  );
}

export function WalletActivityV2({
  onLaunchFrame,
  onUserPress,
  onScroll,
  onLayout,
  extraData,
  ListHeaderComponent,
  contentOffset,
  setIsRefreshing,
  showVerticalScrollIndicator = true,
}: {
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onUserPress?: (user: ApiUser) => void;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout?: () => void;
  extraData?: boolean[];
  ListHeaderComponent?: React.ReactElement;
  contentOffset?: { x: number; y: number };
  setIsRefreshing?: (isRefreshing: boolean) => void;
  showVerticalScrollIndicator?: boolean;
}) {
  return (
    <ActivityBottomSheetProvider
      onUserPress={onUserPress}
      onLaunchFrame={onLaunchFrame}
      onDismiss={undefined}
    >
      <WalletActivityV2Inner
        onLaunchFrame={onLaunchFrame}
        onUserPress={onUserPress}
        onScroll={onScroll}
        onLayout={onLayout}
        extraData={extraData}
        ListHeaderComponent={ListHeaderComponent}
        contentOffset={contentOffset}
        setIsRefreshing={setIsRefreshing}
        showVerticalScrollIndicator={showVerticalScrollIndicator}
      />
    </ActivityBottomSheetProvider>
  );
}

const WalletActivityV2Inner = React.memo(
  ({
    onLaunchFrame,
    onUserPress,
    onScroll,
    onLayout,
    extraData,
    ListHeaderComponent,
    contentOffset,
    setIsRefreshing,
    showVerticalScrollIndicator,
  }: {
    onLaunchFrame?: (frame: LaunchFrameParams) => void;
    onUserPress?: (user: ApiUser) => void;
    onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onLayout?: () => void;
    extraData?: boolean[];
    ListHeaderComponent?: React.ReactElement;
    contentOffset?: { x: number; y: number };
    setIsRefreshing?: (isRefreshing: boolean) => void;
    showVerticalScrollIndicator?: boolean;
  }) => {
    const t = useTheme();
    const { pendingTransactions } = useEmbeddedWallet();
    const [showActivitySettingsModal, setShowActivitySettingsModal] =
      useState(false);
    const [selectedChain, setSelectedChain] = useState<ApiChain>('base');

    const userFid = useCurrentUserFid();
    const [walletFidOverride] = useWalletFidOverride();
    const [hideSpam] = useWalletActivityHideSpam();
    const [hideMicrotransactions] = useWalletActivityHideMicrotransactions();

    const { activeWalletId } = useActiveWallet();

    const fid = useMemo(() => {
      return walletFidOverride ?? userFid;
    }, [userFid, walletFidOverride]);

    const walletId = fid === userFid ? activeWalletId : undefined;

    const {
      data,
      isPending,
      refetch,
      hasNextPage,
      fetchNextPage,
      isError,
      isFetchingNextPage,
    } = useWalletActivity({
      params: {
        fid,
        walletId,
        hideSpam,
        hideMicrotransactions,
        chain: selectedChain,
      },
      enabled: !!fid,
    });
    const { walletTransactions } = useWalletTransactions();

    const filteredPendingTransactions = useMemo(() => {
      return pendingTransactions.filter((tx) => tx.chain === selectedChain);
    }, [pendingTransactions, selectedChain]);

    const filteredWalletTransactions = useMemo(() => {
      return walletTransactions.filter((tx) => tx.chain === selectedChain);
    }, [walletTransactions, selectedChain]);

    // isError isn't cleared when the retry button is pressed so created a separate
    // state-based error so we can clear it on button press so the failure indicator
    // doesn't render.
    const [fetchError, setFetchError] = useState<boolean>(isError);
    useEffect(() => {
      setFetchError(isError);
    }, [isError]);

    useEffect(() => {
      setTimeout(() => {
        void refetch();
      }, 2000);
    }, [pendingTransactions.length, refetch]);

    const activities = useMemo(() => {
      const activities =
        data?.pages.flatMap((page) => page.result.activity) ?? [];

      return activities
        .filter((activity) => {
          const hasPendingTx = filteredPendingTransactions.some(
            (tx) => tx.txHash === activity.transaction.txHash,
          );

          const hasWalletTx = filteredWalletTransactions.some(
            (tx) => tx.txHash === activity.transaction.txHash,
          );

          if (hasPendingTx || hasWalletTx) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          return b.timestamp - a.timestamp;
        });
    }, [data, filteredPendingTransactions, filteredWalletTransactions]);

    const pendingActivities = useMemo(() => {
      return (
        data?.pages
          .flatMap((page) => page.result.activity)
          .filter(
            (activity) =>
              activity.status === 'pending' &&
              filteredPendingTransactions.some(
                (tx) => tx.txHash === activity.transaction.txHash,
              ),
          ) ?? []
      );
    }, [data, filteredPendingTransactions]);

    const groupedActivity = useMemo(() => {
      return groupActivitiesByDate(activities);
    }, [activities]);

    const ListEmptyComponent = useMemo(() => {
      if (isPending) {
        return (
          <View>
            {Array.from({ length: 8 }).map((_, index) => (
              <TokenListItemPlaceholder key={index} />
            ))}
          </View>
        );
      }

      if (isError) {
        return (
          <View
            style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 8 }]}
          >
            <Clock size={24} style={t.texts.tertiary} />
            <Text2 color="secondary" align="center">
              It's taking a little longer than usual to load your activity.
              Please check back shortly.
            </Text2>
          </View>
        );
      }

      if (
        activities.length === 0 &&
        filteredPendingTransactions.length === 0 &&
        filteredWalletTransactions.length === 0
      ) {
        return (
          <View style={[t.itemsCenter, t.justifyCenter, { paddingTop: 60 }]}>
            <Text2 color="secondary" align="center">
              No transactions found
            </Text2>
          </View>
        );
      }

      return null;
    }, [
      isPending,
      isError,
      activities.length,
      filteredPendingTransactions.length,
      filteredWalletTransactions.length,
      t,
    ]);

    const { triggerImpactAsync } = useHaptics();
    const activitySettingsToggle = useMemo(() => {
      return (
        <View style={[t.itemsEnd]}>
          <AnimatedPressable
            onPress={() => {
              triggerImpactAsync();
              setShowActivitySettingsModal((prev) => !prev);
            }}
            color="transparent"
            style={[t.p1, t.roundedFull]}
          >
            <ListFilter size={20} style={t.texts.primary} />
          </AnimatedPressable>
        </View>
      );
    }, [triggerImpactAsync, t.p1, t.roundedFull, t.texts.primary, t.itemsEnd]);
    const [pressedItem, setPressedItem] = useState<ApiWalletActivity | null>(
      null,
    );
    const navigateToTransactionExplorer = useNavigateToTransactionExplorer();
    const onHandleRowPress = useCallback(
      (item: ApiWalletActivity) => {
        // Only show bottom sheet for certain activity types
        const compatibleWithBottomSheet = new Set<ApiWalletActivityType>([
          'send',
          'receive',
          'approve',
          'swap',
          'mint',
        ]);
        if (!compatibleWithBottomSheet.has(item.type)) {
          navigateToTransactionExplorer(item);
          return;
        }

        setPressedItem(item);
      },
      [navigateToTransactionExplorer],
    );

    const renderItemWithHeader = useCallback<RNListRenderItem<GroupedActivity>>(
      ({ item: group, index }) => {
        return (
          <RenderedItemWithHeader
            title={group.title === 'Today' ? undefined : group.title}
            data={group.data}
            onRowPress={onHandleRowPress}
            rightIcon={
              group.title !== 'Today' && index === 0
                ? activitySettingsToggle
                : undefined
            }
          />
        );
      },
      [onHandleRowPress, activitySettingsToggle],
    );

    // On the backend, we filter out spam activities AFTER fetching the data.
    // This means that the number of activities in the response may be less than
    // the number requested, even if there are more activities to fetch.
    useEffect(() => {
      const pagesFetched = data?.pages.length ?? 0;
      if (
        !isFetchingNextPage &&
        hasNextPage &&
        activities.length < MIN_NUM_ACTIVITIES_TO_FETCH &&
        pagesFetched < MAX_PAGES_TO_FETCH_AUTO
      ) {
        fetchNextPage();
      }
    }, [
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      activities,
      data?.pages.length,
    ]);

    const handleEndReached = React.useCallback(() => {
      setFetchError(false);
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const ListHeaderComponentInner = useMemo(() => {
      const showTodayHeader =
        filteredPendingTransactions.length > 0 ||
        filteredWalletTransactions.length > 0 ||
        (groupedActivity[0]?.title === 'Today' &&
          groupedActivity[0]?.data.length > 0);
      return (
        <>
          {ListHeaderComponent}
          <ChainSelectorChips
            selectedChain={selectedChain}
            onSelectChain={setSelectedChain}
          />
          {showTodayHeader && (
            <ActivityGroupHeader
              title="Today"
              rightIcon={activitySettingsToggle}
            />
          )}
          <WalletTransactions transactions={filteredWalletTransactions} />
          <WalletPendingActivity
            transactions={filteredPendingTransactions}
            activities={pendingActivities}
          />
        </>
      );
    }, [
      filteredPendingTransactions,
      filteredWalletTransactions,
      groupedActivity,
      pendingActivities,
      selectedChain,
      activitySettingsToggle,
      ListHeaderComponent,
    ]);

    const [refreshing, setRefreshing] = useState(false);
    const { trackError } = useSharedTelemetry();
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

    return (
      <>
        <AnimatedFlashList
          data={groupedActivity}
          renderItem={renderItemWithHeader}
          contentContainerStyle={{ paddingBottom: 12 }}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={ListHeaderComponentInner}
          ListFooterComponent={
            fetchError ? (
              <LoadFailureIndicator retry={handleEndReached} />
            ) : hasNextPage && !isPending && isFetchingNextPage ? (
              <View style={[t.h36, t.mT8]}>
                <LoadingIndicator />
              </View>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={onScroll}
          onLayout={onLayout}
          extraData={extraData}
          contentOffset={contentOffset}
          showsVerticalScrollIndicator={showVerticalScrollIndicator}
        />
        {pressedItem && (
          <WalletActivityBottomSheet
            item={pressedItem}
            onUserPress={onUserPress}
            onLaunchFrame={onLaunchFrame}
            onDismiss={() => setPressedItem(null)}
          />
        )}
        {showActivitySettingsModal && (
          <WalletActivitySettingsModal
            onDismiss={() => setShowActivitySettingsModal(false)}
          />
        )}
      </>
    );
  },
);

const SUPPORTED_ACTIVITY_CHAINS: ApiChain[] = SUPPORTED_WALLET_CHAINS.filter(
  (chain) => chain.type === 'mainnet',
).map((chain) => chain.id);

function ChainSelectorChips({
  selectedChain,
  onSelectChain,
}: {
  selectedChain: ApiChain;
  onSelectChain: (chain: ApiChain) => void;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        t.flexRow,
        { gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
      ]}
      keyboardShouldPersistTaps="always"
    >
      {SUPPORTED_ACTIVITY_CHAINS.map((chain) => {
        const selected = selectedChain === chain;
        return (
          <AnimatedPressable
            key={chain}
            onPress={() => {
              triggerImpactAsync();
              onSelectChain(chain);
            }}
          >
            <View
              style={[
                t.flex,
                t.itemsCenter,
                {
                  gap: 4,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                  borderWidth: 1.5,
                },
                selected ? t.backgrounds.brandLight : t.backgrounds.default,
                selected ? t.borders.highlight : t.borders.primary,
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
                {apiChainDisplayName(chain)}
              </Text2>
            </View>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}
