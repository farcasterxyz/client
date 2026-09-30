import React, { isValidElement, useMemo } from 'react';
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

type GenericToastProps = ToastProps;

// Optional data params:
// - icon: Octicons icon name, if present, text aligns to left, if not present, aligns to center
// - onClick: function to call when the toast is pressed (next to toast getting hidden)
// - mutedMessage: additional message we may want to show muted
const GenericToast: React.FC<GenericToastProps> = ({ id, message, data }) => {
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

  const icon = useMemo(
    () =>
      data && 'icon' in data && isValidElement(data.icon)
        ? (data.icon as React.ReactElement)
        : undefined,
    [data],
  );

  const mutedMessage = useMemo(
    () =>
      data && 'mutedMessage' in data && typeof data.mutedMessage === 'string'
        ? data.mutedMessage
        : undefined,
    [data],
  );

  return (
    <Animated.View
      style={[
        t.mB1,
        { width: '80%' },
        animatedStyle,
        t.relative,
        t.shadowLg,
        t.flexCol,
        t.justifyCenter,
        t.itemsCenter,
      ]}
      onTouchStart={() => {
        scale.value = withSpring(0.9);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
    >
      <Pressable
        style={[
          {
            backgroundColor: t.dark ? t.colors.vibrantCedar : t.colors.white,
          },
          t.roundedLg,
          t.borderDefault,
          t.borderHairline,
          t.inset0,
          t.flexRow,
          t.flexShrink,
          t.itemsCenter,
          t.justifyCenter,
          t.pX4,
          t.pY3,
        ]}
        onPress={async () => {
          toast.hide(id);

          if (data && 'onClick' in data) {
            const onClick = data.onClick as () => Promise<void>;
            await onClick();
          }
        }}
      >
        {icon && <View style={[t.mR3]}>{icon}</View>}
        <View
          style={[
            t.flexShrink,
            // Super weird workaround for the text taking full width when wrapping
            // even when not needed
            {
              borderWidth: 1,
              borderColor: t.dark ? t.colors.vibrantCedar : t.colors.white,
            },
          ]}
        >
          <Text style={[t.texts.primary, !icon && t.textCenter]}>
            {message}
          </Text>
          {mutedMessage && (
            <Text style={[t.texts.secondary, !icon && t.textCenter]}>
              {mutedMessage}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export { GenericToast };
