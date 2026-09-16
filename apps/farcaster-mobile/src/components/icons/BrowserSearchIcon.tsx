import React, { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

const BrowserSearchIcon = memo(
  ({ size, color }: { size: number; color: string }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 34 34" fill="none">
        <Path
          d="M26.9181 27.9262L23.2559 24.2639"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M15.5833 26.9167C21.8426 26.9167 26.9167 21.8426 26.9167 15.5833C26.9167 9.32411 21.8426 4.25 15.5833 4.25C9.32411 4.25 4.25 9.32411 4.25 15.5833C4.25 21.8426 9.32411 26.9167 15.5833 26.9167Z"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M15.5839 4.25C12.6736 7.30582 11.0503 11.364 11.0503 15.584C11.0503 19.8039 12.6736 23.8622 15.5839 26.918C18.4942 23.8622 20.1175 19.8039 20.1175 15.584C20.1175 11.364 18.4942 7.30582 15.5839 4.25Z"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4.25 15.5864H26.918"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  },
);

BrowserSearchIcon.displayName = 'BrowserSearchIcon';

export { BrowserSearchIcon };
