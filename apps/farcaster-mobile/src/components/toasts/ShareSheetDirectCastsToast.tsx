import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useToast } from 'react-native-toast-notifications';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type ShareSheetDirectCastsToastProps = ToastProps;

const ShareSheetDirectCastsToast: React.FC<ShareSheetDirectCastsToastProps> = ({
  message,
}) => {
  const t = useTheme();

  const toast = useToast();

  const navigate = useNavigate();

  // Shared value to control the scale
  const scale = useSharedValue(1);

  // Animated style that uses the shared scale value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
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
      <Pressable
        style={[t.p2, t.pY4, t.inset0, t.wFull, t.hFull]}
        onPress={async () => {
          navigate('PlaintextDirectCasts', {});

          toast.hideAll();
        }}
      >
        <View
          pointerEvents="none"
          style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter, t.wFull]}
        >
          <Octicons
            name={'check-circle'}
            size={18}
            style={[{ color: t.colors.text.success }, t.mR2]}
          />
          <Text style={[t.texts.primary]} numberOfLines={1}>
            {message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export { ShareSheetDirectCastsToast };
