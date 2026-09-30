import { TextStyle } from 'react-native';

import { fontFamilies } from '../fontFamilies';
import { fontSizes } from '../fontSizes';
import { letterSpacing } from '../letterSpacing';
import { lineHeights } from '../lineHeights';
import { typography, type TypographyLabel } from '../typography';

export const getTypographyTextStyle = (
  tLabel: TypographyLabel,
  additionalStyles?: TextStyle | TextStyle[],
): TextStyle[] => {
  const typographyPreset = typography[tLabel];
  const typographyStyles = {
    fontSize: fontSizes[typographyPreset.fontSize],
    lineHeight: typographyPreset.lineHeight
      ? lineHeights[typographyPreset.lineHeight]
      : undefined,
    letterSpacing: typographyPreset.letterSpacing
      ? letterSpacing[typographyPreset.letterSpacing]
      : undefined,
    fontFamily: typographyPreset.fontFamily
      ? fontFamilies[typographyPreset.fontFamily]
      : undefined,
  } satisfies TextStyle;
  const styles: TextStyle[] = [typographyStyles];

  if (additionalStyles) {
    styles.push(
      ...(Array.isArray(additionalStyles)
        ? additionalStyles
        : [additionalStyles]),
    );
  }

  return styles;
};
