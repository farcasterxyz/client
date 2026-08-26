import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const WarningTriangleIcon = ({
  size = 24,
  fillColor = '#FFCD29',
  strokeColor = '#000000',
}: {
  size?: number;
  fillColor?: ColorValue;
  strokeColor?: ColorValue;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.7301 18L13.7301 3.99998C13.5556 3.69218 13.3027 3.43617 12.997 3.25805C12.6913 3.07993 12.3438 2.98608 11.9901 2.98608C11.6363 2.98608 11.2888 3.07993 10.9831 3.25805C10.6774 3.43617 10.4245 3.69218 10.2501 3.99998L2.25005 18C2.07373 18.3053 1.98128 18.6519 1.98206 19.0045C1.98284 19.3571 2.07683 19.7032 2.2545 20.0078C2.43217 20.3124 2.6872 20.5646 2.99375 20.7388C3.30029 20.9131 3.64746 21.0032 4.00005 21H20.0001C20.351 20.9996 20.6956 20.9069 20.9993 20.7313C21.3031 20.5556 21.5553 20.3031 21.7306 19.9991C21.9059 19.6951 21.9981 19.3504 21.998 18.9995C21.9979 18.6486 21.9055 18.3039 21.7301 18Z"
      fill={fillColor}
    />
    <Path
      d="M12 9V13"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17H12.0092"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
