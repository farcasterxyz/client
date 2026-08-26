import { Octicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiCoinLink, ApiTokenLink } from 'farcaster-client-data';
import {
  extractCastKey,
  getNotionLinkTarget,
  useFlatSearchCastsData,
  useSearchCastsWithoutSuspense,
  useTokenLinks,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { TokenIcon } from 'farcaster-expo';
import React, { ReactElement } from 'react';
import {
  ColorValue,
  GestureResponderEvent,
  Linking,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Cast } from '~/components/casts/Cast';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';

import { NoTokensIcon } from './NoTokensIcon';
import { TokenSummary } from './TokenSummary';

export function HeaderIconButton({
  Icon,
  onPress,
}: {
  Icon: (props: { size: number; color: ColorValue }) => ReactElement;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        t.borderDefault,
        t.borderHairline,
        t.roundedFull,
        {
          height: 34,
          width: 34,
        },
      ]}
    >
      {Icon({ color: t.colors.text.primary, size: 16 })}
    </Pressable>
  );
}

const FlatList = Animated.FlatList;

export const TokenSearch = ({ ticker }: { ticker: string }) => {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  ticker = decodeURI(ticker).toLowerCase();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewToken, {
        ticker,
      });
    }, [ticker, trackEvent]),
  );

  return (
    <View style={[t.hFull, t.wFull]}>
      <TokenCasts ticker={ticker} />
    </View>
  );
};

function TokenPlaceholder() {
  const t = useTheme();

  return (
    <LinearGradient
      colors={[t.colors.bgElevated, t.colors.bgFaint]}
      style={[{ width: '100%', height: 72, borderRadius: 16 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

export function TokensLoading() {
  const t = useTheme();

  return (
    <View style={[t.flex, t.flexCol, { gap: 8 }, t.mX3]}>
      <TokenPlaceholder />
      <TokenPlaceholder />
      <TokenPlaceholder />
    </View>
  );
}

export function Tokens({ ticker }: { ticker: string }) {
  const t = useTheme();
  const push = usePush();
  const { fid: viewerFid } = useCurrentUser_UNSAFE();
  const { data } = useTokenLinks({
    ticker,
    intent: 'submit',
    contextFid: viewerFid,
  });
  const { trackEvent } = useTrackEvent();

  const tokens = React.useMemo(() => {
    return data.tokens.slice(0, 3);
  }, [data.tokens]);

  const coins = React.useMemo(() => {
    return data.coins;
  }, [data.coins]);

  const onTokenPress = React.useCallback(
    (token: ApiTokenLink) => {
      push('Token', { chain: token.chain, ca: token.ca, via: 'search_query' });
      trackEvent(AnalyticsEvent.ViewToken, {
        chain: token.chain,
        ca: token.ca,
      });
    },
    [push, trackEvent],
  );

  if (tokens.length === 0 && coins.length === 0) {
    return <NoTokensFound ticker={ticker} />;
  }

  return (
    <View style={[t.flex, t.flexCol, { gap: 8 }, t.mX3]}>
      {coins.map((coin, index) => (
        <Coin key={index} coin={coin} />
      ))}
      {tokens.map((token, index) => (
        <Pressable key={index} onPress={() => onTokenPress(token)}>
          <TokenSummary token={token} />
        </Pressable>
      ))}
    </View>
  );
}

function NoTokensFound({ ticker }: { ticker: string }) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const onLearnMorePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressNoTokensFoundLearnMore, { ticker });

    void openBrowserAsync(getNotionLinkTarget({ to: 'token-links' }), {
      dismissButtonStyle: 'close',
      readerMode: false,
    });
  }, [ticker, trackEvent]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.NoTokensFound, { ticker });
  }, [ticker, trackEvent]);

  return (
    <View style={[t.flex, t.flexCol, { gap: 8 }, t.mX3]}>
      <View
        style={[
          t.wFull,
          t.bgFaint,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.h18,
          t.p3,
          { borderRadius: 16 },
        ]}
      >
        <View style={[t.flex, t.relative, t.w13, t.h13, t.mR2]}>
          <View
            style={[
              t.bgMuted,
              t.roundedFull,
              t.w12,
              t.h12,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
            ]}
          >
            <NoTokensIcon />
          </View>
        </View>
        <Text2
          color="secondary"
          size="base"
          weight="regular"
          style={[t.flex1, t.flexGrow]}
        >
          Still gathering data — check back later.{' '}
          <TextWithPress style={[t.texts.brand]} onPress={onLearnMorePress}>
            Learn more
          </TextWithPress>
        </Text2>
      </View>
    </View>
  );
}

