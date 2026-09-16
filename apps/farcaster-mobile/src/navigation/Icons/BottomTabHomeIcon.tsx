import { useTheme } from 'farcaster-expo';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Default() {
  const t = useTheme();

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M23 29V21C23 20.7348 22.8946 20.4804 22.7071 20.2929C22.5196 20.1054 22.2652 20 22 20H18C17.7348 20 17.4804 20.1054 17.2929 20.2929C17.1054 20.4804 17 20.7348 17 21V29"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 18C10.9999 17.7091 11.0633 17.4216 11.1858 17.1577C11.3082 16.8938 11.4868 16.6598 11.709 16.472L18.709 10.473C19.07 10.1679 19.5274 10.0005 20 10.0005C20.4726 10.0005 20.93 10.1679 21.291 10.473L28.291 16.472C28.5132 16.6598 28.6918 16.8938 28.8142 17.1577C28.9367 17.4216 29.0001 17.7091 29 18V27C29 27.5304 28.7893 28.0391 28.4142 28.4142C28.0391 28.7893 27.5304 29 27 29H13C12.4696 29 11.9609 28.7893 11.5858 28.4142C11.2107 28.0391 11 27.5304 11 27V18Z"
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
        d="M11 18C10.9999 17.7091 11.0633 17.4216 11.1858 17.1577C11.3082 16.8938 11.4868 16.6598 11.709 16.472L18.709 10.473C19.07 10.1679 19.5274 10.0005 20 10.0005C20.4726 10.0005 20.93 10.1679 21.291 10.473L28.291 16.472C28.5132 16.6598 28.6918 16.8938 28.8142 17.1577C28.9367 17.4216 29.0001 17.7091 29 18V27C29 27.5304 28.7893 28.0391 28.4142 28.4142C28.0391 28.7893 27.5304 29 27 29H13C12.4696 29 11.9609 28.7893 11.5858 28.4142C11.2107 28.0391 11 27.5304 11 27V18Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23 29V21C23 20.7348 22.8946 20.4804 22.7071 20.2929C22.5196 20.1054 22.2652 20 22 20H18C17.7348 20 17.4804 20.1054 17.2929 20.2929C17.1054 20.4804 17 20.7348 17 21V29"
        fill={t.colors.background.default}
      />
      <Path
        d="M23 29V21C23 20.7348 22.8946 20.4804 22.7071 20.2929C22.5196 20.1054 22.2652 20 22 20H18C17.7348 20 17.4804 20.1054 17.2929 20.2929C17.1054 20.4804 17 20.7348 17 21V29H23Z"
        stroke={t.colors.text.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
