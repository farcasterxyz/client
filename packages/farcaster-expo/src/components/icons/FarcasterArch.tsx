import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

type FarcasterArchIcon = {
  width: number;
  height: number;
  variant?: 'purple' | 'white';
};

const FarcasterArchIcon: FC<FarcasterArchIcon> = memo(
  ({ width, height, variant = 'purple' }) => {
    const fill = variant === 'purple' ? '#7C65C1' : '#FFFFFF';
    return (
      <Svg width={width} height={height} viewBox="0 0 30 30" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.51168 6H21.0698V8.51163H24.4187L23.7447 11.0233H23.3721V21.4884C23.7189 21.4884 24.0001 21.7695 24.0001 22.1163V22.7442H24.2094C24.5561 22.7442 24.8373 23.0253 24.8373 23.3721V24H18.1396V23.3721C18.1396 23.0253 18.4207 22.7442 18.7675 22.7442H18.9768V22.1163C18.9768 21.7695 19.2579 21.4884 19.6047 21.4884V16.4651C19.6047 13.922 17.5431 11.8605 15.0001 11.8605C12.457 11.8605 10.3954 13.922 10.3954 16.4651V21.4884C10.7422 21.4884 11.0233 21.7695 11.0233 22.1163V22.7442H11.2326C11.5794 22.7442 11.8605 23.0253 11.8605 23.3721V24H5.16284V23.3721C5.16284 23.0253 5.44397 22.7442 5.79075 22.7442H6.00005V22.1163C6.00005 21.7695 6.28117 21.4884 6.62796 21.4884V11.0233H5.8368L5.16284 8.51163H8.51168V6Z"
          fill={fill}
        />
      </Svg>
    );
  },
);
FarcasterArchIcon.displayName = 'FarcasterArchIcon';

export { FarcasterArchIcon };
