import { SendHorizonal } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { AnimatedPressable } from '../../design-system/AnimatedPressable';

interface SendButtonProps {
  width: number;
  height: number;
  onPress: () => void;
}

export function SendButton({ width, height, onPress }: SendButtonProps) {
  const t = useTheme();

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={[
          {
            width,
            height,
            borderRadius: 32,
          },
          t.backgrounds.brand,
        ]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SendHorizonal size={24} color="white" fill="white" />
        </View>
      </View>
    </AnimatedPressable>
  );
}
