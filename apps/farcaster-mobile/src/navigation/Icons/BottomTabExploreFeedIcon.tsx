import { useTheme } from 'farcaster-expo';
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function Default() {
  const t = useTheme();

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M30 20C30 25.5228 25.5228 30 20 30M30 20C30 14.4772 25.5228 10 20 10M30 20H10M20 30C14.4772 30 10 25.5228 10 20M20 30C17.4322 27.3038 16 23.7233 16 20C16 16.2767 17.4322 12.6962 20 10M20 30C22.5678 27.3038 24 23.7233 24 20C24 16.2767 22.5678 12.6962 20 10M10 20C10 14.4772 14.4772 10 20 10"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Selected() {
  const t = useTheme();

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="20" r="10" fill={t.colors.text.primary} />
      <Path
        d="M30 20C30 25.5228 25.5228 30 20 30M30 20C30 14.4772 25.5228 10 20 10M30 20H10M20 30C14.4772 30 10 25.5228 10 20M20 30C17.4322 27.3038 16 23.7233 16 20C16 16.2767 17.4322 12.6962 20 10M20 30C22.5678 27.3038 24 23.7233 24 20C24 16.2767 22.5678 12.6962 20 10M10 20C10 14.4772 14.4772 10 20 10"
        stroke={t.colors.text.inverted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
