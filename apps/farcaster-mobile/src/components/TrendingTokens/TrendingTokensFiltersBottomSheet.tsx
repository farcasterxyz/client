import {
  ApiChain,
  ApiTokenSourcePlatform,
  ApiTrendingTokensAmountMinimums,
  ApiTrendingTokensSortBy,
} from 'farcaster-client-data';
import { AutoDisplayingBottomSheetModal, Text2 } from 'farcaster-expo';
import { TokenPlatformIcon } from 'farcaster-expo/src/components/crypto/tokens/TokenPlatformIcon';
import {
  ArrowDownIcon,
  ArrowDownUpIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  Droplets,
  FunnelIcon,
  GlobeIcon,
  RocketIcon,
  Square,
  Trash2,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ChainImage } from '~/components/Chain/ChainImage';
import { PressableContainer } from '~/components/PressableContainer';
import { useTheme } from '~/contexts/ThemeProvider';
import { TrendingTokensFilters } from '~/hooks/useTrendingTokensFilters';

const SUPPORTED_CHAINS: { id: ApiChain; label: string }[] = [
  { id: 'base', label: 'Base' },
  { id: 'solana', label: 'Solana' },
  { id: 'bsc', label: 'BSC' },
  { id: 'monad', label: 'Monad' },
  { id: 'robinhood', label: 'Robinhood' },
];

const PLATFORMS: {
  id: ApiTokenSourcePlatform;
  label: string;
}[] = [
  { id: 'clanker', label: 'Clanker' },
  { id: 'zora', label: 'Zora' },
  { id: 'pumpfun', label: 'Pumpfun' },
  { id: 'bonk', label: 'Bonk' },
  { id: 'heaven', label: 'Heaven' },
  { id: 'paragraph', label: 'Paragraph' },
];

const MIN_LIQUIDITY_OPTIONS: {
  id: ApiTrendingTokensAmountMinimums;
  label: string;
}[] = [
  { id: '100k', label: '$100K' },
  { id: '500k', label: '$500K' },
  { id: '1m', label: '$1M' },
];

const SORT_OPTIONS: {
  id: ApiTrendingTokensSortBy;
  label: string;
}[] = [
  { id: 'new', label: 'Recent' },
  { id: 'vol', label: 'Vol' },
  { id: 'mcap', label: 'MCAP' },
  { id: 'buyers', label: 'Buyers' },
];

export function TrendingTokensFiltersSortOptions({
  filters,
}: {
  filters: TrendingTokensFilters;
}) {
  const t = useTheme();
  const { params, setSelectedSortBy } = filters;
  return (
    <>
      {SORT_OPTIONS.map((option) => (
        <PressableContainer
          key={option.id}
          onPress={() => setSelectedSortBy(option.id)}
          style={[
            t.pX3,
            { paddingVertical: 6 },
            params.sortBy === option.id && t.backgrounds.brandLight,
          ]}
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <Text2
              style={[
                t.fontSemibold,
                params.sortBy === option.id ? t.texts.brand : t.texts.secondary,
              ]}
            >
              {option.label}
            </Text2>
            {params.sortBy === option.id &&
              ['mcap', 'vol', 'buyers'].includes(option.id) &&
              (params.sortOrder === 'desc' ? (
                <ArrowDownIcon
                  size={14}
                  color={t.colors.text.brand}
                  style={[t.mL1]}
                />
              ) : (
                <ArrowUpIcon
                  size={14}
                  color={t.colors.text.brand}
                  style={[t.mL1]}
                />
              ))}
          </View>
        </PressableContainer>
      ))}
    </>
  );
}

type TrendingTokensFiltersBottomSheetModalProps = {
  showSortOptions?: boolean;
  defaultSortBy?: ApiTrendingTokensSortBy;
  onDismiss: () => void;
  filters: TrendingTokensFilters;
};

