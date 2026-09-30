import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useToast } from 'react-native-toast-notifications';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

const ShareSheetCopyToClipboardToast: React.FC = () => {
  const t = useTheme();

  const toast = useToast();

  // Shared value to control the scale
  const scale = useSharedValue(1);

  // Animated style that uses the shared scale value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      style={[t.inset0, t.wFull, t.hFull]}
      onPress={async () => {
        toast.hideAll();
      }}
    >
      <Animated.View
        style={[
          t.p2,
          t.pY4,
          t.bgMuted,
          { borderRadius: t.borderRadiuses.$12 },
          t.borderDefault,
          t.border,
          t.flex,
          t.flexCol,
          t.mB1,
          { width: '80%' },
          animatedStyle,
          t.relative,
        ]}
        onTouchStart={() => {
          scale.value = withSpring(0.9);
        }}
        onTouchEnd={() => {
          scale.value = withSpring(1);
        }}
      >
        <View
          style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter, t.wFull]}
        >
          <Octicons
            name={'link'}
            size={18}
            style={[{ color: t.colors.text.primary }, t.mR2]}
          />
          <Text style={[t.texts.primary]} numberOfLines={1}>
            Copied to clipboard
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export { ShareSheetCopyToClipboardToast };
