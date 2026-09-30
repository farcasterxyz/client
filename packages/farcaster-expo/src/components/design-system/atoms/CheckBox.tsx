import { CheckIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useTheme } from '../../../contexts/ThemeContext';

export const CheckBox = ({
  isChecked,
  toggleIsChecked,
}: {
  isChecked: boolean;
  toggleIsChecked: () => void;
}) => {
  const t = useTheme();
  const borderColor = isChecked
    ? t.colors.actionPrimary
    : t.colors.text.secondary;

  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      onPress={toggleIsChecked}
    >
      <View
        testID="checkbox-indicator"
        style={[
          {
            width: 24,
            height: 24,
            borderRadius: 4,
            borderWidth: 2,
            borderColor,
            backgroundColor: isChecked
              ? t.colors.actionPrimary
              : t.colors.bgInput,
          },
          t.mR3,
          t.itemsCenter,
          t.justifyCenter,
        ]}
      >
        {isChecked && (
          <CheckIcon size={16} strokeWidth={3} color={t.colors.text.dark} />
        )}
      </View>
    </TouchableOpacity>
  );
};
