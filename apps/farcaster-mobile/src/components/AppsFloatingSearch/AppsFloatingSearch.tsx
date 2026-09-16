import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import {
  useDebouncedState,
  useRecentlyUsedApps,
  useSearchMiniApps,
  useSearchMiniAppsForAutocomplete,
  useTopFrames,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { AnimatedPressable, TypographyBody } from 'farcaster-expo';
import { X } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  AppListItem,
  AppListItemSkeleton,
} from '~/components/Apps/AppListItem';
import { RecentAppsCarousel } from '~/components/Apps/RecentAppsCarousel';
import { DefaultEmptyListView } from '~/components/DefaultEmptyListView';
import { FloatingSearchPressable } from '~/components/FloatingSearch/FloatingSearchPressable';
import {
  SEARCH_ICON_INPUT_SIZE,
  SEARCH_RESULTS_Z_INDEX,
} from '~/components/FloatingSearch/ZIndexLookup';
import { BrowserSearchIcon } from '~/components/icons';
import { Text } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useMinimizedInAppBrowser } from '~/contexts/MinimizedInAppBrowserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { isValidHttpsUrl } from '~/utils/DeepLinkUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
type AppsFloatingSearchMode = 'preview' | 'results';

const FLOATING_SEARCH_BOTTOM_SPACING = 80;
const FLOATING_SEARCH_PREVIEW_BOTTOM_SPACING = 104;

function normalizeBrowserUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  if (!isValidHttpsUrl(candidate)) {
    return undefined;
  }

  const { hostname } = new URL(candidate);
  return hostname.includes('.') || hostname === 'localhost'
    ? candidate
    : undefined;
}

function isExplicitHttpUrl(input: string) {
  return /^http:\/\//i.test(input.trim());
}

const MiniAppSkeletonList = ({ numItems = 6 }: { numItems?: number }) => {
  return (
    <View>
      {Array.from({ length: numItems }).map((_, index) => (
        <View key={index}>
          <AppListItemSkeleton />
        </View>
      ))}
    </View>
  );
};

type AppsFloatingSearchResultsProps = {
  searchQuery: string | null;
  rawQuery: string;
  debouncedQuery: string;
  searchMode: AppsFloatingSearchMode;
  searchError: string | undefined;
  onClose: () => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  searchPlaceholder: string;
};

