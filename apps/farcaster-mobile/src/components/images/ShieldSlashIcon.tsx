import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const ShieldSlashIcon = ({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12.54 1.137a1.75 1.75 0 0 0-1.08 0L6.018 2.905a.75.75 0 1 0 .464 1.427l5.441-1.768a.25.25 0 0 1 .154 0l8.25 2.675a.25.25 0 0 1 .173.237V10.5c0 1.284-.24 2.83-.696 3.972a.75.75 0 1 0 1.392.557C21.74 13.67 22 11.927 22 10.5V5.476c0-.759-.49-1.43-1.21-1.664l-8.25-2.675Z"
    />
    <Path
      fill={color}
      fillRule="evenodd"
      d="m2.017 4.843-.974-.748a.75.75 0 1 1 .914-1.19l20.5 15.75a.75.75 0 0 1-.914 1.19l-2.012-1.546-.702.852-.008.01-.008.009c-1.603 1.82-3.731 3.223-6.214 4.16a1.697 1.697 0 0 1-1.198 0C5.771 21.204 2 16.69 2 10.5V5c0-.054.006-.107.017-.157ZM3.5 5.983V10.5c0 5.461 3.28 9.483 8.43 11.426a.197.197 0 0 0 .139 0c2.283-.861 4.192-2.13 5.61-3.738l.662-.803L3.5 5.982Z"
      clipRule="evenodd"
    />
  </Svg>
);
