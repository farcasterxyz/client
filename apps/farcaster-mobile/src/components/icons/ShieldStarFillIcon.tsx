import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const ShieldStarFillIcon = ({
  size,
  color,
}: {
  size?: number;
  color: ColorValue;
}) => {
  return (
    <Svg width={size} height={size} fill="none" viewBox="0 0 12 12">
      <Path
        fill={color}
        fillRule="evenodd"
        d="M5.73.318a.875.875 0 0 1 .54 0l4.125 1.338c.36.117.605.452.605.832V5c0 3.094-1.885 5.352-4.7 6.414a.849.849 0 0 1-.6 0C2.885 10.352 1 8.094 1 5V2.488c0-.38.245-.715.605-.832L5.73.318ZM6.102 3.5a.14.14 0 0 1 .126.078l.574 1.162 1.282.187a.14.14 0 0 1 .078.24l-.928.904.22 1.277a.14.14 0 0 1-.205.148l-1.147-.603-1.147.603a.14.14 0 0 1-.204-.148l.22-1.277-.929-.905a.14.14 0 0 1 .078-.24l1.283-.186.573-1.162a.14.14 0 0 1 .126-.078Z"
        clipRule="evenodd"
      />
    </Svg>
  );
};
