import React from 'react';
import { Path, Svg } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

export function NoTokensIcon() {
  const t = useTheme();

  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14C14.5304 14 15.0391 14.2107 15.4142 14.5858C15.7893 14.9609 16 15.4696 16 16V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 4C14 3.46957 14.2107 2.96086 14.5858 2.58579C14.9609 2.21071 15.4696 2 16 2"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 10C15.4696 10 14.9609 9.78929 14.5858 9.41421C14.2107 9.03914 14 8.53043 14 8"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 14C20.5304 14 21.0391 14.2107 21.4142 14.5858C21.7893 14.9609 22 15.4696 22 16V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 2C20.5304 2 21.0391 2.21071 21.4142 2.58579C21.7893 2.96086 22 3.46957 22 4"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 8C22 8.53043 21.7893 9.03914 21.4142 9.41421C21.0391 9.78929 20.5304 10 20 10"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 7L6 10L9 7"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 10V5C6 4.20435 6.31607 3.44129 6.87868 2.87868C7.44129 2.31607 8.20435 2 9 2H10"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 14H4C2.89543 14 2 14.8954 2 16V20C2 21.1046 2.89543 22 4 22H8C9.10457 22 10 21.1046 10 20V16C10 14.8954 9.10457 14 8 14Z"
        stroke={t.colors.text.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
