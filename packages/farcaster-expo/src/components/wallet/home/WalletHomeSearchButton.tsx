import { LinearGradient } from 'expo-linear-gradient';
import { Search, X } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../../contexts';
import { AnimatedPressable } from '../../design-system';

const width = Dimensions.get('window').width;
const padding = 8;
const paddingBottom = 12;

export function WalletHomeSearchButton({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string | null;
  setSearchQuery: (query: string | null) => void;
}) {
  const t = useTheme();
  const isExpanded = searchQuery !== null;

  const inputRef = React.useRef<TextInput>(null);

  // Simplified animation values - no keyboard handling needed
  const expandAnimation = useSharedValue(0);

  const handlePress = React.useCallback(() => {
    'worklet';
    expandAnimation.set(
      withSpring(1, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
        overshootClamping: true,
      }),
    );

    runOnJS(setSearchQuery)('');

    runOnJS(() => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    })();
  }, [expandAnimation, setSearchQuery]);

  const handleClose = React.useCallback(() => {
    'worklet';
    runOnJS(Keyboard.dismiss)();

    expandAnimation.set(
      withSpring(
        0,
        {
          damping: 25,
          stiffness: 400,
          mass: 0.6,
          overshootClamping: true,
        },
        () => {
          'worklet';
          runOnJS(setSearchQuery)(null);
        },
      ),
    );
  }, [expandAnimation, setSearchQuery]);

  // Simplified container style - no keyboard calculations
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const progress = expandAnimation.value;

    return {
      width: 56 + progress * (width - padding * 2 - 64),
      height: 56,
      bottom: Platform.OS === 'web' ? paddingBottom : progress * 72,
      right: progress * 4,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const progress = expandAnimation.value;
    return {
      opacity: progress < 0.5 ? 1 - progress * 2 : 0,
      transform: [{ scale: 1 - progress * 0.2 }],
    };
  });

  const inputContainerAnimatedStyle = useAnimatedStyle(() => {
    const progress = expandAnimation.value;
    return {
      opacity: progress > 0.5 ? (progress - 0.5) * 2 : 0,
      transform: [{ translateX: (1 - progress) * 30 }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{
        position: 'absolute',
        bottom: paddingBottom,
        right: padding,
        zIndex: 1000,
      }}
    >
      <Animated.View style={containerAnimatedStyle}>
        <AnimatedPressable
          onPress={!isExpanded ? handlePress : undefined}
          style={[
            t.border,
            t.borders.secondary,
            { borderRadius: 32 },
            Platform.OS === 'android'
              ? {
                  backgroundColor: t.colors.background.secondary,
                  overflow: 'hidden',
                }
              : undefined,
            { flex: 1 },
          ]}
          disableAnimation={Platform.OS === 'android'}
        >
          {/* Should match to PressableGradient defined on farcaster-mobile  */}
          <LinearGradient
            colors={
              t.dark
                ? [t.colors.gray850, t.colors.gray900]
                : [t.colors.gray50, t.colors.gray300]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[t.absolute, t.inset0, { borderRadius: 100 }]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              },
              buttonAnimatedStyle,
            ]}
            pointerEvents={isExpanded ? 'none' : 'auto'}
          >
            <Search color={t.colors.text.primary} />
          </Animated.View>

          <Animated.View
            style={[
              {
                position: 'absolute',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                paddingHorizontal: 16,
              },
              inputContainerAnimatedStyle,
            ]}
            pointerEvents={isExpanded ? 'auto' : 'none'}
          >
            <Search
              color={t.colors.text.secondary}
              size={20}
              style={{ marginRight: 12 }}
            />
            <TextInput
              ref={inputRef}
              value={searchQuery ?? ''}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor={t.colors.text.tertiary}
              style={[
                t.fontNormal,
                {
                  flex: 1,
                  fontSize: 16,
                  color: t.colors.text.primary,
                  outlineWidth: 0,
                },
              ]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isExpanded && (
              <AnimatedPressable
                onPress={handleClose}
                disableAnimation={Platform.OS === 'android'}
              >
                <X color={t.colors.text.secondary} size={20} />
              </AnimatedPressable>
            )}
          </Animated.View>
        </AnimatedPressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
