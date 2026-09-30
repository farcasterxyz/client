import { ApiCast } from 'farcaster-client-data';
import { formatBidValue } from 'farcaster-client-hooks';
import { AnimatedPressable, Avatar, Text2, useTheme } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

import { CollectibleCastArtifact } from '~/components/CollectibleCast';
import { usePush } from '~/hooks/navigation/usePush';

interface CollectibleCastsCarouselProps {
  casts: ApiCast[];
}

const CarouselItem = React.memo(({ item }: { item: ApiCast }) => {
  const { width: windowWidth } = useWindowDimensions();
  const t = useTheme();
  const push = usePush();

  const onPress = useCallback(() => {
    push('CollectibleCast', {
      castHash: item.hash,
      username: item.author.username,
    });
  }, [push, item.hash, item.author.username]);

  return (
    <AnimatedPressable onPress={onPress}>
      <CollectibleCastArtifact
        cast={item}
        variant="full"
        size={windowWidth}
        shadowed={false}
        enableParallax={false}
      />
      {item.collectible?.state === 'auction-active' && (
        <View
          style={[
            t.absolute,
            t.flexRow,
            t.itemsCenter,
            {
              right: 20,
              top: 20,
              gap: 4,
              paddingVertical: 4,
              paddingHorizontal: 6,
              backgroundColor: '#5C606A',
              borderRadius: 20,
            },
          ]}
        >
          <Avatar
            diameter={22}
            pfpUrl={item.collectible.auction.topBid.bidder.pfp?.url}
          />
          <Text2 weight="semibold" style={{ color: '#FFFFFF' }} size="lg">
            {formatBidValue(item.collectible.auction.topBid.value)}
          </Text2>
        </View>
      )}
    </AnimatedPressable>
  );
});

CarouselItem.displayName = 'CarouselItem';

export const CollectibleCastsCarousel = React.memo(
  ({ casts }: CollectibleCastsCarouselProps) => {
    const { width: windowWidth } = useWindowDimensions();

    const renderCarouselItem = useCallback(
      (props: {
        item: ApiCast;
        index: number;
        animationValue: SharedValue<number>;
      }) => {
        return <CarouselItem key={props.item.hash} {...props} />;
      },
      [],
    );

    if (casts.length === 0) {
      return null;
    }

    return (
      <Carousel
        width={windowWidth}
        height={windowWidth * 1}
        containerStyle={{
          paddingTop: 0,
          marginVertical: -(windowWidth * 0.2) / 2 + 17,
        }}
        data={casts}
        renderItem={renderCarouselItem}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          width: windowWidth,
        }}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.8,
        }}
        loop
        autoPlay={false}
        windowSize={3}
        pagingEnabled
        snapEnabled
        scrollAnimationDuration={300}
      />
    );
  },
);

CollectibleCastsCarousel.displayName = 'CollectibleCastsCarousel';
