import React, { FC, memo, ReactElement, useMemo } from 'react';
import { ColorValue, View } from 'react-native';

import { Text2 } from '../../components/design-system/Text';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomSheetHeaderProps {
  Icon?: ReactElement;
  iconBgColor?: 'purple' | ColorValue;
  title: string;
}

const BottomSheetHeader: FC<BottomSheetHeaderProps> = memo(
  ({ Icon, iconBgColor: iconBgColorInput, title }) => {
    const t = useTheme();

    const iconBgColor = useMemo(() => {
      if (iconBgColorInput === 'purple') {
        // Same as notifications
        return '#e6e0f4';
      }
      return iconBgColorInput;
    }, [iconBgColorInput]);

    return (
      <View style={[t.flexRow, t.itemsCenter, t.mB2]}>
        {Icon && (
          <View
            style={[
              t.h8,
              t.w8,
              t.roundedFull,
              t.justifyCenter,
              t.itemsCenter,
              t.mR2,
              { backgroundColor: iconBgColor },
            ]}
          >
            {Icon}
          </View>
        )}
        <Text2 weight="semibold" size="xl">
          {title}
        </Text2>
      </View>
    );
  },
);
BottomSheetHeader.displayName = 'BottomSheetHeader';

export { BottomSheetHeader };
