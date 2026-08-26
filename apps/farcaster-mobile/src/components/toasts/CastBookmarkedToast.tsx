import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
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
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type CastBookmarkedToastProps = ToastProps;

const CastBookmarkedToast: React.FC<CastBookmarkedToastProps> = ({ id }) => {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

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
        style={[t.inset0, t.p2, t.pY4, t.wFull, t.hFull]}
        onPress={async () => {
          trackEvent(AnalyticsEvent.PressBookmarkToast, {});

          navigate('Bookmarks', {});

          toast.hide(id);
        }}
      >
        <View
          style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter, t.wFull]}
        >
          <Ionicons
            name={'bookmark'}
            size={18}
            style={[{ color: t.colors.text.primary }, t.mR2]}
          />
          <Text style={[t.texts.primary]} numberOfLines={1}>
            Added to bookmarks
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export { CastBookmarkedToast };
