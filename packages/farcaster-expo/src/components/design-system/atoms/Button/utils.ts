import { ButtonSize, ButtonType } from './types';

export const getButtonPadding = ({
  size,
  hasIcon,
  hasText,
  type,
}: {
  size: ButtonSize;
  hasIcon: boolean;
  hasText: boolean;
  type: ButtonType;
}) => {
  if (hasIcon && hasText) {
    switch (size) {
      case 'xs':
      case 's':
      case 'm':
        return { paddingLeft: 8, paddingRight: 12 };
      case 'l':
        return { paddingLeft: 12, paddingRight: 16 };
    }
  }
  if (hasIcon) {
    switch (size) {
      case 'xs':
        return { paddingHorizontal: 7 };
      case 's':
        return { paddingHorizontal: 9 };
      case 'm':
        return { paddingHorizontal: 10 };
      case 'l':
        return { paddingHorizontal: 14 };
    }
  }
  switch (size) {
    case 'xs':
    case 's':
    case 'm':
      return { paddingHorizontal: 12 };
    case 'l':
      if (type === 'rounded') {
        return { paddingLeft: 17, paddingRight: 16 };
      }
      return { paddingHorizontal: 12 };
  }
};
