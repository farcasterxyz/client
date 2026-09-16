import React, { FC } from 'react';
import { View, ViewStyle } from 'react-native';

import {
  EditableFormFieldLabel,
  EditableFormFieldLabelProps,
} from './EditableFormFieldLabel';
import {
  EditableFormFieldValue,
  EditableFormFieldValueProps,
} from './EditableFormFieldValue';

type EditableFormFieldProps = EditableFormFieldLabelProps &
  EditableFormFieldValueProps & {
    containerStyle?: ViewStyle[];
    withLabel?: boolean;
  };

const EditableFormField: FC<EditableFormFieldProps> = ({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  editable = true,
  multiline = false,
  keyboardType,
  label,
  maxLength,
  onChangeText,
  placeholder,
  value,
  numberOfLines,
  containerStyle,
  withLabel = true,
}) => {
  return (
    <View style={[containerStyle]}>
      {withLabel && <EditableFormFieldLabel label={label} />}
      <EditableFormFieldValue
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        autoFocus={autoFocus}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        value={value}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
};

EditableFormFieldLabel.displayName = 'EditableFormFieldLabel';

export { EditableFormField };
