import React from 'react';
import { ColorValue } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

type CircleProgressIndicatorProps = {
  progress: number;
  stroke: ColorValue;
  strokeAlternate: ColorValue;
  backgroundColor: ColorValue;
  outerRadius?: number;
  strokeWidth?: number;
  startSide?: 'right' | 'top';
};

const CircleProgressIndicator: React.FC<CircleProgressIndicatorProps> = ({
  progress,
  stroke,
  strokeAlternate,
  backgroundColor,
  outerRadius = 9.5,
  strokeWidth = 2,
  startSide = 'right',
}) => {
  // The stroke is drawn on both sides so we need to use a smaller radius for drawing
  const middleRadius = outerRadius - strokeWidth / 2;
  const circumference = 2 * Math.PI * middleRadius;
  const progressValue = (1 - progress) * circumference;

  return (
    <Svg
      width={outerRadius * 2}
      height={outerRadius * 2}
      fill={backgroundColor}
    >
      <Circle
        cx={outerRadius}
        cy={outerRadius}
        r={middleRadius}
        stroke={strokeAlternate}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={outerRadius}
        cy={outerRadius}
        r={middleRadius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={progressValue}
        transform={
          startSide === 'top'
            ? `rotate(-90, ${outerRadius}, ${outerRadius})`
            : undefined
        }
      />
    </Svg>
  );
};

CircleProgressIndicator.displayName = 'CircleProgressIndicator';

export { CircleProgressIndicator };
