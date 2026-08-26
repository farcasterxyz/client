import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type XTopHatIconProps = {
  color: string;
  size: number;
  style?: ViewStyle[];
};

const XTopHatIcon: FC<XTopHatIconProps> = memo(({ color, size, style }) => {
  return (
    <View style={[style]}>
      <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
        <Path
          d="M9.12201 1.125H10.776L7.16251 5.255L11.4135 10.875H8.08501L5.47801 7.4665L2.49501 10.875H0.840014L4.70501 6.4575L0.627014 1.125H4.04001L6.39651 4.2405L9.12201 1.125ZM8.54151 9.885H9.45801L3.54201 2.063H2.55851L8.54151 9.885Z"
          fill={color}
        />
      </Svg>
    </View>
  );
});
XTopHatIcon.displayName = 'XTopHatIcon';

export { XTopHatIcon };
