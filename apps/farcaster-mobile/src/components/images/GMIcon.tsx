import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type GMIconProps = {
  color: string;
  width: number;
  height: number;
  style?: ViewStyle[];
};

const GMIcon: FC<GMIconProps> = memo(({ color, width, height, style }) => {
  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox="0 0 14 14" fill={color}>
        <Path d="M4.32854 6.0076H5.93664C5.8136 4.83555 4.7463 4 3.36139 4C1.7819 4 0.5 5.08365 0.5 7.01141C0.5 8.85932 1.66172 10 3.37283 10C4.90654 10 6.00531 9.06464 6.00531 7.46768V6.65779H3.40717V7.78707H4.47161C4.4573 8.29468 4.09676 8.61977 3.38428 8.61977C2.5602 8.61977 2.13671 8.01521 2.13671 6.98859C2.13671 5.97624 2.59454 5.38023 3.39572 5.38023C3.89361 5.38023 4.23125 5.60837 4.32854 6.0076Z" />
        <Path d="M6.74712 4.07985V9.92015H8.30372V6.52091H8.3495L9.65429 9.87453H10.5928L11.8976 6.54373H11.9434V9.92015H13.5V4.07985H11.5199L10.1579 7.38783H10.0892L8.7272 4.07985H6.74712Z" />
      </Svg>
    </View>
  );
});

GMIcon.displayName = 'GMIcon';

export { GMIcon };
