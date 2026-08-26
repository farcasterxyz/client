import React, { FC } from 'react';
import Svg, { G, Path } from 'react-native-svg';

const GeoLockedIcon: FC<{ color: string; size: number }> = ({
  color,
  size,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G>
        <Path
          d="M9.33325 4.45334L9.33325 6.66667C9.33325 7.72754 9.75468 8.74495 10.5048 9.4951C11.255 10.2452 12.2724 10.6667 13.3333 10.6667"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M14.6667 29.2667L14.6667 24C14.6667 23.2927 14.3858 22.6145 13.8857 22.1144C13.3856 21.6143 12.7073 21.3333 12.0001 21.3333C11.2928 21.3333 10.6145 21.0524 10.1144 20.5523C9.61435 20.0522 9.3334 19.3739 9.3334 18.6667L9.3334 17.3333C9.3334 16.6261 9.05245 15.9478 8.55235 15.4477C8.05225 14.9476 7.37398 14.6667 6.66673 14.6667L2.7334 14.6667"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M28.72 20L22.6667 20C21.9594 20 21.2811 20.281 20.781 20.781C20.281 21.2811 20 21.9594 20 22.6667L20 28.72"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 2.66666C13.5357 2.66681 11.1197 3.34989 9.02012 4.64008C6.92056 5.93026 5.21963 7.77707 4.10617 9.97546C2.9927 12.1739 2.51027 14.6378 2.71243 17.0938C2.91459 19.5498 3.79343 21.9017 5.25138 23.8884C6.70934 25.8752 8.68936 27.419 10.9716 28.3485C13.2539 29.278 15.7491 29.5568 18.1803 29.154C20.6114 28.7512 22.8834 27.6825 24.7439 26.0666C26.6044 24.4507 27.9807 22.3508 28.72 20"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M26.6666 7.99999L26.6666 5.33332C26.6666 4.62608 26.3856 3.9478 25.8855 3.4477C25.3854 2.94761 24.7072 2.66666 23.9999 2.66666C23.2927 2.66666 22.6144 2.94761 22.1143 3.4477C21.6142 3.9478 21.3333 4.62608 21.3333 5.33332L21.3333 7.99999"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M28.0001 8L20.0001 8C19.2637 8 18.6667 8.59695 18.6667 9.33333L18.6667 13.3333C18.6667 14.0697 19.2637 14.6667 20.0001 14.6667L28.0001 14.6667C28.7365 14.6667 29.3334 14.0697 29.3334 13.3333L29.3334 9.33333C29.3334 8.59695 28.7365 8 28.0001 8Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
GeoLockedIcon.displayName = 'GeoLockedIcon';

export { GeoLockedIcon };
