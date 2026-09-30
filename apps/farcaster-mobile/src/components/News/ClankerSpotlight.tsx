import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiArticle } from 'farcaster-client-data';
import { usePrefetchArticle } from 'farcaster-client-hooks';
import { AnimatedPressable, Text2, useHaptics } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import ClankerSpotlightImage from '~/assets/images/ClankerSpotlight.webp';
import { TokenPill } from '~/components/News/ArticleTokenPill';
import { imageRequestHeaders } from '~/constants/Images';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

export function ClankerSpotlight({ article }: { article: ApiArticle }) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const push = usePush();

  const { triggerImpactAsync } = useHaptics();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const { value: tradeIdeasAvailable } = checkUserAppContextGate('trade-ideas');

  const onArticlePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressArticle, {
      publicId: article.publicId,
    });

    triggerImpactAsync();

    push('Article', { publicId: article.publicId, source: 'trade-ideas-feed' });
  }, [article.publicId, push, trackEvent, triggerImpactAsync]);

  const prefetchArticle = usePrefetchArticle();

  const prefetchRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (!prefetchRef.current) {
      prefetchArticle({ publicId: article.publicId });

      Image.prefetch([article.imageUrl], {
        cachePolicy: 'memory-disk',
        headers: imageRequestHeaders,
      });

      prefetchRef.current = true;
    }

    return () => {
      prefetchRef.current = false;
    };
  }, [article.imageUrl, article.publicId, prefetchArticle]);

  return (
    <AnimatedPressable
      style={[
        {
          backgroundColor: t.dark
            ? t.colors.background.secondary
            : t.colors.background.default,
        },
        t.relative,
        t.wFull,
        t.flexCol,
        t.overflowHidden,
        t.justifyBetween,
        t.gap2,
        t.border,
        t.borders.primary,
        { borderRadius: 16 },
        t.relative,
      ]}
      onPress={onArticlePress}
    >
      <View
        style={[
          t.wFull,
          t.absolute,
          t.dark && [t.opacity75],
          { aspectRatio: 1.75 },
        ]}
      >
        <Image
          source={ClankerSpotlightImage}
          style={[{ height: '100%', width: '100%' }]}
        />
      </View>
      <View style={[t.flex, t.flexCol, t.gap2, t.p3]}>
        <Text2 size="xl" weight="semibold" color={'brand'}>
          {article.title}
        </Text2>
        <Text2 weight="regular" size="base" color={'light'} numberOfLines={4}>
          {article.description}
        </Text2>
        {tradeIdeasAvailable && typeof article.token !== 'undefined' && (
          <View
            style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween, t.mT2]}
          >
            <TokenPill token={article.token} hidePriceChange={true} />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}
