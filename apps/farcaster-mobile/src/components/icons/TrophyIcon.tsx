import React, { FC } from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

const TrophyIcon: FC<{ color: string; size: number }> = ({ color, size }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <G id="Frame" clipPath="url(#clip0_5915_15640)">
        <Path
          id="Vector"
          d="M4.5 6.75H3.375C2.87772 6.75 2.40081 6.55246 2.04917 6.20083C1.69754 5.84919 1.5 5.37228 1.5 4.875C1.5 4.37772 1.69754 3.90081 2.04917 3.54917C2.40081 3.19754 2.87772 3 3.375 3H4.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_2"
          d="M13.5 6.75H14.625C15.1223 6.75 15.5992 6.55246 15.9508 6.20083C16.3025 5.84919 16.5 5.37228 16.5 4.875C16.5 4.37772 16.3025 3.90081 15.9508 3.54917C15.5992 3.19754 15.1223 3 14.625 3H13.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_3"
          d="M3 16.5H15"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_4"
          d="M7.5 10.9951V12.7501C7.5 13.1626 7.1475 13.4851 6.7725 13.6576C5.8875 14.0626 5.25 15.1801 5.25 16.5001"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_5"
          d="M10.5 10.9951V12.7501C10.5 13.1626 10.8525 13.4851 11.2275 13.6576C12.1125 14.0626 12.75 15.1801 12.75 16.5001"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_6"
          d="M13.5 1.5H4.5V6.75C4.5 7.94347 4.97411 9.08807 5.81802 9.93198C6.66193 10.7759 7.80653 11.25 9 11.25C10.1935 11.25 11.3381 10.7759 12.182 9.93198C13.0259 9.08807 13.5 7.94347 13.5 6.75V1.5Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_5915_15640">
          <Rect width="18" height="18" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};
TrophyIcon.displayName = 'TrophyIcon';

export { TrophyIcon };
