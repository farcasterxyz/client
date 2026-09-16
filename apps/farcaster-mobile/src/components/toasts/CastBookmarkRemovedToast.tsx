import { Ionicons } from '@expo/vector-icons';
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
import { useNavigate } from '~/hooks/navigation/useNavigate';

const CastBookmarkRemovedToast: React.FC = () => {
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
        t.roundedLg,
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
        style={[t.inset0, t.p2, t.pY4, t.wFull, t.hFull]}
        onPress={async () => {
          navigate('Bookmarks', {});

          toast.hideAll();
        }}
      >
        <View
          style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter, t.wFull]}
        >
          <Ionicons
            name={'bookmark-outline'}
            size={18}
            style={[{ color: t.colors.bgActionFrameTx }, t.mR2]}
          />
          <Text style={[t.texts.primary]} numberOfLines={1}>
            Removed from bookmarks
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export { CastBookmarkRemovedToast };
