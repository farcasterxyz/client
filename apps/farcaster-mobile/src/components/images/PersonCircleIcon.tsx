import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

type PersonCircleIconProps = {
  color: string;
  size: number;
};

const PersonCircleIcon: FC<PersonCircleIconProps> = memo(({ color, size }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12 13.3335C12 12.2726 11.5786 11.2552 10.8284 10.5051C10.0783 9.75492 9.06087 9.3335 8 9.3335C6.93913 9.3335 5.92172 9.75492 5.17157 10.5051C4.42143 11.2552 4 12.2726 4 13.3335"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.00016 9.33333C9.47292 9.33333 10.6668 8.13943 10.6668 6.66667C10.6668 5.19391 9.47292 4 8.00016 4C6.5274 4 5.3335 5.19391 5.3335 6.66667C5.3335 8.13943 6.5274 9.33333 8.00016 9.33333Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.00016 14.6668C11.6821 14.6668 14.6668 11.6821 14.6668 8.00016C14.6668 4.31826 11.6821 1.3335 8.00016 1.3335C4.31826 1.3335 1.3335 4.31826 1.3335 8.00016C1.3335 11.6821 4.31826 14.6668 8.00016 14.6668Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});
PersonCircleIcon.displayName = 'PersonCircleIcon';

export { PersonCircleIcon };