function Coin({ coin }: { coin: ApiCoinLink }) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const push = usePush();

  const { triggerImpactAsync } = useHaptics();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onCoinGeckoPress = React.useCallback(() => {
    triggerImpactAsync();

    const url = coin.url;

    trackEvent(AnalyticsEvent.PressOpenCoinGecko, {
      ticker: coin.ticker,
      url: url,
    });

    // Haptic above won't trigger if we do this right away - so artificially delaying it here
    setTimeout(() => Linking.openURL(url), 300);
  }, [coin.ticker, coin.url, trackEvent, triggerImpactAsync]);

  const handlePress = React.useCallback(() => {
    if (coin.chain && coin.ca) {
      push('Token', { chain: coin.chain, ca: coin.ca, via: 'search_query' });
    } else {
      onCoinGeckoPress();
    }
  }, [coin.ca, coin.chain, onCoinGeckoPress, push]);

  return (
    <Pressable onPress={handlePress}>
      <View
        style={[
          t.wFull,
          t.bgFaint,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.h18,
          t.p3,
          { borderRadius: 16 },
        ]}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.flex1,
            { maxWidth: '65%' },
          ]}
        >
          <View style={[t.mR2]}>
            <TokenIcon
              iconUrl={coin.imageUrl}
              diameter={48}
              chain={undefined}
              symbol={coin.ticker}
            />
          </View>
          <View
            style={[
              t.flex,
              t.flexCol,
              t.itemsStart,
              t.justifyCenter,
              { gap: 2 },
            ]}
          >
            <Text2
              color="primary"
              size="base"
              weight="semibold"
              numberOfLines={1}
            >
              ${coin.ticker}
            </Text2>
          </View>
        </View>
        <Animated.View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            animatedStyle,
          ]}
          onTouchStart={() => {
            scale.value = withSpring(0.9);
          }}
          onTouchEnd={() => {
            scale.value = withSpring(1);
          }}
        >
          <Pressable
            style={[
              t.inset0,
              t.hFull,
              t.roundedFull,
              t.flex,
              t.flexRow,
              t.itemsCenter,
            ]}
            onPress={onCoinGeckoPress}
          >
            <View
              style={[
                t.mL2,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.roundedFull,
                t.borderDefault,
                t.borderHairline,
                t.bgMuted,
                { width: 30, height: 30 },
              ]}
            >
              <Octicons
                name="link-external"
                size={14}
                style={[t.texts.secondary]}
              />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

function TokenHeader({ ticker }: { ticker: string }) {
  const t = useTheme();

  return (
    <View style={[t.flex, t.flexCol, { gap: 12 }, t.mB2, t.pY2]}>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.mX4,
          t.mT2,
          t.itemsCenter,
          t.justifyBetween,
          t.borderBHairline,
          t.borderDefault,
          t.pB2,
        ]}
      >
        <Text2 size="base" weight="semibold" color="secondary">
          Tokens
        </Text2>
      </View>
      <React.Suspense fallback={<TokensLoading />}>
        <Tokens ticker={ticker} />
      </React.Suspense>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.mX4,
          t.mT2,
          t.itemsCenter,
          t.justifyBetween,
          t.borderBHairline,
          t.borderDefault,
          t.pB2,
        ]}
      >
        <Text2 size="base" weight="semibold" color="secondary">
          Casts
        </Text2>
        <Text2 size="xs" weight="regular" color="secondary">
          Sorted by most recent
        </Text2>
      </View>
    </View>
  );
}

function TokenCasts({ ticker }: { ticker: string }) {
  const t = useTheme();

  const { data, fetchNextPage, isLoading } = useSearchCastsWithoutSuspense({
    q: `ticker:${ticker} sort:recent`,
    limit: 10,
  });
  const casts = useFlatSearchCastsData({ data });

  const extraData = useCommonFlatListExtraData();

  const handleEndReached = React.useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const ListHeaderComponent = React.useMemo(() => {
    return <TokenHeader ticker={ticker} />;
  }, [ticker]);

  const ListFooterComponent = React.useMemo(() => {
    return isLoading ? (
      <LoadingIndicator size="small" style={[t.mT4]} />
    ) : undefined;
  }, [isLoading, t.mT4]);

  return (
    <FlatList
      scrollIndicatorInsets={{ right: 1 }}
      contentContainerStyle={{}}
      data={casts}
      extraData={extraData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
    />
  );
}

function keyExtractor(item: ApiCast) {
  return extractCastKey(item);
}

function renderItem({ item }: { item: ApiCast }) {
  return <Cast cast={item} />;
}
