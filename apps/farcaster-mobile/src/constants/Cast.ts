import { useMemo } from 'react';
import { TextStyle } from 'react-native';

import { sizes } from '~/contexts/ThemeProvider';

export const bodyFontSize = 14.7;
export const bodyLineHeight = 19.4;
export const focusedBodyFontSize = 1.25 * bodyFontSize;
export const focusedBodyLineHeight = 1.25 * bodyLineHeight;
export const castImageThumbnailHeight = 210;
export const createCastAvatarDiameter = sizes.s10;
export const directCastFontSize = 17;

export const useCastBodyTextStyle = (
  isFocused: boolean = false,
): TextStyle[] => {
  return useMemo(() => {
    return [
      {
        fontSize: isFocused ? 17 : bodyFontSize,
        lineHeight: isFocused ? 21.25 : bodyLineHeight,
      },
    ];
  }, [isFocused]);
};
