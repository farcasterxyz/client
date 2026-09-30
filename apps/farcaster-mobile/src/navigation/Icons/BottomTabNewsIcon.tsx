import { useTheme } from 'farcaster-expo';
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Default() {
  const t = useTheme();

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Path
        d="M23 26H18M26 22H18M12 30H28C28.5304 30 29.0391 29.7893 29.4142 29.4142C29.7893 29.0391 30 28.5304 30 28V12C30 11.4696 29.7893 10.9609 29.4142 10.5858C29.0391 10.2107 28.5304 10 28 10H16C15.4696 10 14.9609 10.2107 14.5858 10.5858C14.2107 10.9609 14 11.4696 14 12V28C14 28.5304 13.7893 29.0391 13.4142 29.4142C13.0391 29.7893 12.5304 30 12 30ZM12 30C11.4696 30 10.9609 29.7893 10.5858 29.4142C10.2107 29.0391 10 28.5304 10 28V19C10 18.4696 10.2107 17.9609 10.5858 17.5858C10.9609 17.2107 11.4696 17 12 17H14M19 14H25C25.5523 14 26 14.4477 26 15V17C26 17.5523 25.5523 18 25 18H19C18.4477 18 18 17.5523 18 17V15C18 14.4477 18.4477 14 19 14Z"
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
        d="M28 30.25H12C12.5304 30.25 13.0391 30.034 13.4142 29.6496C13.7893 29.2651 14 28.7437 14 28.2V11.8C14 11.2563 14.2107 10.7349 14.5858 10.3504C14.9609 9.96598 15.4696 9.75 16 9.75H28C28.5304 9.75 29.0391 9.96598 29.4142 10.3504C29.7893 10.7349 30 11.2563 30 11.8V28.2C30 28.7437 29.7893 29.2651 29.4142 29.6496C29.0391 30.034 28.5304 30.25 28 30.25Z"
        fill={t.colors.text.primary}
        stroke={t.colors.text.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.4142 28.4142C11.7893 28.0391 12 27.5304 12 27V16H10C9.46957 16 8.96086 16.2107 8.58579 16.5858C8.21071 16.9609 8 17.4696 8 18V27C8 27.5304 8.21071 28.0391 8.58579 28.4142C8.96086 28.7893 9.46957 29 10 29C10.5304 29 11.0391 28.7893 11.4142 28.4142Z"
        fill={t.colors.text.primary}
      />
      <Path
        d="M25 14H19C18.4477 14 18 14.4477 18 15V17C18 17.5523 18.4477 18 19 18H25C25.5523 18 26 17.5523 26 17V15C26 14.4477 25.5523 14 25 14Z"
        fill={t.colors.background.default}
        stroke={t.colors.background.default}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M23 26H18H23Z" fill={t.colors.background.default} />
      <Path d="M26 22H18H26Z" fill={t.colors.background.default} />
      <Path
        d="M23 26H18M26 22H18"
        stroke={t.colors.background.default}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
