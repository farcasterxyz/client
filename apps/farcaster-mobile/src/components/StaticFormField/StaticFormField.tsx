import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import {
  StaticFormFieldLabel,
  StaticFormFieldLabelProps,
} from './StaticFormFieldLabel';
import {
  StaticFormFieldValue,
  StaticFormFieldValueProps,
} from './StaticFormFieldValue';

type StaticFormFieldProps = StaticFormFieldLabelProps &
  StaticFormFieldValueProps;

const StaticFormField: FC<StaticFormFieldProps> = memo(
  ({ label, labelWidth, numberOfLines = 1, onPress, placeholder, value }) => {
    const t = useTheme();

    return (
      <View style={[t.flexRow, t.itemsStart, t.mY2]}>
        <StaticFormFieldLabel
          label={label}
          labelWidth={labelWidth}
          onPress={onPress}
        />
        <StaticFormFieldValue
          numberOfLines={numberOfLines}
          onPress={onPress}
          placeholder={placeholder}
          value={value}
        />
      </View>
    );
  },
);

StaticFormFieldLabel.displayName = 'StaticFormFieldLabel';

export { StaticFormField };
