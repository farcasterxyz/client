import React from 'react';
import type { TextProps, TextStyle } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { type TypographyLabel } from '../../../theme/typography/typography';
import { getTypographyTextStyle } from '../../../theme/typography/utils/getTypographyTextStyle';
import { Text } from '../Text';

export type CleanedTextStyle = Omit<
  TextStyle,
  'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontFamily' | 'color'
>;

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary'
  | 'inverted'
  | 'danger'
  | 'success'
  | 'warning'
  | 'informative'
  | 'brand'
  | 'light';

export type TypographyProps = {
  label: TypographyLabel;
  color?: TextColor;
  style?: CleanedTextStyle | CleanedTextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
} & Omit<TextProps, 'style'>;

/**
 * This component is expected to directly match the figma design system, specifically the font styles
 */
export const Typography = ({ style, ...otherProps }: TypographyProps) => {
  const t = useTheme();
  const colorStyle = t.texts[otherProps.color ?? 'primary'] as TextStyle;
  const styles: TextStyle[] = [];
  if (colorStyle) {
    styles.push(colorStyle);
  }
  if (style) {
    styles.push(...(Array.isArray(style) ? style : [style]));
  }
  const calculatedStyles = getTypographyTextStyle(otherProps.label, styles);
  return <Text {...otherProps} style={calculatedStyles} />;
};

export type HeadingLabels =
  | 'Display'
  | 'ExtraLarge'
  | 'Large'
  | 'Medium'
  | 'Small';

const headingLabelToTypographyLabel = (
  label: HeadingLabels,
): TypographyLabel => {
  return `Heading/${label}` as TypographyLabel;
};

export type HeadingProps = Omit<TypographyProps, 'label'> & {
  label: HeadingLabels;
};

export const TypographyHeading = ({ label, ...otherProps }: HeadingProps) => {
  return (
    <Typography label={headingLabelToTypographyLabel(label)} {...otherProps} />
  );
};

export type BodyLabels =
  | 'ExtraLarge'
  | 'ExtraLarge/Strong'
  | 'Large'
  | 'Large/Strong'
  | 'Medium'
  | 'Medium/Strong'
  | 'Small'
  | 'Small/Strong'
  | 'ExtraSmall'
  | 'ExtraSmall/Strong';

const bodyLabelToTypographyLabel = (label: BodyLabels): TypographyLabel => {
  return `Body/${label}` as TypographyLabel;
};

export type BodyProps = Omit<TypographyProps, 'label'> & {
  label: BodyLabels;
};

export const TypographyBody = ({ label, ...otherProps }: BodyProps) => {
  return (
    <Typography label={bodyLabelToTypographyLabel(label)} {...otherProps} />
  );
};
