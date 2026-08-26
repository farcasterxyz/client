import React from 'react';
import { Path, Svg } from 'react-native-svg';

const FrameTransacationDangerIcon: React.FC = () => {
  return (
    <Svg width={40} height={40} fill="none">
      <Path
        fill="#D84F4F"
        fillRule="evenodd"
        d="M20.678 4.474a1.062 1.062 0 0 0-1.356 0 23.894 23.894 0 0 1-14.156 5.5 1 1 0 0 0-.958.85A24.22 24.22 0 0 0 4 14c0 10.326 6.52 19.128 15.668 22.514a.96.96 0 0 0 .664 0C29.48 33.128 36 24.326 36 14c0-1.076-.07-2.138-.208-3.178a1 1 0 0 0-.96-.85 23.892 23.892 0 0 1-14.154-5.498ZM20 12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 1 1-3 0v-7A1.5 1.5 0 0 1 20 12Zm0 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        clipRule="evenodd"
      />
    </Svg>
  );
};

export { FrameTransacationDangerIcon };
