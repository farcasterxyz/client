import { hitSlop, useTheme } from 'farcaster-expo';
import React from 'react';
import { ColorValue, GestureResponderEvent, Pressable } from 'react-native';

function IconPressable({
  Icon,
  onPress,
}: {
  Icon: (props: { size: number; color: ColorValue }) => React.ReactElement;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        {
          height: 34,
          width: 34,
          backgroundColor: 'rgba(36, 41, 46, 0.50)',
        },
      ]}
    >
      {Icon({ color: '#FFFFFF', size: 16 })}
    </Pressable>
  );
}

export { IconPressable };