const AppsFloatingSearchResults = ({
  searchQuery,
  rawQuery,
  debouncedQuery,
  searchMode,
  searchError,
  onClose,
  onChangeText,
  onSubmit,
  searchPlaceholder,
}: AppsFloatingSearchResultsProps) => {
  const t = useTheme();
  const { trackEvent } = useTrackEvent();
  const inputRef = useRef<TextInput>(null);

  const { keyboardHeight } = useKeyboardVisibility();
  const resultsBottomPadding = FLOATING_SEARCH_BOTTOM_SPACING + keyboardHeight;
  const previewPaddingBottom =
    FLOATING_SEARCH_PREVIEW_BOTTOM_SPACING + keyboardHeight;

  const opacity = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value === 1 ? 'auto' : 'none',
  }));

  useEffect(() => {
    if (searchQuery === null) {
      opacity.set(withTiming(0, { duration: 150 }));
      return;
    }

    opacity.set(withTiming(1, { duration: 150 }));
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [opacity, searchQuery]);

  const { data: recentMiniApps, isLoading: isLoadingRecentApps } =
    useRecentlyUsedApps();
  const recentApps = useMemo(() => {
    if (!recentMiniApps?.result?.apps) {
      return [];
    }

    return recentMiniApps.result.apps.map((app) => app.frame);
  }, [recentMiniApps]);

  const { flatData: trendingApps, isLoading: isLoadingTrendingApps } =
    useTopFrames({
      enabled: searchQuery !== null && rawQuery === '',
    });
  const trendingPreviewApps = useMemo(
    () => trendingApps?.slice(0, 5) ?? [],
    [trendingApps],
  );

  const autocompleteQuery =
    searchMode === 'preview' ? debouncedQuery.trim() : '';
  const { data: autocompleteResults, isLoading: isAutocompleteLoading } =
    useSearchMiniAppsForAutocomplete({
      query: autocompleteQuery,
    });

  const resultsQuery = searchMode === 'results' ? rawQuery.trim() : '';
  const { flatData, onEndReached, isLoading, hasNextPage, refetch } =
    useSearchMiniApps({
      query: resultsQuery,
    });

  const handleAppPress = useCallback(
    (app: ApiFrame, event: AnalyticsEvent) => {
      trackEvent(event, {
        domain: app.domain,
        query: rawQuery,
      });
      onClose();
    },
    [onClose, rawQuery, trackEvent],
  );

  const renderAutocomplete = useMemo(() => {
    if (autocompleteQuery === '') {
      return null;
    }

    return (
      <FlashList
        data={autocompleteResults ?? []}
        keyExtractor={(item) => item.domain}
        contentContainerStyle={{ paddingBottom: resultsBottomPadding }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isAutocompleteLoading ? (
            <MiniAppSkeletonList numItems={6} />
          ) : (
            <DefaultEmptyListView message="No mini apps found" />
          )
        }
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={({ item }) => (
          <AppListItem
            key={item.domain}
            frameIconSize={48}
            description={item.description}
            frame={item}
            style={[t.pX3, t.pY2]}
            onBeforeLaunch={() =>
              handleAppPress(
                item,
                AnalyticsEvent.AppsHomeSearchAutocompleteClickApp,
              )
            }
          />
        )}
      />
    );
  }, [
    autocompleteQuery,
    autocompleteResults,
    handleAppPress,
    isAutocompleteLoading,
    resultsBottomPadding,
    t.pX3,
    t.pY2,
  ]);

  const renderResults = useMemo(() => {
    if (resultsQuery === '') {
      return null;
    }

    return (
      <FlashList
        data={flatData ?? []}
        keyExtractor={(item) => item.domain}
        contentContainerStyle={{ paddingBottom: resultsBottomPadding }}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isLoading ? (
            <MiniAppSkeletonList />
          ) : (
            <DefaultEmptyListView message="No mini apps found" />
          )
        }
        ListFooterComponent={
          hasNextPage ? <MiniAppSkeletonList numItems={3} /> : null
        }
        refreshing={isLoading}
        onRefresh={resultsQuery ? refetch : undefined}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={({ item }) => (
          <AppListItem
            key={item.domain}
            frame={item}
            frameIconSize={48}
            style={[t.pX3, t.pY2]}
            onBeforeLaunch={() =>
              handleAppPress(item, AnalyticsEvent.AppsHomeSearchClickApp)
            }
          />
        )}
      />
    );
  }, [
    flatData,
    handleAppPress,
    hasNextPage,
    isLoading,
    onEndReached,
    resultsBottomPadding,
    refetch,
    resultsQuery,
    t.pX3,
    t.pY2,
  ]);

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
        {
          zIndex: SEARCH_RESULTS_Z_INDEX,
        },
        opacityStyle,
      ]}
    >
      {searchQuery !== null && (
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
            <BrowserSearchIcon
              size={SEARCH_ICON_INPUT_SIZE}
              color={t.colors.text.secondary}
            />
            <TextInput
              ref={inputRef}
              value={rawQuery}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmit}
              placeholder={searchPlaceholder}
              placeholderTextColor={t.colors.text.tertiary}
              style={[
                {
                  flex: 1,
                  fontSize: 16,
                  color: t.colors.text.primary,
                  outlineWidth: 0,
                },
              ]}
              keyboardType="url"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedPressable
              onPress={() => {
                if (rawQuery.length > 0) {
                  onChangeText('');
                } else {
                  onClose();
                }
              }}
              style={[t.itemsCenter, t.justifyCenter]}
            >
              <X size={16} color={t.colors.text.tertiary} />
            </AnimatedPressable>
          </View>
          {searchError ? (
            <Text style={[t.texts.danger, t.textSm, t.mT2, t.pX3]}>
              {searchError}
            </Text>
          ) : null}
        </View>
      )}
      {searchQuery !== null ? (
        searchMode === 'results' ? (
          renderResults
        ) : autocompleteQuery !== '' ? (
          renderAutocomplete
        ) : (
          <ScrollView
            contentContainerStyle={[
              { gap: 12, paddingBottom: previewPaddingBottom },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <RecentAppsCarousel
              apps={recentApps}
              isLoading={isLoadingRecentApps}
              header={
                <View style={[t.pT2, t.pB4, t.pX3]}>
                  <TypographyBody label="Large/Strong" color={'tertiary'}>
                    Recent
                  </TypographyBody>
                </View>
              }
            />
            {(isLoadingTrendingApps || trendingPreviewApps.length > 0) && (
              <View style={[t.pX3, t.pB4]}>
                <TypographyBody label="Large/Strong" color={'tertiary'}>
                  Trending
                </TypographyBody>
                {isLoadingTrendingApps ? (
                  <MiniAppSkeletonList numItems={3} />
                ) : (
                  trendingPreviewApps.map((app, index) => (
                    <AppListItem
                      key={app.domain}
                      frame={app}
                      frameIconSize={48}
                      style={[t.pY2]}
                      onBeforeLaunch={() =>
                        handleAppPress(
                          app,
                          AnalyticsEvent.AppsHomeClickTrendingApp,
                        )
                      }
                      rank={index + 1}
                    />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        )
      ) : null}
    </Animated.View>
  );
};

type AppsFloatingSearchProps = {
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
  showPressable?: boolean;
};

const AppsFloatingSearch: React.FC<AppsFloatingSearchProps> = React.memo(
  ({ autoOpen, onAutoOpenHandled, showPressable = true }) => {
    const { trackEvent } = useTrackEvent();
    const navigation = useNavigation();
    const { setOpenInAppBrowser } = useMinimizedInAppBrowser();

    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [searchMode, setSearchMode] =
      useState<AppsFloatingSearchMode>('preview');
    const [searchError, setSearchError] = useState<string | undefined>();
    const [debouncedQuery, setQuery, forceSetQuery, rawQuery] =
      useDebouncedState('');

    const handleOpen = useCallback(() => {
      trackEvent(AnalyticsEvent.AppsHomeClickSearch, undefined);
      setSearchMode('preview');
      setSearchError(undefined);
      forceSetQuery('');
      setSearchQuery('');
    }, [forceSetQuery, trackEvent]);

    useEffect(() => {
      if (!autoOpen) {
        return;
      }
      handleOpen();
      onAutoOpenHandled?.();
    }, [autoOpen, handleOpen, onAutoOpenHandled]);

    const handleClose = useCallback(() => {
      forceSetQuery('');
      setSearchQuery(null);
      setSearchMode('preview');
      setSearchError(undefined);
      Keyboard.dismiss();
    }, [forceSetQuery]);

    const handleSubmit = useCallback(() => {
      const trimmed = rawQuery.trim();
      if (!trimmed) {
        return;
      }

      trackEvent(AnalyticsEvent.AppsHomeSearchSubmit, {
        query: trimmed,
      });
      const normalizedUrl = normalizeBrowserUrl(trimmed);
      if (!normalizedUrl) {
        if (isExplicitHttpUrl(trimmed)) {
          setSearchError('Enter a valid HTTPS URL');
          return;
        }
        setSearchMode('results');
        return;
      }

      setSearchError(undefined);
      handleClose();
      setOpenInAppBrowser({ url: normalizedUrl, source: 'mini-app-globe' });
    }, [handleClose, rawQuery, setOpenInAppBrowser, trackEvent, setSearchMode]);

    const handleChangeText = useCallback(
      (text: string) => {
        if (text === '') {
          setSearchQuery('');
          setSearchMode('preview');
          setSearchError(undefined);
          forceSetQuery('');
          return;
        }

        setSearchMode('preview');
        setSearchError(undefined);
        setSearchQuery(text);
        setQuery(text);
      },
      [forceSetQuery, setQuery],
    );

    useFocusEffect(
      React.useCallback(() => {
        const unsubscribe = navigation
          .getParent()
          // @ts-ignore
          ?.addListener('tabPress', () => {
            handleClose();
          });

        return unsubscribe;
      }, [handleClose, navigation]),
    );

    return (
      <>
        <AppsFloatingSearchResults
          searchQuery={searchQuery}
          rawQuery={rawQuery}
          debouncedQuery={debouncedQuery}
          searchMode={searchMode}
          searchError={searchError}
          onClose={handleClose}
          onChangeText={handleChangeText}
          onSubmit={handleSubmit}
          searchPlaceholder="Type URL or mini app name"
        />
        {showPressable && (
          <FloatingSearchPressable
            searchQuery={searchQuery}
            onOpen={handleOpen}
          />
        )}
      </>
    );
  },
);

export { AppsFloatingSearch };
