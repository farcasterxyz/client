import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../../../contexts';

export function CircularProgress({
  progress,
  size = 14,
  strokeWidth = 2,
  color,
  backgroundColor,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const t = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const resolvedColor = color ?? t.colors.text.success;
  const resolvedBgColor = backgroundColor ?? t.colors.border.secondary;

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={resolvedBgColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={resolvedColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export function DottedCircle({ size = 14 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path
        d="M14 7.5C14 5.77609 13.3152 4.12279 12.0962 2.90381C10.8772 1.68482 9.22391 1 7.5 1C5.77609 1 4.12279 1.68482 2.90381 2.90381C1.68482 4.12279 1 5.77609 1 7.5C1 9.22391 1.68482 10.8772 2.90381 12.0962C4.12279 13.3152 5.77609 14 7.5 14C9.22391 14 10.8772 13.3152 12.0962 12.0962C13.3152 10.8772 14 9.22391 14 7.5L14 7.5Z"
        stroke={t.colors.text.secondary}
        strokeWidth="2"
        strokeDasharray="2, 2"
      />
    </Svg>
  );
}

export function RedCircle({ size = 14 }: { size?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.colors.text.danger,
      }}
    />
  );
}
