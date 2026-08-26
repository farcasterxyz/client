import React, { FC } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

import { sizes, useTheme } from '~/contexts/ThemeProvider';

export type EditableFormFieldValueProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'autoFocus'
  | 'editable'
  | 'multiline'
  | 'numberOfLines'
  | 'keyboardType'
  | 'maxLength'
  | 'onChangeText'
  | 'placeholder'
  | 'value'
>;

const EditableFormFieldValue: FC<EditableFormFieldValueProps> = ({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  editable = true,
  multiline = false,
  numberOfLines,
  keyboardType,
  maxLength,
  onChangeText,
  placeholder,
  value,
}) => {
  const t = useTheme();

  return (
    <View style={[t.pB2]}>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        autoFocus={autoFocus}
        clearButtonMode="always"
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.text.tertiary}
        style={[
          t.textLg,
          t.texts.primary,
          t.borderDefault,
          t.borderBHairline,
          t.pY2,
          multiline && typeof numberOfLines !== 'undefined'
            ? {
                paddingTop: sizes.s2,
                height: 30 * numberOfLines,
                maxHeight: 30 * numberOfLines,
              }
            : {},
        ]}
        value={value}
      />
    </View>
  );
};

EditableFormFieldValue.displayName = 'EditableFormFieldValue';

export { EditableFormFieldValue };
