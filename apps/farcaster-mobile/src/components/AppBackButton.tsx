import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
  GestureResponderEvent,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type AppBackButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle | ViewStyle[];
};

const AppBackButton: React.FC<AppBackButtonProps> = ({ onPress, style }) => {
  const t = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={style}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      activeOpacity={0.7}
    >
      <ChevronLeft size={24} color={t.colors.text.primary} />
    </TouchableOpacity>
  );
};

export { AppBackButton };
