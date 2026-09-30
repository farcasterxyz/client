import { useFocusEffect } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNotificationGroup } from 'farcaster-client-data';
import {
  buildNotificationsForTabKey,
  EventingProvider,
  useCheckIfRecentlyPrefetched,
  useNotificationsForTab,
  useRefreshNotificationsForTabFirstPage,
  useSetLastCheckedTimestamp,
  useUnseen,
} from 'farcaster-client-hooks';
import { hitSlopSm, Text2 } from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import { XIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AppState,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';

import { Empty } from '~/components/Empty';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { NewVersionAvailableFeedIndicator } from '~/components/NewVersionAvailableFeedIndicator';
import { NotificationGroup } from '~/components/NotificationGroup';
import { Switch } from '~/components/Switch';
import { topBarHeight } from '~/components/TopBar';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { enablePushNotificationsPromptInfoKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useNotificationsInboxPrefetch } from '~/contexts/NotificationsInboxPrefetchProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshNotificationsForTab } from '~/hooks/data/usePullToRefreshNotificationsForTab';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';
import { useScrollToTopWithOffset } from '~/hooks/useScrollToTopWithOffset';
import {
  setInlinePromptedForPushes,
  setPromptedForPushes,
  shouldInlinePromptForPushes,
  shouldPromptForPushes,
} from '~/utils/FastStorageUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { openWarpcastSettings } from '~/utils/UrlUtils';

interface NotificationsTabProps {
  tab: string;
  isLinkedToUnseen: boolean;
  enabled: boolean;
}

export function NotificationsTab(props: NotificationsTabProps) {
  return props.enabled ? (
    <React.Suspense fallback={<LoadingIndicator style={[{ marginTop: 16 }]} />}>
      <EventingProvider on={`notifications-${props.tab}`}>
        <NotificationsTabInner {...props} />
      </EventingProvider>
    </React.Suspense>
  ) : (
    <LoadingIndicator style={[{ marginTop: 16 }]} />
  );
}

// NEYN-11640: suppress the GlobalPrompts push-notification nudge in
// E2E builds. NotificationsTab's useFocusEffect would otherwise mount
// `enablePushNotificationsPromptInfoKey` over the bottom tab bar the
// first time the user opens Notifications, which makes the Maestro
// `rapid-tab-switch` flow's subsequent DirectCastsTab tap unreachable
// (run 27238135541). Matches the env-var gate already used by
// hooks/pushNotifications/useRequestNotificationsPermission.ts.
const isNotificationPromptDisabled =
  process.env.EXPO_PUBLIC_DISABLE_NOTIFICATION_PROMPT === '1';

function NotificationsTabInner({
  tab,
  isLinkedToUnseen,
}: NotificationsTabProps) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { resetNotificationsCount, resetNotificationTabUnseenStatus } =
    useUnseen();
  const { triggerImpactAsync } = useHaptics();

  const { data, fetchNextPage, refetch, hasNextPage, isFetchingNextPage } =
    useNotificationsForTab({
      tab,
      setLastCheckedTimestamp: false,
    });

  const setLastCheckedTimestamp = useSetLastCheckedTimestamp();

  const [shouldBlockRefreshOnFocus, setShouldBlockRefreshOnFocus] =
    React.useState<boolean>(false);

  // Mirror the scroll-position guard into a ref so the focus/foreground refresh
  // callback can read it without depending on the state (which would re-run the
  // focus effect every time the user crosses the scroll threshold).
  const isScrolledIntoListRef = useRef(false);

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const isScrolledIn = e.nativeEvent.contentOffset.y >= 225;
      isScrolledIntoListRef.current = isScrolledIn;
      setShouldBlockRefreshOnFocus(isScrolledIn);
    },
    [],
  );

  const setIsRefreshingRef = useRef<(refreshing: boolean) => void>(() => {});

  const refetchAndClearUnseen = useCallback(async () => {
    if (shouldBlockRefreshOnFocus) {
      return;
    }

    triggerImpactAsync();
    setIsRefreshingRef.current(true);

    try {
      await refetch();
    } finally {
      resetNotificationsCount();
      resetNotificationTabUnseenStatus(tab);
      setLastCheckedTimestamp();

      // Ensure we always hide the spinner once the fetch completes (successfully or with error)
      setIsRefreshingRef.current(false);
    }
  }, [
    refetch,
    resetNotificationTabUnseenStatus,
    resetNotificationsCount,
    setLastCheckedTimestamp,
    shouldBlockRefreshOnFocus,
    tab,
    triggerImpactAsync,
  ]);

  // Pull-to-refresh setup. Now that refetchAndClearUnseen is defined we can create the refresh control
  const { refreshControl, setIsRefreshing, isRefreshing } =
    usePullToRefreshNotificationsForTab({
      tab,
      refetch: refetchAndClearUnseen,
    });

  // Store up-to-date setter in ref so programmatic refresh can use it
  useEffect(() => {
    setIsRefreshingRef.current = setIsRefreshing;
  }, [setIsRefreshing]);

  // The notification list is a separate suspense query from the unread badge,
  // and nothing invalidates it when notifications arrive (the badge updates via
  // WebSocket/poll, the list does not). Because the tab stays mounted for the
  // session, the list can sit frozen indefinitely — newly arrived notifications
  // never enter it. Silently pull a fresh first page when the tab regains focus
  // or the app returns to the foreground, gated on staleness and skipped while
  // the user is scrolled into the list so we never yank content out from under
  // them.
  const refreshListFirstPage = useRefreshNotificationsForTabFirstPage(
    tab,
    refetch,
  );
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();
  const notificationsQueryKey = useMemo(
    () => buildNotificationsForTabKey({ tab }),
    [tab],
  );

  const refreshListFirstPageIfStale = useCallback(() => {
    if (isScrolledIntoListRef.current) {
      return;
    }
    if (checkIfRecentlyPrefetched({ queryKey: notificationsQueryKey })) {
      return;
    }
    void refreshListFirstPage();
  }, [checkIfRecentlyPrefetched, notificationsQueryKey, refreshListFirstPage]);

  const { block } = useNotificationsInboxPrefetch();
  const { showGlobalPrompt } = useGlobalPrompts();
  const { permission } = usePushNotificationPermission();

  const eligibleForPushes =
    !isNotificationPromptDisabled &&
    shouldPromptForPushes() &&
    (typeof permission === 'undefined' ||
      (permission.status !== 'granted' && permission.canAskAgain));

  const eligibleForInlinePushes =
    !eligibleForPushes &&
    shouldInlinePromptForPushes() &&
    (typeof permission === 'undefined' ||
      (permission.status !== 'granted' && permission.canAskAgain));

  useFocusEffect(
    useCallback(() => {
      if (isLinkedToUnseen) {
        setLastCheckedTimestamp();
        resetNotificationsCount();
      }

      if (tab === 'channels' || tab === 'apps') {
        resetNotificationTabUnseenStatus(tab);
      }

      trackEvent(AnalyticsEvent.ViewNotifications, { tab });

      if (eligibleForPushes) {
        setPromptedForPushes();
        showGlobalPrompt({ key: enablePushNotificationsPromptInfoKey });
      }

      // Refresh the list now that we're focused, and keep it fresh while
      // focused by also refreshing whenever the app returns to the foreground.
      refreshListFirstPageIfStale();
      const appStateSubscription = AppState.addEventListener(
        'change',
        (nextAppState) => {
          if (nextAppState === 'active') {
            refreshListFirstPageIfStale();
          }
        },
      );

      const unblock = isLinkedToUnseen ? block() : undefined;

      return () => {
        appStateSubscription.remove();
        unblock?.();
      };
    }, [
      block,
      eligibleForPushes,
      isLinkedToUnseen,
      refreshListFirstPageIfStale,
      resetNotificationTabUnseenStatus,
      resetNotificationsCount,
      setLastCheckedTimestamp,
      showGlobalPrompt,
      tab,
      trackEvent,
    ]),
  );

  const extraData = useCommonFlatListExtraData();
  const flatListRef = useRef<FlashListRef<ApiNotificationGroup>>(null);

  // Temporarily storing ununiqued groups as a variable, so we can pass it to useReportErrorOnDuplicateKeys.
  // This should let us know that there is an issue with API data without breaking the UI for the user (because we uniquify later).
  const ununiquedGroups: ApiNotificationGroup[] = useMemo(
    () => data?.pages.flatMap((page) => page.result.notifications) || [],
    [data],
  );

  const groups = useMemo(
    () => uniqBy(ununiquedGroups, keyExtractor),
    [ununiquedGroups],
  );

  // Synchronous guard: isFetchingNextPage is React state and won't be true
  // until the next render, so without this ref a second onEndReached firing
  // before that render would call fetchNextPage twice.
  const pendingFetchRef = React.useRef(false);

  // FlashList can fire onEndReached repeatedly while the end stays in range, so
  // both pendingFetchRef and isFetchingNextPage gate against overlapping
  // fetches; pagination naturally stops once hasNextPage is false.
  const handleEndReached = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || pendingFetchRef.current) {
      return;
    }
    pendingFetchRef.current = true;
    void fetchNextPage().finally(() => {
      pendingFetchRef.current = false;
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useScrollToTopWithOffset(flatListRef, -topBarHeight, () => {
    if (!isRefreshing) {
      refetchAndClearUnseen();
    }
  });

  // Always render a fixed-height footer so the list content height never
  // changes when isFetchingNextPage toggles. Toggling between null and a 44px
  // View causes a layout shift that makes the last visible row jump.
  const ListFooterComponent = React.useMemo(() => {
    return (
      <View style={[t.h36, t.mT8]}>
        {isFetchingNextPage && <LoadingIndicator />}
      </View>
    );
  }, [isFetchingNextPage, t.h36, t.mT8]);

  const scrollIndicatorInsets = React.useMemo(() => ({ right: 1 }), []);

  const ListHeaderComponent = React.useMemo(() => {
    if (eligibleForInlinePushes) {
      return <InlinePushNotificationsNudge />;
    }

    return <NewVersionAvailableFeedIndicator />;
  }, [eligibleForInlinePushes]);

  if (groups.length === 0) {
    return (
      <Empty message="No notifications yet." refresh={refetchAndClearUnseen} />
    );
  }

  return (
    <View style={[t.hFull]}>
      <FlashList
        scrollIndicatorInsets={scrollIndicatorInsets}
        ListHeaderComponent={ListHeaderComponent}
        data={groups}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        ref={flatListRef}
        onScroll={onScroll}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListFooterComponent={ListFooterComponent}
        {...STANDARD_FLASHLIST_PERF_PROPS}
      />
    </View>
  );
}

function InlinePushNotificationsNudge() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const requestNotificationsPermission = useRequestNotificationsPermission();

  const [value, setValue] = React.useState(false);

  const onAsked = React.useCallback(() => {
    trackEvent(
      AnalyticsEvent.EnabledPushNotificationsOnInlineNotifRowAsked,
      undefined,
    );
  }, [trackEvent]);

  const onGranted = React.useCallback(() => {
    trackEvent(
      AnalyticsEvent.EnabledPushNotificationsOnInlineNotifRowGranted,
      undefined,
    );

    setValue(true);
  }, [trackEvent]);

  const onValueChange = React.useCallback(() => {
    trackEvent(
      AnalyticsEvent.EnabledPushNotificationsOnInlineNotifRow,
      undefined,
    );

    setInlinePromptedForPushes();

    requestNotificationsPermission({ onAsked, onGranted });
  }, [onAsked, onGranted, requestNotificationsPermission, trackEvent]);

  const onDismissPress = React.useCallback(() => {
    trackEvent(
      AnalyticsEvent.DismissedPushNotificationsOnInlineNotifRow,
      undefined,
    );

    setInlinePromptedForPushes();

    setValue(true);
  }, [trackEvent]);

  if (value) {
    return null;
  }

  return (
    <View style={[t.flex, t.flexCol, t.bgLightPurple, t.p3, t.wFull]}>
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween, t.mB3]}>
        <Text2 color="primary" size="base" weight="semibold">
          Notifications Disabled
        </Text2>
        <Pressable onPress={onDismissPress} hitSlop={hitSlopSm}>
          <XIcon color={t.colors.text.secondary} size={16} />
        </Pressable>
      </View>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.wFull,
          t.pR3,
        ]}
      >
        <Text2 style={[t.flex1]} color="secondary" size="sm">
          Get notified when people are trying to reach you on Farcaster. You can
          customize or disable this at any time.
        </Text2>
        <Switch newColors value={value} onValueChange={onValueChange} />
      </View>
    </View>
  );
}

function useRequestNotificationsPermission() {
  return async ({
    onAsked,
    onGranted,
  }: {
    onAsked: () => void;
    onGranted: () => void;
  }) => {
    const permissions = await Notifications.getPermissionsAsync();

    if (permissions?.status === 'denied' && !permissions.canAskAgain) {
      openWarpcastSettings();
    }

    if (!Device.isDevice || permissions?.status === 'granted') {
      return;
    }

    onAsked();

    const res = await Notifications.requestPermissionsAsync();

    if (res.granted) {
      onGranted();
    }
  };
}

const renderItem = ({ item }: { item: ApiNotificationGroup }) => (
  <NotificationGroup group={item} />
);

const keyExtractor = (group: ApiNotificationGroup) => group.id;

// Let FlashList recycle cells per notification type so heterogeneous rows
// (cast replies with embeds vs. follow rows) don't reuse mismatched layouts.
const getItemType = (group: ApiNotificationGroup) => group.type;
