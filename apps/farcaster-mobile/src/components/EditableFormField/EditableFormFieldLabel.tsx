import React, { FC, memo } from 'react';
import { TextStyle } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export type EditableFormFieldLabelProps = {
  label: string;
  labelStyle?: TextStyle[];
};

const EditableFormFieldLabel: FC<EditableFormFieldLabelProps> = memo(
  ({ label, labelStyle }) => {
    const t = useTheme();

    return (
      <Text style={[t.texts.secondary, t.textLg, labelStyle]}>{label}</Text>
    );
  },
);

EditableFormFieldLabel.displayName = 'EditableFormFieldLabel';

export { EditableFormFieldLabel };
