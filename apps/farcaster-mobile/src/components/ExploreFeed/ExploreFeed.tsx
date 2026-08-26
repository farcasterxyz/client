import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiArticle,
  ApiRecentTrade,
  ApiTrendingToken,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  useExploreFeed,
  useUnseen,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  LoadingIndicator,
  Text2,
  TokenListItem,
  useHaptics,
} from 'farcaster-expo';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { TradeRow } from '~/components/ExploreFeed/TradeRow';
import { ArticlesCarousel } from '~/components/News/ArticleCarousel';
import { ClankerSpotlight } from '~/components/News/ClankerSpotlight';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { openedExploreTab } from '~/utils/FastStorageUtils';

const ScrollView = Animated.ScrollView;

const ExploreFeedBRStyle = { borderRadius: 20 };

const CardTitleColorsOneOffs = {
  purple: '#564DD6',
  pink: '#F76CE3',
  blue: '#0D99FF',
  yellow: '#F0B90B',
} as const;

type CardTitleColor = keyof typeof CardTitleColorsOneOffs;

export function ExploreScreenWithFeed() {
  const t = useTheme();

  return (
    <ErrorBoundary fallbackRender={() => <></>}>
      <React.Suspense
        fallback={<LoadingIndicator size="small" style={[t.mT2]} />}
      >
        <ExploreFeed />
      </React.Suspense>
    </ErrorBoundary>
  );
}

