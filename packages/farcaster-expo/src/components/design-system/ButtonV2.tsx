import React, { FC, memo } from 'react';
import {
  FlexStyle,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { useHaptics } from '../../hooks/useHaptics';
import { sizes } from '../../theme';
import { LoadingIndicator } from './atoms/LoadingIndicator';
import { Text } from './Text';

type MarginStyle = Pick<
  FlexStyle,
  | 'margin'
  | 'marginBottom'
  | 'marginEnd'
  | 'marginHorizontal'
  | 'marginLeft'
  | 'marginRight'
  | 'marginStart'
  | 'marginTop'
  | 'marginVertical'
>;

interface ButtonV2Props {
  title?: string;
  onPress: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'bare'
    | 'destructive'
    | 'destructive-outline'
    | 'faint-text'
    | 'link';
  disabled?: boolean;
  onDisabledPress?: () => void;
  loading?: boolean;
  width?: 'full' | 'flex1' | number;
  xPadding?: 'sm' | 'normal' | number;
  // We don't control y padding, instead we fix the height so that buttons are the same independent
  // of the content inside (e.g. different icon sizes)
  height?: 'normal' | 'sm' | 'xs';
  margin?: MarginStyle;
  Icon?: (props: { color: string }) => React.ReactNode;
  IconRight?: (props: { color: string }) => React.ReactNode;
  textStyle?: TextStyle | TextStyle[];
  textSize?: 'normal' | 'lg';
  haptics?: boolean;
  rounded?: 'full' | 'lg';
  testID?: string;
}

const ButtonV2: FC<ButtonV2Props> = memo(
  ({
    title,
    onPress,
    onLongPress,
    longPressDelay = 1000,
    variant = 'primary',
    disabled = false,
    onDisabledPress,
    loading = false,
    width,
    height = 'normal',
    xPadding = 'normal',
    margin,
    Icon,
    IconRight,
    textStyle: textStyleOverride,
    textSize = 'normal',
    rounded = 'full',
    testID,
  }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const widthStyle =
      width === 'full'
        ? t.wFull
        : width === 'flex1'
          ? t.flex1
          : width === undefined
            ? undefined
            : { width };

    // Padding is -1 vs design system due to borders that we always have
    const xPaddingStyle: ViewStyle | undefined =
      width !== undefined
        ? {}
        : xPadding === 'normal'
          ? { paddingHorizontal: 15 }
          : xPadding === 'sm'
            ? { paddingHorizontal: 9 }
            : { paddingHorizontal: xPadding };

    const heightStyle =
      height === 'normal'
        ? { height: 48 }
        : height === 'sm'
          ? { height: 34 }
          : { height: 30 };

    const borderColor =
      variant === 'primary'
        ? t.borderActionPrimary
        : variant === 'secondary'
          ? t.borderActionSecondary
          : variant === 'tertiary'
            ? t.borders.tertiary
            : variant === 'destructive' || variant === 'destructive-outline'
              ? t.borderActionDestructive
              : // Need a fake border to keep button proportions the same
                t.borders.background;

    const bgColor =
      variant === 'primary'
        ? t.bgActionPrimary
        : variant === 'secondary'
          ? t.bgActionSecondary
          : variant === 'destructive'
            ? t.bgActionDestructive
            : variant === 'tertiary'
              ? t.bgDefault
              : undefined;

    const textStyle: TextStyle | TextStyle[] =
      textStyleOverride ??
      (textSize === 'normal'
        ? variant === 'faint-text' || variant === 'bare' || variant === 'link'
          ? { fontSize: 15, lineHeight: 20 }
          : { fontSize: 14, lineHeight: 20 }
        : { fontSize: 17, lineHeight: 20 });

    const textColor =
      variant === 'primary' || variant === 'destructive'
        ? t.colors.text.light
        : variant === 'faint-text'
          ? t.colors.text.tertiary
          : variant === 'destructive-outline'
            ? t.colors.text.danger
            : variant === 'link'
              ? t.colors.text.brand
              : t.colors.text.primary;
    const fontWeigth =
      variant === 'faint-text' || variant === 'link'
        ? undefined
        : t.fontSemibold;
    const flexJustify = variant === 'bare' ? undefined : t.justifyCenter;

    return (
      <TouchableOpacity
        disabled={disabled || loading}
        onPress={() => {
          if (!disabled) {
            triggerImpactAsync();
            onPress();
          } else if (typeof onDisabledPress === 'function') {
            onDisabledPress();
          }
        }}
        style={[margin, widthStyle]}
        activeOpacity={0.6}
        onLongPress={() => {
          if (!disabled && typeof onLongPress === 'function') {
            triggerImpactAsync();
            onLongPress();
          }
        }}
        delayLongPress={longPressDelay}
        testID={testID}
      >
        <View
          style={[
            bgColor,
            disabled || loading ? t.opacity50 : null,
            t.border,
            rounded === 'lg' ? t.roundedLg : t.roundedFull,
            borderColor,
            t.justifyCenter,
            xPaddingStyle,
            heightStyle,
          ]}
        >
          <View
            style={[t.flexRow, flexJustify, t.itemsCenter, { gap: sizes.s2 }]}
          >
            {loading ? (
              <LoadingIndicator color={textColor} />
            ) : Icon ? (
              <Icon color={textColor} />
            ) : null}
            {title && (
              <Text
                style={[
                  { color: textColor },
                  t.textCenter,
                  textStyle,
                  fontWeigth,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            )}
            {IconRight && <IconRight color={textColor} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);
ButtonV2.displayName = 'ButtonV2';

export { ButtonV2 };
