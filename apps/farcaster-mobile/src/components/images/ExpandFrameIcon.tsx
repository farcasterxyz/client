import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ExpandFrameIconProps = {
  color: string;
  width: number;
  height: number;
  style?: ViewStyle[];
};

const ExpandFrameIcon: FC<ExpandFrameIconProps> = memo(
  ({ color, width, height, style }) => {
    return (
      <View style={[style]}>
        <Svg
          width={width}
          height={height}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke={color}
          fill="none"
        >
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </Svg>
      </View>
    );
  },
);

ExpandFrameIcon.displayName = 'ExpandFrameIcon';

export { ExpandFrameIcon };
