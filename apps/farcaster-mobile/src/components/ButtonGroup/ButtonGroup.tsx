import { convertHexToRGBA } from 'farcaster-expo';
import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';
import { ColorValue, Pressable, View, ViewStyle } from 'react-native';

import { FontWeight, Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

export type ButtonGroupOption = {
  label: string;
  subLabel?: string;
  onPress: () => void | Promise<void>;
  icon?: (options: { size: number; color: ColorValue }) => ReactNode;
  iconLeft?: (options: { size: number; color: ColorValue }) => ReactNode;
  destructive?: boolean;
  enableHaptics?: boolean;
  disabled?: boolean;
};

type ButtonGroupSize = 'base' | 'sm';

type ButtonGroupProps = {
  options: ButtonGroupOption[];
  minIconWidth?: number;
  size?: ButtonGroupSize;
  bordered?: boolean;
  borderColor?: string;
  backgroundColor?: string;
};

export const ButtonGroup: FC<ButtonGroupProps> = memo(
  ({
    options,
    size = 'base',
    minIconWidth = 24,
    bordered = true,
    borderColor,
    backgroundColor,
  }) => {
    return (
      <View>
        {options.map((option, index) => (
          <ButtonGroupButton
            key={[index, option.label].join('|')}
            isFirstOption={index === 0}
            isLastOption={index === options.length - 1}
            option={option}
            minIconWidth={minIconWidth}
            size={size}
            bordered={bordered}
            borderColor={borderColor}
            backgroundColor={backgroundColor}
          />
        ))}
      </View>
    );
  },
);

type ButtonGroupButtonProps = {
  isFirstOption: boolean;
  isLastOption: boolean;
  option: ButtonGroupOption;
  size: ButtonGroupSize;
  minIconWidth: number;
  bordered: boolean;
  borderColor?: string;
  backgroundColor?: string;
};

const ButtonGroupButton: FC<ButtonGroupButtonProps> = memo(
  ({
    option: {
      icon,
      iconLeft,
      label,
      subLabel,
      onPress,
      destructive,
      enableHaptics,
      disabled,
    },
    isFirstOption,
    isLastOption,
    minIconWidth = 24,
    size,
    bordered,
    borderColor,
    backgroundColor,
  }) => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();

    const borderStyles = useMemo(() => {
      if (!bordered) {
        return [];
      }

      const styles: ViewStyle[] = [
        borderColor ? { borderColor } : t.borderDesignSystemDefault,
        t.borderL,
        t.borderR,
        t.borderB,
      ];

      if (isFirstOption) {
        styles.push(t.borderT);
        styles.push({ borderTopLeftRadius: 16, borderTopRightRadius: 16 });
      }

      if (isLastOption) {
        styles.push({
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        });
      }

      return styles;
    }, [isFirstOption, isLastOption, t, bordered, borderColor]);

    const sizeStyles = useMemo(() => {
      const paddingHorizontal = bordered ? 16 : 0;
      switch (size) {
        case 'base':
          return [{ paddingVertical: 13, paddingHorizontal }];
        case 'sm':
          return [{ paddingVertical: 8, paddingHorizontal }];
      }
    }, [size, bordered]);

    const labelWeight: FontWeight = useMemo(() => {
      switch (size) {
        case 'base':
        case 'sm':
          return 'medium';
      }
    }, [size]);

    const iconSize: number = useMemo(() => {
      switch (size) {
        case 'base':
        case 'sm':
          return 20;
      }
    }, [size]);

    const iconColor = useMemo(() => {
      if (destructive) {
        return t.colors.text.danger;
      } else {
        return t.colors.text.primary;
      }
    }, [t, destructive]);

    const handlePress = useCallback(() => {
      if (enableHaptics) {
        triggerImpactAsync();
      }
      onPress();
    }, [onPress, triggerImpactAsync, enableHaptics]);

    const getBackgroundColor = useCallback(
      (pressed: boolean) => {
        if (backgroundColor) {
          return backgroundColor;
        }

        if (disabled || !bordered) {
          return undefined;
        }

        if (pressed) {
          return t.dark
            ? convertHexToRGBA(t.colors.white, 0.1)
            : convertHexToRGBA(t.colors.black, 0.05);
        }

        return undefined;
      },
      [
        disabled,
        bordered,
        t.dark,
        t.colors.white,
        t.colors.black,
        backgroundColor,
      ],
    );

    return (
      <Pressable
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => {
          return [
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            sizeStyles,
            borderStyles,
            {
              backgroundColor: getBackgroundColor(pressed),
            },
          ];
        }}
      >
        <View style={[t.flexRow, t.itemsCenter]}>
          {iconLeft ? (
            <View
              style={[
                t.flexNone,
                t.itemsCenter,
                { minWidth: minIconWidth },
                t.mR4,
              ]}
            >
              {iconLeft({ size: iconSize, color: iconColor })}
            </View>
          ) : null}
          <View style={[t.flex1]}>
            <Text2
              color={destructive ? 'danger' : 'primary'}
              size={size}
              weight={labelWeight}
            >
              {label}
            </Text2>
            {subLabel ? (
              <Text2 size="sm" color="secondary">
                {subLabel}
              </Text2>
            ) : null}
          </View>
          {icon ? (
            <View
              style={[
                t.flexNone,
                t.itemsCenter,
                { minWidth: minIconWidth },
                t.mL4,
              ]}
            >
              {icon({ size: iconSize, color: iconColor })}
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  },
);
