import { ApiArticle } from 'farcaster-client-data';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import {
  Extrapolation,
  interpolate,
  SharedValue,
  useSharedValue,
} from 'react-native-reanimated';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';

import { useTheme } from '~/contexts/ThemeProvider';

import { ArticleCard } from './ArticleCard';

export function ArticlesCarousel({ articles }: { articles: ApiArticle[] }) {
  const { width: windowWidth } = useWindowDimensions();

  const progress = useSharedValue<number>(0);

  const t = useTheme();

  const { renderArticle } = useRenderArticle();

  const carouselWrapperStyle = React.useMemo(() => {
    return [
      t.border,
      t.borders.primary,
      t.relative,
      t.wFull,
      t.flexCol,
      t.overflowHidden,
      { borderRadius: 20 },
    ];
  }, [
    t.border,
    t.borders.primary,
    t.flexCol,
    t.overflowHidden,
    t.relative,
    t.wFull,
  ]);

  const carouselBody = React.useMemo(() => {
    if (articles.length === 1) {
      return <ArticleCard article={articles[0]} />;
    }

    return (
      <React.Fragment>
        <Carousel
          data={articles}
          height={140}
          loop={true}
          pagingEnabled={true}
          snapEnabled={true}
          width={windowWidth - 24}
          onProgressChange={progress}
          renderItem={renderArticle}
        />
        <View
          style={[
            t.absolute,
            t.bottom0,
            t.right0,
            t.flexRow,
            t.itemsCenter,
            t.mB3,
            t.w6,
            {
              height: 18,
              backgroundColor: undefined,
            },
          ]}
        />
        <View
          style={[
            t.absolute,
            t.bottom0,
            t.right0,
            t.flexRow,
            t.itemsCenter,
            t.mB3,
            t.mR3,
            t.pX2,
            {
              borderRadius: 16,
              paddingVertical: 6,
              backgroundColor: undefined,
            },
          ]}
        >
          <CarouselPagination
            progress={progress}
            data={articles.map((o) => o.id)}
          />
        </View>
      </React.Fragment>
    );
  }, [
    articles,
    progress,
    renderArticle,
    t.absolute,
    t.bottom0,
    t.flexRow,
    t.itemsCenter,
    t.mB3,
    t.mR3,
    t.pX2,
    t.right0,
    t.w6,
    windowWidth,
  ]);

  if (articles.length === 0) {
    return null;
  }

  return <View style={carouselWrapperStyle}>{carouselBody}</View>;
}

function useRenderArticle() {
  const renderArticle = React.useCallback(({ item }: { item: ApiArticle }) => {
    return (
      <View style={[{ height: 140 }]}>
        <ArticleCard article={item} />
      </View>
    );
  }, []);

  return { renderArticle };
}

function CarouselPagination({
  progress,
  data,
}: {
  progress: SharedValue<number>;
  data: string[];
}) {
  const t = useTheme();

  return (
    <Pagination.Custom
      progress={progress}
      data={data}
      size={data.length}
      dotStyle={{
        borderRadius: 16,
        backgroundColor: t.colors.gray450,
        width: 5,
        height: 5,
      }}
      activeDotStyle={{
        borderRadius: 16,
        backgroundColor: t.colors.background.brand,
        width: 5,
        height: 5,
      }}
      containerStyle={{
        gap: 8,
        alignItems: 'center',
        backgroundColor: undefined,
      }}
      horizontal={true}
      customReanimatedStyle={(progress, index, length) => {
        let val = Math.abs(progress - index);
        if (index === 0 && progress > length - 1) {
          val = Math.abs(progress - length);
        }

        return {
          transform: [
            {
              translateY: interpolate(val, [0, 1], [0, 0], Extrapolation.CLAMP),
            },
          ],
        };
      }}
    />
  );
}
