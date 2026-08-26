import React, { FC, memo } from 'react';
import { Pressable } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type StaticFormFieldLabelProps = {
  label: string;
  labelWidth?: number;
  onPress: () => void;
};

const defaultLabelWidth = 80;

const StaticFormFieldLabel: FC<StaticFormFieldLabelProps> = memo(
  ({ label, labelWidth = defaultLabelWidth, onPress }) => {
    const t = useTheme();

    return (
      <Pressable style={[t.pY2, { width: labelWidth }]} onPress={onPress}>
        <Text style={[t.texts.secondary, t.textBase]}>{label}</Text>
      </Pressable>
    );
  },
);

StaticFormFieldLabel.displayName = 'StaticFormFieldLabel';

export { StaticFormFieldLabel };