function ExploreFeed() {
  const { fid } = useCurrentUser_UNSAFE();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const { value: tradeIdeasAvailable } = checkUserAppContextGate('trade-ideas');

  const t = useTheme();

  const push = usePush();

  const { data, refetch } = useExploreFeed();

  const { refreshControl } = usePullToRefreshInfinite({ refetch });

  const { recordAllArticlesSeen } = useUnseen();

  const { triggerImpactAsync } = useHaptics();

  const farcasterCoins = React.useMemo(() => {
    return typeof data.feed.farcasterCoins !== 'undefined' &&
      data.feed.farcasterCoins.length !== 0
      ? data.feed.farcasterCoins.slice(0, 3)
      : [];
  }, [data.feed.farcasterCoins]);

  const memeCoins = React.useMemo(() => {
    return typeof data.feed.memeCoins !== 'undefined' &&
      data.feed.memeCoins.length !== 0
      ? data.feed.memeCoins.slice(0, 3)
      : [];
  }, [data.feed.memeCoins]);

  const creatorCoins = React.useMemo(() => {
    return typeof data.feed.creatorCoins !== 'undefined' &&
      data.feed.creatorCoins.length !== 0
      ? data.feed.creatorCoins.slice(0, 3)
      : [];
  }, [data.feed.creatorCoins]);

  const bscCoins = React.useMemo(() => {
    return typeof data.feed.bscCoins !== 'undefined' &&
      data.feed.bscCoins.length !== 0
      ? data.feed.bscCoins.slice(0, 3)
      : [];
  }, [data.feed.bscCoins]);

  const shouldShowWalletUpsell = React.useMemo(() => {
    return (
      typeof data.feed.upsells !== 'undefined' &&
      data.feed.upsells.indexOf('wallet') !== -1
    );
  }, [data.feed.upsells]);

  const articles = React.useMemo(() => {
    return typeof data.feed.news !== 'undefined' && data.feed.news.length !== 0
      ? data.feed.news.filter(
          ({ isClankerSpotlight }) =>
            typeof isClankerSpotlight === 'undefined' ||
            isClankerSpotlight === false,
        )
      : undefined;
  }, [data.feed.news]);

  const clankerSpotlights = React.useMemo(() => {
    if (typeof data.feed.news !== 'undefined' && data.feed.news.length !== 0) {
      const spotlights = data.feed.news.filter(
        ({ isClankerSpotlight }) =>
          typeof isClankerSpotlight !== 'undefined' &&
          isClankerSpotlight !== false,
      );

      if (spotlights.length !== 0) {
        const [mostRecentClankerSpotlight, ...olderClankerSpotlights] =
          spotlights;
        return { mostRecentClankerSpotlight, olderClankerSpotlights };
      }
    }

    return undefined;
  }, [data.feed.news]);

  const recentTrades = React.useMemo(() => {
    if (
      typeof data.feed.recentTrades === 'undefined' ||
      data.feed.recentTrades.length === 0
    ) {
      return [];
    }

    return data.feed.recentTrades.slice(0, 3);
  }, [data.feed.recentTrades]);

  const { trackEvent } = useAnalytics();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewExploreFeed, undefined);

      openedExploreTab({ fid });

      recordAllArticlesSeen();
    }, [fid, recordAllArticlesSeen, trackEvent]),
  );

  const scrollRef = React.useRef<Animated.ScrollView>(null);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation
        .getParent()
        // @ts-ignore
        ?.addListener('tabPress', () => {
          scrollRef.current?.scrollTo(0);
        });

      return unsubscribe;
    }, [navigation]),
  );

  const onFarcasterCoinPress = React.useCallback(
    ({ coin }: { coin: ApiTrendingToken }) => {
      trackEvent(AnalyticsEvent.PressExploreFeedFarcasterCoin, {
        chain: coin.chain,
        ca: coin.ca,
      });

      push('Token', {
        chain: coin.chain,
        ca: coin.ca,
        via: 'explore_feed_trending_token',
      });
    },
    [push, trackEvent],
  );

  const onMemeCoinPress = React.useCallback(
    ({ coin }: { coin: ApiTrendingToken }) => {
      trackEvent(AnalyticsEvent.PressExploreFeedMemeCoin, {
        chain: coin.chain,
        ca: coin.ca,
      });

      push('Token', {
        chain: coin.chain,
        ca: coin.ca,
        via: 'explore_feed_trending_token',
      });
    },
    [push, trackEvent],
  );

  const onCreatorCoinPress = React.useCallback(
    ({ coin }: { coin: ApiTrendingToken }) => {
      trackEvent(AnalyticsEvent.PressExploreFeedCreatorCoin, {
        chain: coin.chain,
        ca: coin.ca,
      });

      push('Token', {
        chain: coin.chain,
        ca: coin.ca,
        via: 'explore_feed_trending_token',
      });
    },
    [push, trackEvent],
  );

  const onBscCoinPress = React.useCallback(
    ({ coin }: { coin: ApiTrendingToken }) => {
      trackEvent(AnalyticsEvent.PressExploreFeedBscCoin, {
        chain: coin.chain,
        ca: coin.ca,
      });

      push('Token', {
        chain: 'bsc',
        ca: coin.ca,
        via: 'explore_feed_trending_token',
      });
    },
    [push, trackEvent],
  );

  const onFarcasterCoinShowMorePress = React.useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.PressExploreFeedShowMore, {
      platform: 'clanker',
    });

    push('TrendingTokens', {
      platform: 'clanker',
      timeWindow: '1d',
    });
  }, [push, trackEvent, triggerImpactAsync]);

  const onMemeCoinShowMorePress = React.useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.PressExploreFeedShowMore, {
      platform: 'pumpfun',
    });

    push('TrendingTokens', {
      platform: 'pumpfun',
      timeWindow: '1d',
    });
  }, [push, trackEvent, triggerImpactAsync]);

  const onCreatorCoinShowMorePress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressExploreFeedShowMore, {
      platform: 'zora',
    });

    push('TrendingTokens', {
      platform: 'zora',
      timeWindow: '1d',
    });
  }, [push, trackEvent, triggerImpactAsync]);

  const onBscCoinShowMorePress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressExploreFeedShowMore, {
      platform: 'bsc',
    });

    push('TrendingTokens', {
      chain: 'bsc',
      timeWindow: '1d',
    });
  }, [push, trackEvent, triggerImpactAsync]);

  return (
    <ScrollView
      ref={scrollRef}
      style={[t.hFull, t.pX3]}
      contentContainerStyle={[t.pB2, { gap: 8 }]}
      refreshControl={refreshControl}
    >
      {tradeIdeasAvailable && typeof clankerSpotlights !== 'undefined' && (
        <ClankerSpotlights
          clankerSpotlights={[clankerSpotlights.mostRecentClankerSpotlight]}
        />
      )}
      {/* Articles */}
      {tradeIdeasAvailable && typeof articles !== 'undefined' && (
        <ArticlesCarousel articles={articles} />
      )}
      {/* Recent trades */}
      {tradeIdeasAvailable &&
        recentTrades.length !== 0 &&
        tradeIdeasAvailable && <RecentTrades recentTrades={recentTrades} />}
      {/* Clankers */}
      {tradeIdeasAvailable && farcasterCoins.length !== 0 && (
        <Coins
          title={'Clanker coins'}
          sub={
            'A mix of app, project and memecoins launched on Clanker on Base.'
          }
          panelTitleColor="purple"
          coins={farcasterCoins}
          onCoinPress={onFarcasterCoinPress}
          onShowMorePress={onFarcasterCoinShowMorePress}
        />
      )}
      {/* Pump */}
      {tradeIdeasAvailable && memeCoins.length !== 0 && (
        <Coins
          title={'Pump coins'}
          sub={'Memecoins and streamer coins launched on Pump.fun on Solana.'}
          panelTitleColor="purple"
          coins={memeCoins}
          onCoinPress={onMemeCoinPress}
          onShowMorePress={onMemeCoinShowMorePress}
        />
      )}
      {/* BSC */}
      {tradeIdeasAvailable && bscCoins.length !== 0 && (
        <Coins
          title={'BSC coins'}
          sub={'Coins launched on BNB Smart Chain'}
          panelTitleColor="yellow"
          coins={bscCoins}
          onCoinPress={onBscCoinPress}
          onShowMorePress={onBscCoinShowMorePress}
        />
      )}
      {/* Zora */}
      {tradeIdeasAvailable && creatorCoins.length !== 0 && (
        <Coins
          title={'Zora coins'}
          sub={'Creator and content coins launched on Zora on Base.'}
          panelTitleColor="purple"
          coins={creatorCoins}
          onCoinPress={onCreatorCoinPress}
          onShowMorePress={onCreatorCoinShowMorePress}
        />
      )}
      {/* Upsells */}
      {tradeIdeasAvailable && shouldShowWalletUpsell && <WalletUpsell />}
      {/* Stacking older spotlights to the bottom of the explore feed */}
      {tradeIdeasAvailable &&
        typeof clankerSpotlights !== 'undefined' &&
        clankerSpotlights.olderClankerSpotlights.length !== 0 && (
          <ClankerSpotlights
            clankerSpotlights={clankerSpotlights.olderClankerSpotlights}
          />
        )}
    </ScrollView>
  );
}

