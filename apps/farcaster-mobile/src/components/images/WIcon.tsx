import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type WIconProps = {
  color: string;
  width: number;
  height: number;
  style?: ViewStyle[];
};

const WIcon: FC<WIconProps> = memo(({ color, width, height, style }) => {
  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox="0 0 18 18" fill={color}>
        <Path d="M11.964 5L10.964 8.75555L9.96076 5H7.652L6.63914 8.7832L5.62959 5H3L5.44349 13.3035H7.7121L8.7969 9.44767L9.88167 13.3035H12.1552L14.5933 5H11.964Z" />
      </Svg>
    </View>
  );
});

WIcon.displayName = 'WIcon';

export { WIcon };
