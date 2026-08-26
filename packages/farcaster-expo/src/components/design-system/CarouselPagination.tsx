import React from 'react';
import {
  Extrapolation,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { Pagination } from 'react-native-reanimated-carousel';

import { useTheme } from '../../contexts/ThemeContext';

export function CarouselPagination({
  progress,
  data,
  onPress,
}: {
  progress: SharedValue<number>;
  data: string[];
  onPress?: (index: number) => void;
}) {
  const t = useTheme();

  return (
    <Pagination.Custom
      progress={progress}
      data={data}
      size={4}
      dotStyle={{
        borderRadius: 16,
        backgroundColor: t.colors.bgLightPurple,
      }}
      activeDotStyle={{
        borderRadius: 16,
        backgroundColor: t.colors.actionPrimary,
      }}
      containerStyle={{
        gap: 6,
        alignItems: 'center',
      }}
      horizontal
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
      onPress={onPress}
    />
  );
}