function ClankerSpotlights({
  clankerSpotlights,
}: {
  clankerSpotlights: ApiArticle[];
}) {
  const t = useTheme();

  if (clankerSpotlights.length === 0) {
    return null;
  }

  return (
    <View style={[t.flexCol, t.gap2]}>
      {clankerSpotlights.map((article) => (
        <ClankerSpotlight key={article.id} article={article} />
      ))}
    </View>
  );
}

function RecentTrades({ recentTrades }: { recentTrades: ApiRecentTrade[] }) {
  const t = useTheme();

  const push = usePush();

  const { trackEvent } = useAnalytics();

  const { triggerImpactAsync } = useHaptics();

  const onShowMorePress = React.useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.PressExploreFeedShowMore, {
      via: 'recentTrades',
    });

    push('RecentTrades', {});
  }, [push, trackEvent, triggerImpactAsync]);

  if (recentTrades.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        {
          backgroundColor: t.dark
            ? t.colors.background.secondary
            : t.colors.background.default,
        },
        !t.dark && [t.border2, t.borders.primary],
        t.flex,
        t.flexCol,
        t.pY3,
        ExploreFeedBRStyle,
        t.overflowHidden,
      ]}
    >
      <CardHeader
        title={'Recent trades'}
        description={`Latest buys over $${(1000).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}.`}
        onShowMorePress={onShowMorePress}
        titleColor="pink"
      />
      {recentTrades.map((trade, index) => (
        <TradeRow
          key={`${trade.user.fid}-${index}`}
          trade={trade}
          via="explore_feed_recent_trade"
        />
      ))}
    </View>
  );
}

function Coins({
  title,
  sub,
  panelTitleColor,
  coins,
  onCoinPress,
  onShowMorePress,
}: {
  title: string;
  sub: string;
  panelTitleColor: CardTitleColor;
  coins: ApiTrendingToken[];
  onCoinPress: ({ coin }: { coin: ApiTrendingToken }) => void;
  onShowMorePress: () => void;
}) {
  const t = useTheme();

  if (coins.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        {
          backgroundColor: t.dark
            ? t.colors.background.secondary
            : t.colors.background.default,
        },
        !t.dark && [t.border2, t.borders.primary],
        t.flex,
        t.flexCol,
        t.pY3,
        ExploreFeedBRStyle,
        t.overflowHidden,
      ]}
    >
      <CardHeader
        title={title}
        description={sub}
        onShowMorePress={onShowMorePress}
        titleColor={panelTitleColor}
      />
      {coins.map((token) => {
        // For BSC coins, show ticker + formatTimeAgo as subtitle
        const subtitleComponent =
          token.token.chain === 'bsc' ? (
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              {token.token.ticker && (
                <Text2
                  color="tertiary"
                  weight="medium"
                  numberOfLines={1}
                  style={[t.flexShrink, { fontSize: 13, lineHeight: 15 }]}
                >
                  {token.token.ticker}
                </Text2>
              )}
              {token.token.source?.createdAt && (
                <>
                  {token.token.ticker && (
                    <Text2
                      color="tertiary"
                      weight="medium"
                      style={{ fontSize: 13, lineHeight: 15 }}
                    >
                      ∙
                    </Text2>
                  )}
                  <Text2
                    color="tertiary"
                    weight="medium"
                    style={{ fontSize: 13, lineHeight: 15 }}
                  >
                    {formatTimeAgo(token.token.source.createdAt)}
                  </Text2>
                </>
              )}
            </View>
          ) : undefined;

        return (
          <TokenListItem
            key={token.token.ca}
            token={token.token}
            onPress={() => onCoinPress({ coin: token })}
            pressableAnimationsDisabled={true}
            subtitleComponent={subtitleComponent}
            tokenIconDiameter={48}
            green={t.colors.green450}
          />
        );
      })}
    </View>
  );
}

