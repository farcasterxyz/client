import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOnchainToken } from 'farcaster-client-data';
import { useArticle, useRecordArticleSeen } from 'farcaster-client-hooks';
import { AnimatedPressable, hitSlop, ScreenTitle, Text2 } from 'farcaster-expo';
import { Share } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppBackButton } from '~/components/AppBackButton';
import { BulletPoint } from '~/components/BulletPoint';
import { FrameIconImage } from '~/components/FrameIconImage';
import { ArticleDate } from '~/components/News/ArticleDate';
import { MiniAppDeveloperPill } from '~/components/News/ArticleMiniAppDeveloperPill';
import { SourcePill } from '~/components/News/ArticleSourcePill';
import { ArticleViewCount } from '~/components/News/ArticleViewCount';
import { buildScreen } from '~/components/Screen';
import { topBarHeight, useTopBar } from '~/components/TopBar';
import { imageRequestHeaders } from '~/constants/Images';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { usePush } from '~/hooks/navigation/usePush';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { NewsStackParamList } from '~/types';

const ScrollView = Animated.ScrollView;

type ArticleScreenProps = NativeStackScreenProps<NewsStackParamList, 'Article'>;

const ArticleScreen = buildScreen<ArticleScreenProps>(
  { name: 'Article', insetTop: true },
  ({
    route: {
      params: { publicId, source },
    },
  }) => {
    const t = useTheme();

    const title = React.useMemo(() => <ScreenTitle title="" />, []);

    const push = usePush();

    const pop = usePop();

    const onHeaderBackPress = React.useCallback(() => {
      pop();
    }, [pop]);

    const { trackEvent } = useAnalytics();

    const {
      data: { article },
    } = useArticle({ publicId });

    const recordArticleSeen = useRecordArticleSeen();

    const { checkUserAppContextGate } = useUserAppContextGate();

    const { value: tradeIdeasAvailable } =
      checkUserAppContextGate('trade-ideas');

    const onSharePress = React.useCallback(() => {
      trackEvent(AnalyticsEvent.ShareArticle, { publicId });

      Sharing.shareAsync(`https://farcaster.xyz/~/news/${publicId}`, {
        dialogTitle: `${article.title} / Farcaster News`,
        mimeType: 'text/plain',
        UTI: 'public.plain-text',
      });
    }, [article.title, publicId, trackEvent]);

    const { topBar } = useTopBar({
      title,
      leftIcon: (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t._mL2]}>
          <AppBackButton onPress={onHeaderBackPress} />
        </View>
      ),
      rightIcon: (
        <AnimatedPressable onPress={onSharePress} hitSlop={hitSlop}>
          <Share size={24} style={t.texts.primary} />
        </AnimatedPressable>
      ),
    });

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewArticle, { publicId, source });

        recordArticleSeen({ articleId: article.id });
      }, [article.id, publicId, recordArticleSeen, source, trackEvent]),
    );

    const articleImageStyle = React.useMemo(
      () => [t.wFull, { aspectRatio: 1.91 }],
      [t.wFull],
    );

    const articleTitleStyle = React.useMemo(
      () => [t.flex, t.flexCol, t.pX3, t.pY6, { gap: 12 }],
      [t.flex, t.flexCol, t.pX3, t.pY6],
    );

    const articleTakeawaysContainerStyle = React.useMemo(
      () => [
        t.wFull,
        t.flex,
        t.flexCol,
        t.borderT,
        t.borderDefault,
        t.pT3,
        { gap: 8 },
      ],
      [t.wFull, t.borderDefault, t.borderT, t.flex, t.flexCol, t.pT3],
    );

    const sourcesContainerStyle = React.useMemo(
      () => [t.wFull, t.flex, t.flexCol, t.pT3, t.selfStart, { gap: 12 }],
      [t.flex, t.flexCol, t.pT3, t.selfStart, t.wFull],
    );

    const sourcesItemsStyle = React.useMemo(
      () => [t.flex, t.flexRow, t.flexWrap, { gap: 12 }],
      [t.flex, t.flexRow, t.flexWrap],
    );

    const articleViewCountGated = React.useMemo(() => {
      return typeof article.viewCount !== 'undefined' && article.viewCount !== 0
        ? article.viewCount
        : undefined;
    }, [article.viewCount]);

    const handleBuyPress = React.useCallback(() => {
      if (typeof article.token !== 'undefined') {
        trackEvent(AnalyticsEvent.PressBuyTokenOnArticle, {});

        const t = article.token;

        push('Token', { ca: t.ca, chain: t.chain, via: 'article-big-cta' });
      }
    }, [article.token, push, trackEvent]);

    const launchFrame = useLaunchFrame();

    const handleMiniAppPress = React.useCallback(() => {
      if (
        typeof article.miniAppUrl !== 'undefined' &&
        typeof article.miniApp !== 'undefined'
      ) {
        trackEvent(AnalyticsEvent.PressArticleMiniApp, {
          domain: article.miniApp.domain,
        });

        const url = article.miniAppUrl;

        launchFrame({
          context: {
            type: 'open_miniapp',
            referrerDomain: 'farcaster.xyz',
          },
          config: {
            url: url.toString(),
            name: article.miniApp.name,
            splashImageUrl: article.miniApp.splashImageUrl,
            splashBackgroundColor: article.miniApp.splashBackgroundColor,
          },
          author: article.miniApp.author,
        });
      }
    }, [article.miniApp, article.miniAppUrl, launchFrame, trackEvent]);

    return (
      <View style={[t.hFull, t.flexCol]}>
        {topBar}
        <ScrollView
          style={[t.wFull, { marginTop: topBarHeight }]}
          contentContainerStyle={[t.flexCol, { paddingBottom: 56 }]}
        >
          {typeof article.imageUrl !== 'undefined' &&
            article.imageUrl !== '' && (
              <Image
                source={{ uri: article.imageUrl, headers: imageRequestHeaders }}
                style={articleImageStyle}
                cachePolicy="memory-disk"
                contentPosition={'left top'}
                contentFit="cover"
              />
            )}
          <View style={articleTitleStyle}>
            <Text2 weight="medium" size="lg">
              {article.title}
            </Text2>
            <View style={[t.flex, t.flexRow, t.justifyBetween]}>
              <ArticleDate articlePublishedAt={article.publishedAt} />
              {typeof articleViewCountGated !== 'undefined' && (
                <ArticleViewCount articleViewCount={articleViewCountGated} />
              )}
            </View>
            {typeof article.takeaways !== 'undefined' &&
              article.takeaways.length !== 0 && (
                <View style={articleTakeawaysContainerStyle}>
                  {article.takeaways.map((takeaway, index) => (
                    <View key={index} style={[t.flex, t.flexRow, t.mR3]}>
                      <BulletPoint />
                      <LinkifiedTakeaway
                        text={takeaway}
                        token={article.token}
                      />
                    </View>
                  ))}
                </View>
              )}
            {typeof article.miniApp !== 'undefined' && (
              <AnimatedPressable
                onPress={handleMiniAppPress}
                style={[t.flex1, t.h12, t.mT3]}
              >
                <View
                  style={[
                    t.flex1,
                    t.flexRow,
                    t.itemsCenter,
                    t.backgrounds.tertiary,
                    t.justifyCenter,
                    t.itemsCenter,
                    t.h12,
                    t.pX3,
                    t.gap2,
                    { borderRadius: 32 },
                  ]}
                >
                  <FrameIconImage
                    imageUrl={article.miniApp?.iconUrl}
                    size={24}
                  />
                  <Text2
                    size="lg"
                    weight="semibold"
                    color="primary"
                    numberOfLines={1}
                  >
                    {article.miniApp.buttonTitle ||
                      article.miniApp.ogTitle ||
                      'Open mini app'}
                  </Text2>
                </View>
              </AnimatedPressable>
            )}
            {typeof article.miniAppDevelopers !== 'undefined' &&
              article.miniAppDevelopers.length !== 0 && (
                <View style={sourcesContainerStyle}>
                  <Text2 weight="medium" size="sm" color="quaternary">
                    Team
                  </Text2>
                  <View style={sourcesItemsStyle}>
                    {article.miniAppDevelopers.map((developer) => (
                      <MiniAppDeveloperPill
                        key={developer.fid}
                        developer={developer}
                      />
                    ))}
                  </View>
                </View>
              )}
            {typeof article.sources !== 'undefined' &&
              article.sources.length !== 0 && (
                <View style={sourcesContainerStyle}>
                  <Text2 weight="medium" size="sm" color="quaternary">
                    Sources
                  </Text2>
                  <View style={sourcesItemsStyle}>
                    {article.sources.map((source) => (
                      <SourcePill key={source} source={source} />
                    ))}
                  </View>
                </View>
              )}
          </View>
        </ScrollView>
        {tradeIdeasAvailable && typeof article.token !== 'undefined' && (
          <LinearGradient
            colors={[t.colors.bgTransparent, t.colors.background.default]}
            locations={[0, 0.2]}
            style={[t.absolute, t.bottom0, t.wFull, t.pB3, t.pT5]}
          >
            <AnimatedPressable
              onPress={handleBuyPress}
              style={[t.flex1, t.h12, t.wFull, t.pX3]}
            >
              <View
                style={[
                  t.flex1,
                  t.backgrounds.brand,
                  t.justifyCenter,
                  t.itemsCenter,
                  t.h12,
                  t.pX3,
                  { borderRadius: 32 },
                ]}
              >
                <Text2
                  size="lg"
                  weight="semibold"
                  color="light"
                  numberOfLines={1}
                >
                  Buy {article.token.symbol}
                </Text2>
              </View>
            </AnimatedPressable>
          </LinearGradient>
        )}
      </View>
    );
  },
);

function LinkifiedTakeaway({
  text,
  token,
}: {
  text: string;
  token: ApiOnchainToken | undefined;
}) {
  const t = useTheme();

  const { linkifiedText } = useLinkifyText({
    text,
    mentions: undefined,
    // @ts-expect-error-next-line We know these don't match but all needed is the ticker here
    tokenMentionsV2:
      typeof token !== 'undefined' && typeof token.symbol !== 'undefined'
        ? [{ ...token, ticker: token.symbol }]
        : undefined,
    options: {
      skipURLTruncates: false,
      ignoreUserMentionsSet: true,
      treatImageUrlsAsLinks: true,
      textChangeAllowed: false,
    },
  });

  return (
    <Text2 weight="regular" size="base" color="primary" style={[t.flex1]}>
      {linkifiedText}
    </Text2>
  );
}

ArticleScreen.displayName = 'ArticleScreen';

export { ArticleScreen };
