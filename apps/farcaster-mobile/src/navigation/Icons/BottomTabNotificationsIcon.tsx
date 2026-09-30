import { useTheme } from 'farcaster-expo';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Default() {
  const t = useTheme();

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M14 16C14 14.4087 14.6321 12.8826 15.7574 11.7574C16.8826 10.6321 18.4087 10 20 10C21.5913 10 23.1174 10.6321 24.2426 11.7574C25.3679 12.8826 26 14.4087 26 16C26 23 29 25 29 25H11C11 25 14 23 14 16Z"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.3 29C18.4674 29.3044 18.7135 29.5583 19.0125 29.7352C19.3116 29.912 19.6526 30.0053 20 30.0053C20.3475 30.0053 20.6885 29.912 20.9876 29.7352C21.2866 29.5583 21.5327 29.3044 21.7 29"
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
        d="M14 16C14 14.4087 14.6321 12.8826 15.7574 11.7574C16.8826 10.6321 18.4087 10 20 10C21.5913 10 23.1174 10.6321 24.2426 11.7574C25.3679 12.8826 26 14.4087 26 16C26 23 29 25 29 25H11C11 25 14 23 14 16Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.3 29C18.4674 29.3044 18.7135 29.5583 19.0125 29.7352C19.3116 29.912 19.6526 30.0053 20 30.0053C20.3475 30.0053 20.6885 29.912 20.9876 29.7352C21.2866 29.5583 21.5327 29.3044 21.7 29"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