function WalletUpsell() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const navigate = useNavigate();

  const onWalletUpsellPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressExploreFeedWalletUpsell, {});

    navigate('Wallet', {});
  }, [navigate, trackEvent]);

  const { checkUserAppContextGate } = useUserAppContextGate();

  if (!checkUserAppContextGate('wallet-upsells').value) {
    return null;
  }

  return (
    <View
      style={[
        t.flex,
        t.flexCol,
        t.p3,
        ExploreFeedBRStyle,
        t.overflowHidden,
        t.relative,
      ]}
    >
      <LinearGradient
        // CSS: linear-gradient(95deg, rgba(61,193,188,0.08) 3.71%, rgba(168,84,233,0.08) 29.58%)
        colors={['rgba(61,193,188,0.08)', 'rgba(168,84,233,0.08)']}
        locations={[0.0371, 0.2958]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.4125 }}
        style={[t.inset0, t.absolute]}
      />
      <View
        style={[
          t.bgAction,
          t.w10,
          t.h10,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          t.mB2,
        ]}
      >
        <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
          <Path
            d="M27.5 14.75H12.5C11.2574 14.75 10.25 15.7574 10.25 17V26C10.25 27.2426 11.2574 28.25 12.5 28.25H27.5C28.7426 28.25 29.75 27.2426 29.75 26V17C29.75 15.7574 28.7426 14.75 27.5 14.75Z"
            stroke={t.colors.text.light}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M27.2825 14.75V13.3437C27.2824 12.9988 27.2062 12.6582 27.0592 12.3462C26.9123 12.0341 26.6984 11.7583 26.4326 11.5385C26.1668 11.3187 25.8558 11.1602 25.5217 11.0744C25.1877 10.9886 24.8388 10.9776 24.5 11.0422L12.155 13.1492C11.6189 13.2514 11.1353 13.5374 10.7875 13.958C10.4397 14.3786 10.2496 14.9074 10.25 15.4531V17.75"
            stroke={t.colors.text.light}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M25.25 23C24.9533 23 24.6633 22.912 24.4166 22.7472C24.17 22.5824 23.9777 22.3481 23.8642 22.074C23.7506 21.7999 23.7209 21.4983 23.7788 21.2074C23.8367 20.9164 23.9796 20.6491 24.1893 20.4393C24.3991 20.2296 24.6664 20.0867 24.9574 20.0288C25.2483 19.9709 25.5499 20.0006 25.824 20.1142C26.0981 20.2277 26.3324 20.42 26.4972 20.6666C26.662 20.9133 26.75 21.2033 26.75 21.5C26.75 21.8978 26.592 22.2794 26.3107 22.5607C26.0294 22.842 25.6478 23 25.25 23Z"
            fill={t.colors.text.light}
          />
        </Svg>
      </View>
      <Text2 style={[t.mB2]} size="xl" weight="semibold" color="primary">
        Fund your wallet
      </Text2>
      <Text2 style={[t.mB3]} size="sm" weight="regular" color="secondary">
        Send in ETH, SOL or USDC to start trading.
      </Text2>
      <AnimatedPressable
        style={[
          t.pX3,
          t.borderDesignSystemDefault,
          t.border,
          ExploreFeedBRStyle,
          t.bgAction,
          t.itemsCenter,
          t.justifyCenter,
          t.h10,
        ]}
        onPress={onWalletUpsellPress}
      >
        <Text2 size="base" weight="semibold" color="light">
          Start
        </Text2>
      </AnimatedPressable>
    </View>
  );
}

function CardHeader({
  title,
  description,
  titleColor,
  onShowMorePress,
}: {
  title: string;
  description: string;
  titleColor: CardTitleColor;
  onShowMorePress: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      style={[t.flex, t.flexCol, t.mB2, t.pX3]}
      onPress={onShowMorePress}
    >
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2
          size="xl"
          weight="semibold"
          style={[{ color: CardTitleColorsOneOffs[titleColor] }]}
        >
          {title}
        </Text2>
        <Text2 size="sm" weight="semibold" color="tertiary">
          Show more
        </Text2>
      </View>
      <Text2 size="base" weight="regular" color="secondary">
        {description}
      </Text2>
    </Pressable>
  );
}
