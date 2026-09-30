import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

type PhoneIconProps = {
  color: string;
  size: number;
};

// From Lucide font
const PhoneIcon: FC<PhoneIconProps> = memo(({ color, size }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.66663 1.99935C4.29844 1.99935 3.99996 2.29783 3.99996 2.66602V13.3327C3.99996 13.7009 4.29844 13.9993 4.66663 13.9993H11.3333C11.7015 13.9993 12 13.7009 12 13.3327V2.66602C12 2.29783 11.7015 1.99935 11.3333 1.99935H4.66663ZM2.66663 2.66602C2.66663 1.56145 3.56206 0.666016 4.66663 0.666016H11.3333C12.4379 0.666016 13.3333 1.56145 13.3333 2.66602V13.3327C13.3333 14.4373 12.4379 15.3327 11.3333 15.3327H4.66663C3.56206 15.3327 2.66663 14.4373 2.66663 13.3327V2.66602Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.33337 12.0007C7.33337 11.6325 7.63185 11.334 8.00004 11.334H8.00671C8.3749 11.334 8.67337 11.6325 8.67337 12.0007C8.67337 12.3688 8.3749 12.6673 8.00671 12.6673H8.00004C7.63185 12.6673 7.33337 12.3688 7.33337 12.0007Z"
        fill={color}
      />
    </Svg>
  );
});
PhoneIcon.displayName = 'PhoneIcon';

export { PhoneIcon };
