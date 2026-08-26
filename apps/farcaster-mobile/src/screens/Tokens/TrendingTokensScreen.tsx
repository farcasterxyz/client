import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLink } from 'farcaster-client-data';
import { useDebouncedState } from 'farcaster-client-hooks';
import {
  SearchInput,
  Text2,
  TokenSearchResults,
  TrendingTokens,
  useSharedNavigationContext,
  WalletScreenHeader,
} from 'farcaster-expo';
import { Clock, Coins, ListFilterIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { PressableContainer } from '~/components/PressableContainer';
import { buildScreen } from '~/components/Screen';
import {
  TrendingTokensFiltersBottomSheetModal,
  TrendingTokensFiltersSortOptions,
} from '~/components/TrendingTokens/TrendingTokensFiltersBottomSheet';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useTrendingTokensFilters } from '~/hooks/useTrendingTokensFilters';
import { CommonStackParamList, TrendingTokensParams } from '~/types/navigation';

function TrendingTokensScreenContent({
  navigationParams,
}: {
  navigationParams?: TrendingTokensParams;
}) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();
  const { push } = useSharedNavigationContext();

  const filters = useTrendingTokensFilters('trending', {
    chain: navigationParams?.chain,
    timeWindow: navigationParams?.timeWindow,
    platforms: navigationParams?.platform
      ? [navigationParams.platform]
      : undefined,
  });

  const { params, filterCount, resetFilters, resetSortBy, toggleTimeWindow } =
    filters;

  const [dQuery, setQuery, forceSetQuery, rawQuery] = useDebouncedState('');
  const [isSearching, setIsSearching] = useState(false);

  const [showFiltersBottomSheet, _setShowFiltersBottomSheet] = useState(false);
  const setShowFiltersBottomSheet = useCallback(
    (show: boolean) => {
      if (show) {
        trackEvent(AnalyticsEvent.ViewTrendingTokensFiltersOptions);
      }

      _setShowFiltersBottomSheet(show);
    },
    [trackEvent],
  );

  const hasSetFilters = useMemo(
    () => params.chain || params.sortBy !== 'trending',
    [params.chain, params.sortBy],
  );

  // includes a sort by
  const totalFilterCount = useMemo(() => {
    return filterCount + (params.sortBy !== 'trending' ? 1 : 0);
  }, [filterCount, params.sortBy]);

  const handlePress = useCallback(
    (token: ApiTokenLink) => {
      push({
        path: 'Token',
        params: { chain: token.chain, ca: token.ca, via: 'trending' },
      });
    },
    [push],
  );

  return (
    <View style={[t.flex1]}>
      {/* Search and Filter */}
      <View style={[t.flexRow, t.pX3]}>
        {/* Search */}
        <View style={[t.flex1, !isSearching && t.mR3]}>
          <SearchInput
            placeholder="Search for tokens or CA"
            value={rawQuery}
            style={[t.backgrounds.secondary, t.texts.secondary]}
            onChangeText={(text) => {
              if (text === '') {
                forceSetQuery('');
              } else {
                setQuery(text);
              }
            }}
            onSubmitEditing={() => {}}
            autoCorrect={false}
            align="left"
            width={'100%'}
            onFocus={() => setIsSearching(true)}
            onBlur={() => {
              setIsSearching(false);
              forceSetQuery('');
            }}
            onClose={() => {
              setIsSearching(false);
              forceSetQuery('');
            }}
            onPaste={(text) => {
              setIsSearching(true);
              forceSetQuery(text);
            }}
          />
        </View>
        {/* Filter */}
        {!isSearching && (
          <PressableContainer
            onPress={() => setShowFiltersBottomSheet(true)}
            style={[
              t.pX3,
              t.pY2,
              t.roundedLg,
              t.alignCenter,
              t.justifyCenter,
              totalFilterCount > 0
                ? t.backgrounds.brandLight
                : t.backgrounds.secondary,
              { width: 40, height: 40 },
            ]}
          >
            <View>
              <ListFilterIcon
                size={18}
                color={
                  hasSetFilters ? t.colors.text.brand : t.colors.text.secondary
                }
              />
              {totalFilterCount > 0 && (
                <View
                  style={[
                    t.absolute,
                    t.flexCol,
                    t.roundedFull,
                    t.justifyCenter,
                    t.itemsCenter,
                    t.w3,
                    t.h3,
                    t.backgrounds.brand,
                    { top: -4, right: -7 },
                  ]}
                >
                  <Text2
                    style={[
                      t.texts.light,
                      t.fontBold,
                      { fontSize: 8, lineHeight: 12 },
                    ]}
                  >
                    {totalFilterCount}
                  </Text2>
                </View>
              )}
            </View>
          </PressableContainer>
        )}
      </View>

      {/* Sort Options with Duration Selector */}
      <View style={[t.flexRow, t.mT3, t.pX3]}>
        {/* Duration Selector */}
        <View style={[t.flexRow, t.itemsCenter]}>
          <PressableContainer
            onPress={() => {
              if (
                typeof params.timeWindow === 'undefined' ||
                params.timeWindow === '6h'
              ) {
                toggleTimeWindow('1d');
              } else {
                toggleTimeWindow('6h');
              }
            }}
            style={[
              t.flexRow,
              t.itemsCenter,
              t.pX3,
              { borderRadius: 8, paddingVertical: 6, width: 64 },
              t.roundedLg,
              t.backgrounds.secondary,
            ]}
          >
            <Clock size={14} color={t.colors.text.secondary} />
            <Text2
              style={[
                t.fontSemibold,
                t.textSm,
                t.texts.secondary,
                t.mL2,
                t.uppercase,
              ]}
            >
              {params.timeWindow || '6h'}
            </Text2>
          </PressableContainer>
          {/* Separator */}
          <View style={[t.h6, t.mX2, t.backgrounds.secondary, { width: 1 }]} />
        </View>
        {/* Sort Options */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[t.flexRow, { gap: 12 }]}
          style={[t.flex1]}
        >
          <TrendingTokensFiltersSortOptions filters={filters} />
        </ScrollView>
      </View>

      {/* Trending Tokens or Search Results */}
      <View style={[t.flex1, t.mT3]}>
        {isSearching && rawQuery.trim().length > 0 ? (
          <TokenSearchResults
            query={rawQuery.trim()}
            debouncedQuery={dQuery.trim()}
            onSelectToken={handlePress}
          />
        ) : (
          <TrendingTokens
            enabled={true}
            onPress={handlePress}
            params={params}
            emptyComponent={
              <View style={[t.flex1, t.itemsCenter, t.pT6, { gap: 24 }]}>
                <Coins size={64} color={t.colors.background.tertiary} />
                <View style={[t.flex1, t.itemsCenter, { gap: 4 }]}>
                  <Text2 size="sm" weight="semibold" color="tertiary">
                    No tokens found
                  </Text2>
                  <TouchableOpacity
                    onPress={() => {
                      resetFilters();
                      resetSortBy();
                    }}
                  >
                    <Text2 style={[t.textXs, t.fontSemibold, t.texts.brand]}>
                      Remove filters
                    </Text2>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        )}
      </View>
      {showFiltersBottomSheet && (
        <TrendingTokensFiltersBottomSheetModal
          onDismiss={() => setShowFiltersBottomSheet(false)}
          filters={filters}
        />
      )}
    </View>
  );
}

type TrendingTokensScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TrendingTokens'
>;

const TrendingTokensScreen = buildScreen<TrendingTokensScreenProps>(
  { name: 'TrendingTokens', insetTop: true, themeV2: true },
  ({ route: { params } }) => {
    const t = useTheme();
    const { goBack } = useSharedNavigationContext();
    const { trackEvent } = useAnalytics();

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.ViewTrendingTokens);
      }, [trackEvent]),
    );

    return (
      <View style={[t.flex1]}>
        <WalletScreenHeader title="Trending Tokens" onBackCallback={goBack} />
        <TrendingTokensScreenContent navigationParams={params} />
      </View>
    );
  },
);

TrendingTokensScreen.displayName = 'TrendingTokensScreen';

export { TrendingTokensScreen };
