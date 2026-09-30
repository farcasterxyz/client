import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiArticle } from 'farcaster-client-data';
import { usePrefetchArticle } from 'farcaster-client-hooks';
import { Text2, useHaptics } from 'farcaster-expo';
import React from 'react';
import { Pressable, View } from 'react-native';

import { TokenPill } from '~/components/News/ArticleTokenPill';
import { imageRequestHeaders } from '~/constants/Images';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

export function ArticleCard({ article }: { article: ApiArticle }) {
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

  const pressableStyle = React.useMemo(() => {
    return [
      t.relative,
      t.wFull,
      t.flexCol,
      t.overflowHidden,
      t.justifyBetween,
      t.p3,
      t.flex1,
    ];
  }, [
    t.flex1,
    t.flexCol,
    t.justifyBetween,
    t.overflowHidden,
    t.p3,
    t.relative,
    t.wFull,
  ]);

  return (
    <Pressable style={pressableStyle} onPress={onArticlePress}>
      <View style={[t.flexCol, { gap: 8 }]}>
        <Text2 weight="semibold" size="lg" color="primary" numberOfLines={2}>
          {article.title}
        </Text2>
        <Text2 weight="regular" size="base" color="secondary" numberOfLines={2}>
          {article.description}
        </Text2>
      </View>
      {tradeIdeasAvailable && typeof article.token !== 'undefined' && (
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.mT4,
            // Need this since we are wrapped by a pressable. Used to be absolute
            // positioned and work without it.
            t.z10,
          ]}
        >
          <TokenPill token={article.token} hidePriceChange={true} />
        </View>
      )}
      <LinearGradient
        colors={['rgba(98, 126, 234, 0.12)', 'rgba(220, 31, 255, 0.03)']}
        locations={[0.0778, 0.8277]}
        start={{ x: 0.0076, y: 0.5868 }}
        end={{ x: 0.9924, y: 0.4132 }}
        style={[t.absolute, t.inset0]}
      />
    </Pressable>
  );
}
