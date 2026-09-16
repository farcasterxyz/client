import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import React from 'react';
import {
  cancelAnimation,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

function Result({ success }: { success: boolean }) {
  const scale = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, {
      damping: 8,
      stiffness: 200,
      mass: 0.8,
      overshootClamping: false,
    });
  }, [scale]);

  const transform = useDerivedValue(() => {
    return [
      { translateX: 16 },
      { translateY: 16 },
      { scale: scale.value },
      { translateX: -16 },
      { translateY: -16 },
    ];
  });

  return (
    <Canvas style={{ width: 32, height: 32 }}>
      <Circle
        cx={16}
        cy={16}
        r={11}
        color={success ? '#28D02C' : '#D51338'}
        transform={transform}
      />
      {success ? (
        <Path
          path="M 12 16 L 15 19 L 20 14"
          strokeWidth={2}
          style="stroke"
          color="#FFFFFF"
          transform={transform}
        />
      ) : (
        <Path
          path="M 12 12 L 20 20 M 20 12 L 12 20"
          strokeWidth={2}
          style="stroke"
          color="#FFFFFF"
          transform={transform}
        />
      )}
    </Canvas>
  );
}

function HorizontalLoadingIndicator({
  secondaryColor = '#7C65C1',
}: {
  secondaryColor?: string;
}) {
  const timing = useSharedValue(0);

  React.useEffect(() => {
    timing.value = withRepeat(
      withTiming(3, {
        duration: 1000,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(timing);
      timing.value = 0;
    };
  }, [timing]);

  const getProgress = (input: number, offset: number) => {
    'worklet';
    return Math.min(Math.max(input - offset, 0), 1);
  };

  const getCy = (input: number, offset: number) => {
    'worklet';
    const progress = getProgress(input, offset);
    if (progress < 0.5) {
      return 12 - progress * 12;
    } else {
      return 12 - (1 - progress) * 12;
    }
  };

  const leftCircleY = useDerivedValue(() => {
    return getCy(timing.value, 0);
  });

  const midCircleY = useDerivedValue(() => {
    return getCy(timing.value, 1);
  });

  const rightCircleY = useDerivedValue(() => {
    return getCy(timing.value, 2);
  });

  const leftCircleColor = useDerivedValue(() => {
    const progress = getProgress(timing.value, 0);
    return interpolateColor(
      progress,
      [0, 0.1, 0.9, 1],
      ['#FFFFFF', secondaryColor, secondaryColor, '#FFFFFF'],
    );
  });

  const midCircleColor = useDerivedValue(() => {
    const progress = getProgress(timing.value, 1);
    return interpolateColor(
      progress,
      [0, 0.1, 0.9, 1],
      ['#FFFFFF', secondaryColor, secondaryColor, '#FFFFFF'],
    );
  });

  const rightCircleColor = useDerivedValue(() => {
    const progress = getProgress(timing.value, 2);
    return interpolateColor(
      progress,
      [0, 0.1, 0.9, 1],
      ['#FFFFFF', secondaryColor, secondaryColor, '#FFFFFF'],
    );
  });

  return (
    <Canvas style={{ width: 24, height: 24 }}>
      <Circle cx={6} cy={leftCircleY} r={2} color={leftCircleColor} />
      <Circle cx={12} cy={midCircleY} r={2} color={midCircleColor} />
      <Circle cx={18} cy={rightCircleY} r={2} color={rightCircleColor} />
    </Canvas>
  );
}

export { HorizontalLoadingIndicator, Result };
