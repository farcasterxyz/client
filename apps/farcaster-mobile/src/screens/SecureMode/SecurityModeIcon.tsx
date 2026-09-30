import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

const SecurityModeIcon = ({
  size = 80,
  variant = 'plain',
  noBadge = false,
}: {
  size?: number;
  variant?: 'plain' | 'checkmark' | 'crossed';
  noBadge?: boolean;
}) => {
  const t = useTheme();

  const iconSize = size / 2;
  const iconName = useMemo(() => {
    switch (variant) {
      case 'plain':
        return 'shield-outline';
      case 'checkmark':
        return 'shield-checkmark-outline';
      case 'crossed':
        return 'shield-outline';
      default:
        return 'shield-outline';
    }
  }, [variant]);

  const Icon = () => {
    return (
      <>
        <Ionicons
          name="shield"
          size={iconSize}
          color={t.colors.bgLightPurple}
        />
        <View style={[t.absolute]}>
          <Ionicons
            name={iconName}
            size={iconSize}
            color={t.colors.text.brand}
          />
        </View>
        {variant === 'crossed' && (
          <View style={[t.absolute, { width: size, height: size }]}>
            <Svg width={size} height={size}>
              <Line
                x1={size * 0.25}
                y1={size * 0.25}
                x2={size * 0.7}
                y2={size * 0.7}
                stroke={t.colors.text.brand}
                strokeWidth={1}
              />
            </Svg>
          </View>
        )}
      </>
    );
  };

  if (noBadge) {
    return <Icon />;
  }

  return (
    <View
      style={[
        t.justifyCenter,
        t.itemsCenter,
        t.bgSwap,
        t.roundedFull,
        { height: size, width: size },
      ]}
    >
      <Icon />
    </View>
  );
};

export { SecurityModeIcon };
