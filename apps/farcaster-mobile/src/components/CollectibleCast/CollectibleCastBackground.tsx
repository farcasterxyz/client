import {
  Canvas,
  LinearGradient,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useTheme } from 'farcaster-expo';
import React, { useMemo } from 'react';
import { Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function CollectibleCastBackground({
  state,
}: {
  state: 'minted' | 'auction-active' | 'auction-pending' | 'unavailable';
}) {
  const t = useTheme();

  if (state === 'minted') {
    return <CollectibleCastMintedBackground />;
  }

  return <View style={[t.flex1, t.bgLightGray]} />;
}

function CollectibleCastMintedBackground() {
  const gradientHeight = SCREEN_HEIGHT + 100;

  // Pre-compute colors for performance
  const colors = useMemo(() => {
    return {
      // First gradient: top to 30.29%
      gradient1: [
        Skia.Color('rgba(102, 102, 102, 0.20)'),
        Skia.Color('rgba(102, 102, 102, 0.00)'),
      ],
      // Second gradient: 61.2% to bottom
      gradient2: [
        Skia.Color('rgba(102, 102, 102, 0.00)'),
        Skia.Color('rgba(102, 102, 102, 0.40)'),
      ],
      // Base color
      baseColor: Skia.Color('#1D1D1D'),
    };
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: gradientHeight,
      }}
    >
      <Canvas style={{ flex: 1 }}>
        {/* Base color */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={gradientHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, gradientHeight)}
            colors={[colors.baseColor, colors.baseColor]}
          />
        </Rect>

        {/* First gradient overlay */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={gradientHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, gradientHeight)}
            colors={colors.gradient1}
            positions={[0, 0.3029]}
          />
        </Rect>

        {/* Second gradient overlay */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={gradientHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, gradientHeight)}
            colors={colors.gradient2}
            positions={[0.612, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}
