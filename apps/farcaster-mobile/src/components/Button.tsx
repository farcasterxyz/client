import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import React, { FC, memo } from 'react';
import { TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

import { LoadingIndicator } from './LoadingIndicator';

type ButtonProps = {
  bordered?: boolean;
  disabled?: boolean;
  fontWeight?: 'normal' | 'bold' | 'semibold';
  fullWidth?: boolean;
  loading?: boolean;
  onPress: () => void;
  onDisabledPress?: () => void;
  size?: 'lg' | 'md' | 'sm' | 'xs';
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  title: string;
  octiconName?: (typeof Octicons)['name'];
  materialCommunityIconName?: (typeof MaterialCommunityIcons)['name'];
  icon?: React.ReactElement;
  iconRight?: (typeof Octicons)['name'];
  iconSize?: number;
  variant?:
    | 'normal'
    | 'muted'
    | 'danger'
    | 'inverted'
    | 'mutedSecondary'
    | 'mutedDanger'
    | 'dangerSecondary'
    | 'translucentWhite';
  minWidth?: number;
};

/**
 * @deprecated Use ButtonV2 instead
 * import { ButtonV2 } from 'farcaster-expo';
 */
const Button: FC<ButtonProps> = memo(
  ({
    bordered = true,
    disabled = false,
    loading = false,
    fontWeight,
    fullWidth,
    onPress,
    onDisabledPress,
    size = 'md',
    style,
    containerStyle,
    textStyle,
    octiconName,
    materialCommunityIconName,
    title,
    icon,
    variant = 'normal',
    minWidth,
    iconRight,
    iconSize: iconSizeProp,
  }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const getPadding = () => {
      switch (size) {
        case 'lg':
          return [t.pX5, t.pY7];
        case 'md':
          return [t.pX4, t.pY5];
        case 'sm':
          return [t.pX4, t.pY2];
        case 'xs':
          return [t.pX4, t.pY1];
      }
    };

    const getBorderRadius = () => {
      switch (size) {
        case 'lg':
        case 'md':
        case 'sm':
          return t.roundedLg;
        case 'xs':
          return t.rounded;
      }
    };

    const getFontWeight = () => {
      if (fontWeight === 'normal') {
        return t.fontNormal;
      } else if (fontWeight === 'semibold') {
        return t.fontSemibold;
      } else if (fontWeight === 'bold') {
        return t.fontBold;
      }

      switch (size) {
        case 'md':
        case 'sm':
          return t.fontBold;
        case 'xs':
          return t.fontNormal;
      }
    };

    const getTextSize = () => {
      switch (size) {
        case 'lg':
          return t.textLg;
        case 'md':
          return t.textBase;
        case 'sm':
          return t.textBase;
        case 'xs':
          return t.textSm;
      }
    };

    const getBgColor = () => {
      switch (variant) {
        case 'normal':
          return t.bgAction;
        case 'muted':
          return t.bgActionMuted;
        case 'danger':
          return t.bgDanger;
        case 'inverted':
          return t.bgButtonInverted;
        case 'mutedSecondary':
          return t.bgActionMuted;
        case 'mutedDanger':
          return t.bgActionMuted;
        case 'dangerSecondary':
          return t.bgTransparent;
        case 'translucentWhite':
          return {
            backgroundColor: 'rgba(256, 256, 256, 0.20)',
          };
      }
    };

    const getTextColor = () => {
      switch (variant) {
        case 'normal':
        case 'danger':
          return t.colors.text.light;
        case 'muted':
          return t.colors.text.primary;
        case 'inverted':
          return t.dark ? t.colors.text.light : t.colors.bgAction;
        case 'mutedSecondary':
          return t.dark ? t.colors.text.brand : t.colors.bgAction;
        case 'dangerSecondary':
        case 'mutedDanger':
          return t.colors.text.danger;
        case 'translucentWhite':
          return '#ffffff';
      }
    };

    const getBorder = () => {
      if (variant === 'translucentWhite') {
        return [{ borderColor: 'rgba(256,256,256, 0.5)', borderWidth: 1 }];
      }

      if (variant === 'muted' && bordered) {
        return [t.borderHairline, t.borderDefault];
      }

      if (variant === 'dangerSecondary') {
        return [t.border, { borderColor: t.colors.bgDanger }];
      }

      return [];
    };

    const iconToRender = React.useMemo(() => {
      const inferredIconSize = size === 'lg' ? 20 : title ? 12 : 16;
      const iconSize = iconSizeProp ? iconSizeProp : inferredIconSize;

      if (typeof octiconName !== 'undefined') {
        // @ts-ignore-next-line
        return <Octicons name={octiconName} size={iconSize} />;
      }

      if (typeof materialCommunityIconName !== 'undefined') {
        return (
          <MaterialCommunityIcons
            // @ts-ignore-next-line
            name={materialCommunityIconName}
            size={iconSize}
          />
        );
      }

      return null;
    }, [iconSizeProp, size, title, octiconName, materialCommunityIconName]);

    const iconRightToRender = React.useMemo(() => {
      if (typeof iconRight !== 'undefined') {
        return (
          <Octicons
            // @ts-ignore-next-line
            name={iconRight}
            size={iconSizeProp ? iconSizeProp : title === '' ? 16 : 12}
          />
        );
      }

      return null;
    }, [iconRight, iconSizeProp, title]);

    return (
      <TouchableOpacity
        disabled={loading}
        onPress={() => {
          if (!disabled) {
            triggerImpactAsync();

            onPress();
          } else if (typeof onDisabledPress === 'function') {
            onDisabledPress();
          }
        }}
        style={[fullWidth && t.wFull, { minWidth }, containerStyle]}
        activeOpacity={0.75}
      >
        <View
          style={[
            getBgColor(),
            disabled ? t.opacity50 : null,
            getBorderRadius(),
            ...getPadding(),
            ...getBorder(),
            t.justifyCenter,
            { minHeight: 32 },
            style,
          ]}
        >
          {loading ? (
            <LoadingIndicator color={getTextColor()} />
          ) : (
            <View style={[t.flex, t.flexRow, t.justifyCenter, t.itemsCenter]}>
              {iconToRender && (
                <Text
                  style={[
                    { color: getTextColor() },
                    t.textCenter,
                    getTextSize(),
                    getFontWeight(),
                    title !== '' && t.mR2,
                  ]}
                >
                  {iconToRender}
                </Text>
              )}
              {icon}
              <Text
                style={[
                  { color: getTextColor() },
                  t.textCenter,
                  icon ? t.mL2 : null,
                  getTextSize(),
                  getFontWeight(),
                  textStyle,
                ]}
              >
                {title}
              </Text>
              {!!iconRightToRender && (
                <Text
                  style={[
                    { color: getTextColor() },
                    t.textCenter,
                    getTextSize(),
                    getFontWeight(),
                    title !== '' && t.mL2,
                  ]}
                >
                  {iconRightToRender}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

Button.displayName = 'Button';

export { Button };
