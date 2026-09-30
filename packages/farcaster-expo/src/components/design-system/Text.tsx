import React, { FC, useMemo } from 'react';
import {
  // eslint-disable-next-line no-restricted-imports
  Text as TextRN,
  TextProps as TextPropsRN,
  TextStyle,
} from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { TextColor } from './atoms/Typography';

// We don't use React Native's default `Text` component, because it includes
// gesture-handling overhead that we don't need in most cases.
// With this lighter-weight component, we omit press-handling props.
// If you need the fully -featured Text component, use `TextWithPress`.
// https://twitter.com/fernandotherojo/status/1707762822015267219?s=46&t=upSpXM_1YfY4QIdQjFnxwg
// https://twitter.com/peterpme/status/1707983667627446497?s=46&t=upSpXM_1YfY4QIdQjFnxwg
// https://github.com/peterpme/react-native-fast-text
export type TextProps = Omit<
  TextPropsRN,
  'pressRectOffset' | 'onLongPress' | 'onPress' | 'onPressIn' | 'onPressOut'
>;

const Text: FC<TextProps> = ({ style, ...otherProps }) => {
  return <TextRN suppressHighlighting {...otherProps} style={style} />;
};

Text.displayName = 'Text';

export { Text };

export type TextAlign = 'left' | 'center' | 'right';

export type TextSize =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '8xl';

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

type Text2Props = TextProps & {
  color?: TextColor;
  size?: TextSize;
  weight?: FontWeight;
  align?: TextAlign;
  lineHeight?: TextSize;
  letterSpacing?: TextSize;
};

export function Text2({
  style,
  color = 'primary',
  size = 'base',
  weight = 'regular',
  align = 'left',
  lineHeight,
  letterSpacing,
  ...otherProps
}: Text2Props) {
  const t = useTheme();

  const internalStyles = useMemo(() => {
    const colorStyles: Record<TextColor, TextStyle> = {
      primary: t.texts.primary,
      secondary: t.texts.secondary,
      tertiary: t.texts.tertiary,
      quaternary: t.texts.quaternary,
      inverted: t.texts.inverted,
      danger: t.texts.danger,
      success: t.texts.success,
      brand: t.texts.brand,
      light: t.texts.light,
      warning: t.texts.warning,
      informative: t.texts.informative,
    };

    const fontWeightStyles: Record<FontWeight, TextStyle> = {
      regular: t.fontNormal,
      medium: t.fontMedium,
      semibold: t.fontSemibold,
      bold: t.fontBold,
    };

    const alignStyles: Record<TextAlign, TextStyle> = {
      left: t.textLeft,
      center: t.textCenter,
      right: t.textRight,
    };

    return [
      colorStyles[color],
      fontWeightStyles[weight],
      alignStyles[align],
      {
        letterSpacing: t.letterSpacing[letterSpacing ?? size],
        fontSize: t.fontSizes[size],
        lineHeight: t.lineHeights[lineHeight ?? size],
      },
    ];
  }, [t, color, weight, align, size, lineHeight, letterSpacing]);

  return <Text {...otherProps} style={[internalStyles, style]} />;
}

type HeadingSize = 'base';

type HeadingProps = TextProps & {
  size?: HeadingSize;
};

export function Heading({ size = 'base', style, ...otherProps }: HeadingProps) {
  const t = useTheme();

  const internalStyle = useMemo<TextStyle[]>(() => {
    switch (size) {
      case 'base':
        return [t.texts.primary, { fontSize: 20, fontWeight: '600' }];
    }
  }, [t, size]);

  return <Text {...otherProps} style={[internalStyle, style]} />;
}
