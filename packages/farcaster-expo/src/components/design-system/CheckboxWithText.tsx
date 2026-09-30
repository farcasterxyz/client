import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { CheckBox, Typography } from './atoms';

interface CheckboxWithTextProps {
  isChecked: boolean;
  text: string;
  toggleIsChecked: () => void;
}

export function CheckboxWithText({
  isChecked,
  text,
  toggleIsChecked,
}: CheckboxWithTextProps) {
  const t = useTheme();

  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 10 }]}>
      <CheckBox isChecked={isChecked} toggleIsChecked={toggleIsChecked} />
      {!!text && (
        <View style={[t.flex1]}>
          <Typography label="Medium/Base">{text}</Typography>
        </View>
      )}
    </View>
  );
}

CheckboxWithText.displayName = 'CheckboxWithText';
