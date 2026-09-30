import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../../../../contexts/ThemeContext';
import { useHaptics } from '../../../../hooks';
import type { getTheme } from '../../../../theme';
import {
  buttonHierarchyToBackground,
  buttonHierarchyToBorderColor,
  buttonSizeToHeight,
  buttonSizeToRadius,
} from './constants';
import type { ButtonHierarchy, ButtonSize, ButtonType } from './types';
import { getButtonPadding } from './utils';

export type ButtonContainerProps = {
  children: React.ReactNode;
  // Removing this, always use rounded
  // type?: ButtonType;
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  hasIcon: boolean;
  hasText: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ButtonContainer = memo(
  ({
    children,
    onPress,
    hierarchy = 'primary',
    size = 's',
    hasIcon = false,
    hasText = true,
    disabled = false,
    style,
  }: ButtonContainerProps) => {
    const type = 'circle' as ButtonType;
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();
    const borderRadiusStyle = useMemo(() => {
      return type === 'circle'
        ? t.roundedFull
        : { borderRadius: buttonSizeToRadius[size] };
    }, [type, size, t.roundedFull]);
    const background = buttonHierarchyToBackground[hierarchy];
    const paddingStyle = useMemo(
      () => getButtonPadding({ size, hasIcon, hasText, type }),
      [size, hasIcon, hasText, type],
    );
    const borderStyle = useMemo(() => {
      const borderColor = buttonHierarchyToBorderColor[hierarchy];
      return borderColor
        ? { borderColor: t.colors.border[borderColor], borderWidth: 1 }
        : {};
    }, [hierarchy, t.colors.border]);

    const pressedBackground = useMemo(() => {
      const buttonHierarchyToPressedBackground: Record<
        ButtonHierarchy,
        keyof ReturnType<typeof getTheme>['backgrounds'] | string
      > = {
        primary: t.colors.violet700,
        secondary: t.colors.background.tertiary,
        tertiary: t.colors.background.tertiary,
        overlay: t.colors.background.primary,
        translucent: t.colors.background.brandMedium,
        danger: t.colors.red300,
        dangerSecondary: t.colors.background.primary,
      };
      return buttonHierarchyToPressedBackground[hierarchy];
    }, [hierarchy, t.colors]);

    const disabledBackground = useMemo(() => {
      const buttonHierarchyToDisabledBackground: Record<
        ButtonHierarchy,
        keyof ReturnType<typeof getTheme>['backgrounds'] | string
      > = {
        primary: t.dark
          ? t.colors.background.brandMedium
          : t.colors.paleViolet100,
        secondary: t.colors.background.secondary,
        tertiary: t.colors.background.primary,
        overlay: `#F3F3F380`,
        translucent: t.colors.paleViolet100,
        danger: t.colors.red100,
        dangerSecondary: t.colors.background.primary,
      };
      return buttonHierarchyToDisabledBackground[hierarchy];
    }, [
      hierarchy,
      t.colors.background.brandMedium,
      t.colors.background.primary,
      t.colors.background.secondary,
      t.colors.paleViolet100,
      t.colors.red100,
      t.dark,
    ]);

    const wrappedOnPress = useCallback(() => {
      if (onPress && !disabled) {
        triggerImpactAsync();
        onPress();
      }
    }, [disabled, onPress, triggerImpactAsync]);

    return (
      <Pressable
        onPress={wrappedOnPress}
        disabled={disabled}
        style={({ pressed }) => [
          t.gap3,
          background in t.backgrounds
            ? t.backgrounds[background as keyof typeof t.backgrounds]
            : { backgroundColor: background },
          borderRadiusStyle,
          paddingStyle,
          { height: buttonSizeToHeight[size] },
          t.flexShrink,
          borderStyle,
          pressed && {
            backgroundColor: pressedBackground,
            transform: [{ scale: 0.97 }],
          },
          disabled && { backgroundColor: disabledBackground },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  },
);

ButtonContainer.displayName = 'ButtonContainer';

export { ButtonContainer };
