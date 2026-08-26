import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

type ShieldCheckFillIconProps = {
  color: string;
  height: number;
};

const ShieldCheckFillIcon: FC<ShieldCheckFillIconProps> = memo(
  ({ color, height }) => {
    return (
      <Svg
        width={(14 / 16) * height}
        height={height}
        viewBox="0 0 14 16"
        fill="none"
      >
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.63975 0.424582C6.8737 0.348707 7.12565 0.348707 7.3596 0.424583L12.8596 2.20837C13.3402 2.36423 13.6663 2.81155 13.6663 3.31764V6.66682C13.6663 10.793 11.1525 13.8034 7.39901 15.2197C7.14191 15.3167 6.85744 15.3167 6.60034 15.2197C2.84687 13.8034 0.333011 10.793 0.333008 6.66683V3.31745C0.333008 2.81119 0.659323 2.36418 1.13975 2.20837L6.63975 0.424582ZM10.0202 5.81311C10.2155 6.00837 10.2155 6.32496 10.0202 6.52022L6.68689 9.85355C6.49162 10.0488 6.17504 10.0488 5.97978 9.85355L4.31311 8.18689C4.11785 7.99162 4.11785 7.67504 4.31311 7.47978C4.50838 7.28452 4.82496 7.28452 5.02022 7.47978L6.33333 8.79289L9.31311 5.81311C9.50838 5.61785 9.82496 5.61785 10.0202 5.81311Z"
          fill={color}
        />
      </Svg>
    );
  },
);

ShieldCheckFillIcon.displayName = 'ShieldCheckFillIcon';

export { ShieldCheckFillIcon };
