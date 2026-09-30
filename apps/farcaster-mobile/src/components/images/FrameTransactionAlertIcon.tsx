import React from 'react';
import { Path, Svg } from 'react-native-svg';

const FrameTransacationAlertIcon: React.FC = () => {
  return (
    <Svg width={40} height={40} fill="none">
      <Path
        fill="#D6A243"
        fillRule="evenodd"
        d="M15.986 8.32c1.784-3.093 6.244-3.093 8.027 0l11.36 19.72c1.782 3.093-.448 6.96-4.014 6.96H8.639c-3.565 0-5.794-3.867-4.012-6.96L15.984 8.32h.002ZM20 16.436a1.157 1.157 0 0 1 1.159 1.16v5.801A1.16 1.16 0 0 1 20 24.557a1.157 1.157 0 0 1-1.158-1.16v-5.8A1.16 1.16 0 0 1 20 16.437Zm0 12.762a1.157 1.157 0 0 0 1.159-1.16A1.16 1.16 0 0 0 20 26.878a1.157 1.157 0 0 0-1.158 1.16A1.16 1.16 0 0 0 20 29.198Z"
        clipRule="evenodd"
      />
    </Svg>
  );
};

export { FrameTransacationAlertIcon };