export function TrendingTokensFiltersBottomSheetModal({
  showSortOptions = true,
  defaultSortBy = 'trending',
  onDismiss,
  filters,
}: TrendingTokensFiltersBottomSheetModalProps) {
  const t = useTheme();
  const {
    params,

    toggleSelectedChain,
    toggleSelectedPlatform,

    setSelectedMinLiquidity,
    setHasCreatorData,

    resetFilters,
    resetSortBy,

    filterCount,
  } = filters;

  const [showChainOptions, setShowChainOptions] = useState(false);
  const [showPlatformOptions, setShowPlatformOptions] = useState(false);
  const [showLiquidityOptions, setShowLiquidityOptions] = useState(false);

  const platformButtonLabel = useMemo(() => {
    const count = params.platforms?.length ?? 0;
    if (count === 0) {
      return 'Launcher';
    }
    if (count === 1) {
      return `${count} launcher selected`;
    }
    return `${count} launchers selected`;
  }, [params]);

  const liquidityButtonLabel = useMemo(() => {
    if (!params.minLiquidity) {
      return 'Liquidity';
    }
    return `Min. ${MIN_LIQUIDITY_OPTIONS.find((l) => l.id === params.minLiquidity)?.label} liquidity`;
  }, [params]);

  const hasSetFilters = useMemo(() => {
    return filterCount > 0;
  }, [filterCount]);

  const hasSetSortBy = useMemo(() => {
    return params.sortBy !== defaultSortBy;
  }, [defaultSortBy, params]);

  const renderReset = (show: boolean, reset: () => void) => {
    if (!show) {
      return null;
    }

    return (
      <PressableContainer onPress={reset} style={[t.backgrounds.default]}>
        <Trash2 size={18} color={t.colors.text.secondary} />
      </PressableContainer>
    );
  };

  return (
    <AutoDisplayingBottomSheetModal
      name="trendingTokensFiltersBottomSheet"
      onDismiss={onDismiss}
      contentContainerStyle={[t.flex1, t.pY3, { gap: 24 }]}
    >
      {/* SortBy Section */}
      {showSortOptions && (
        <View style={[t.flex1, { gap: 8 }]}>
          <View style={[t.flexRow, t.justifyBetween, t.pB1]}>
            <View style={[t.flexRow, t.itemsCenter]}>
              <ArrowDownUpIcon
                color={
                  hasSetSortBy
                    ? t.colors.text.informative
                    : t.colors.text.secondary
                }
                size={16}
              />
              <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL2]}>
                Sort By
              </Text2>
            </View>
            {renderReset(hasSetSortBy, resetSortBy)}
          </View>
          <View style={[t.flexRow, t.flexWrap, { gap: 8 }]}>
            <TrendingTokensFiltersSortOptions filters={filters} />
          </View>
        </View>
      )}

      {/* Filters Section */}
      <View style={[t.flex1, { gap: 8 }]}>
        <View style={[t.flexRow, t.justifyBetween, t.pB1]}>
          <View style={[t.flexRow, t.itemsCenter]}>
            <FunnelIcon
              color={
                hasSetFilters
                  ? t.colors.text.informative
                  : t.colors.text.secondary
              }
              size={16}
            />
            <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL2]}>
              Filters
            </Text2>
            {hasSetFilters && (
              <View
                style={[
                  t.mL2,
                  t.roundedFull,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.w5,
                  { backgroundColor: t.colors.text.informative },
                ]}
              >
                <Text2 style={[t.texts.light, t.textXs, t.fontSemibold]}>
                  {filterCount}
                </Text2>
              </View>
            )}
          </View>
          {renderReset(hasSetFilters, resetFilters)}
        </View>
        {/* Chain */}
        <PressableContainer
          onPress={() => {
            setShowChainOptions(!showChainOptions);
            setShowPlatformOptions(false);
            setShowLiquidityOptions(false);
          }}
          style={[t.p3, t.justifyBetween]}
          fullWidth
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <GlobeIcon
              size={16}
              color={
                params.chain
                  ? t.colors.text.informative
                  : t.colors.text.secondary
              }
            />
            <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL2]}>
              Chain
            </Text2>
          </View>
          <ChevronRightIcon
            size={16}
            color={t.colors.text.secondary}
            style={{
              transform: [{ rotate: showChainOptions ? '90deg' : '0deg' }],
            }}
          />
        </PressableContainer>
        {showChainOptions && (
          <View style={[t.pX3, { gap: 8 }]}>
            {SUPPORTED_CHAINS.map((chain) => (
              <PressableContainer
                key={chain.id}
                onPress={() => {
                  toggleSelectedChain(chain.id);
                  setShowChainOptions(false);
                }}
                fullWidth
                style={[
                  t.p3,
                  t.justifyBetween,
                  t.itemsCenter,
                  params.chain === chain.id && t.backgrounds.brandLight,
                ]}
              >
                <View style={[t.flexRow, t.itemsCenter]}>
                  <ChainImage chain={chain.id} />
                  <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL3]}>
                    {chain.label}
                  </Text2>
                </View>
                {params.chain === chain.id ? (
                  <CheckIcon size={16} color={t.colors.text.brand} />
                ) : (
                  <Square size={16} color={t.colors.text.secondary} />
                )}
              </PressableContainer>
            ))}
          </View>
        )}
        {/* Platforms */}
        <PressableContainer
          fullWidth
          style={[t.p3, t.justifyBetween]}
          onPress={() => {
            setShowPlatformOptions(!showPlatformOptions);
            setShowChainOptions(false);
            setShowLiquidityOptions(false);
          }}
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <RocketIcon
              size={16}
              color={
                (params.platforms?.length ?? 0) > 0
                  ? t.colors.text.informative
                  : t.colors.text.secondary
              }
            />
            <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL2]}>
              {platformButtonLabel}
            </Text2>
          </View>
          <ChevronRightIcon
            size={16}
            color={t.colors.text.secondary}
            style={{
              transform: [{ rotate: showPlatformOptions ? '90deg' : '0deg' }],
            }}
          />
        </PressableContainer>
        {showPlatformOptions && (
          <View style={[t.pX3, { gap: 8 }]}>
            {PLATFORMS.map((platform) => (
              <PressableContainer
                key={platform.id}
                onPress={() => toggleSelectedPlatform(platform.id)}
                fullWidth
                style={[
                  t.p3,
                  t.justifyBetween,
                  t.itemsCenter,
                  params.platforms?.includes(platform.id) &&
                    t.backgrounds.brandLight,
                ]}
              >
                <View style={[t.flexRow, t.itemsCenter]}>
                  <TokenPlatformIcon
                    platform={platform.id}
                    size={16}
                    style={[t.rounded]}
                  />
                  <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL3]}>
                    {platform.label}
                  </Text2>
                </View>
                {params.platforms?.includes(platform.id) ? (
                  <CheckIcon size={16} color={t.colors.text.brand} />
                ) : (
                  <Square size={16} color={t.colors.text.secondary} />
                )}
              </PressableContainer>
            ))}
          </View>
        )}
        {/* Liquidity */}
        <PressableContainer
          fullWidth
          onPress={() => {
            setShowLiquidityOptions(!showLiquidityOptions);
            setShowChainOptions(false);
            setShowPlatformOptions(false);
          }}
          style={[t.p3, t.justifyBetween]}
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <Droplets
              size={16}
              color={
                params.minLiquidity
                  ? t.colors.text.informative
                  : t.colors.text.secondary
              }
            />
            <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL2]}>
              {liquidityButtonLabel}
            </Text2>
          </View>
          <ChevronRightIcon
            size={16}
            color={t.colors.text.secondary}
            style={{
              transform: [{ rotate: showLiquidityOptions ? '90deg' : '0deg' }],
            }}
          />
        </PressableContainer>
        {showLiquidityOptions && (
          <View style={[t.flexRow, t.justifyBetween, { gap: 8 }]}>
            {MIN_LIQUIDITY_OPTIONS.map((minLiquidity) => (
              <PressableContainer
                key={minLiquidity.id}
                onPress={() => {
                  if (params.minLiquidity === minLiquidity.id) {
                    setSelectedMinLiquidity(undefined);
                  } else {
                    setSelectedMinLiquidity(minLiquidity.id);
                  }
                }}
                style={[
                  t.flex1,
                  t.p3,
                  t.justifyCenter,
                  t.itemsCenter,
                  { borderRadius: 12 },
                  params.minLiquidity === minLiquidity.id &&
                    t.backgrounds.brandLight,
                ]}
              >
                <Text2
                  style={[
                    t.fontSemibold,
                    t.textSm,
                    params.minLiquidity === minLiquidity.id
                      ? t.texts.brand
                      : t.texts.secondary,
                  ]}
                >
                  {`>${minLiquidity.label}`}
                </Text2>
              </PressableContainer>
            ))}
          </View>
        )}
        {/* Known Creators */}
        <PressableContainer
          fullWidth
          onPress={() => setHasCreatorData(!params.hasCreatorData)}
          style={[t.p3, t.justifyBetween]}
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <Users
              size={16}
              color={
                params.hasCreatorData
                  ? t.colors.text.informative
                  : t.colors.text.secondary
              }
            />
            <Text2 style={[t.texts.secondary, t.fontSemibold, t.mL2]}>
              Known Creators
            </Text2>
          </View>
          {params.hasCreatorData ? (
            <CheckIcon size={16} color={t.colors.text.brand} />
          ) : (
            <Square size={16} color={t.colors.text.secondary} />
          )}
        </PressableContainer>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
