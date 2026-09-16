import { useTheme } from 'farcaster-expo';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Default() {
  const t = useTheme();

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M17 11H12C11.4477 11 11 11.4477 11 12V17C11 17.5523 11.4477 18 12 18H17C17.5523 18 18 17.5523 18 17V12C18 11.4477 17.5523 11 17 11Z"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28 11H23C22.4477 11 22 11.4477 22 12V17C22 17.5523 22.4477 18 23 18H28C28.5523 18 29 17.5523 29 17V12C29 11.4477 28.5523 11 28 11Z"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28 22H23C22.4477 22 22 22.4477 22 23V28C22 28.5523 22.4477 29 23 29H28C28.5523 29 29 28.5523 29 28V23C29 22.4477 28.5523 22 28 22Z"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 22H12C11.4477 22 11 22.4477 11 23V28C11 28.5523 11.4477 29 12 29H17C17.5523 29 18 28.5523 18 28V23C18 22.4477 17.5523 22 17 22Z"
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
      <Path
        d="M17 11H12C11.4477 11 11 11.4477 11 12V17C11 17.5523 11.4477 18 12 18H17C17.5523 18 18 17.5523 18 17V12C18 11.4477 17.5523 11 17 11Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28 11H23C22.4477 11 22 11.4477 22 12V17C22 17.5523 22.4477 18 23 18H28C28.5523 18 29 17.5523 29 17V12C29 11.4477 28.5523 11 28 11Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M28 22H23C22.4477 22 22 22.4477 22 23V28C22 28.5523 22.4477 29 23 29H28C28.5523 29 29 28.5523 29 28V23C29 22.4477 28.5523 22 28 22Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 22H12C11.4477 22 11 22.4477 11 23V28C11 28.5523 11.4477 29 12 29H17C17.5523 29 18 28.5523 18 28V23C18 22.4477 17.5523 22 17 22Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
