import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const BellSlashFillIcon = ({
  size,
  fill,
}: {
  size: number;
  fill: ColorValue;
}) => {
  return (
    <Svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <Path
        fill={fill}
        fillRule="evenodd"
        d="M1.22 1.22a.75.75 0 0 1 1.06 0l20.5 20.5a.75.75 0 1 1-1.06 1.06L17.94 19H15.5a3.5 3.5 0 1 1-7 0H3.518a1.518 1.518 0 0 1-1.263-2.36l2.2-3.298A3.25 3.25 0 0 0 5 11.539V7c0-.294.025-.583.073-.866L1.22 2.28a.75.75 0 0 1 0-1.06ZM10 19a2 2 0 1 0 4 0h-4Z"
        clipRule="evenodd"
      />
      <Path
        fill={fill}
        d="M7.118 3.67a.75.75 0 0 1 .119-1.054l.05-.04C8.548 1.59 10.212 1 12 1c3.682 0 7 2.565 7 6v4.539c0 .642.19 1.269.546 1.803l1.328 1.992a.75.75 0 0 1-1.218.874L7.118 3.67Z"
      />
    </Svg>
  );
};
