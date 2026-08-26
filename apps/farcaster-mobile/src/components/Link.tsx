import React, { FC, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';

import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';

type LinkVariant = 'primary' | 'secondary';
type LinkSize = 'sm' | 'base' | 'lg';

type LinkProps = {
  onPress: () => void;
  title?: string;
  variant?: LinkVariant;
  size?: LinkSize;
  disabled?: boolean;
  children?: React.ReactNode;
};

const Link: FC<LinkProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'base',
  disabled,
  children,
}) => {
  const t = useTheme();

  const textSizeStyle = useMemo(() => {
    switch (size) {
      case 'sm':
        return t.textSm;
      case 'base':
        return t.textBase;
      case 'lg':
        return t.textLg;
    }
  }, [size, t]);

  const textColorStyle = useMemo(() => {
    switch (variant) {
      case 'primary':
        return t.texts.brand;
      case 'secondary':
        return t.texts.primary;
    }
  }, [variant, t]);

  return (
    <TouchableOpacity
      hitSlop={hitSlop}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.5}
    >
      <Text style={[textColorStyle, textSizeStyle]}>{title || children}</Text>
    </TouchableOpacity>
  );
};

Link.displayName = 'Link';

export { Link };
