import React, { FC } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

import { sizes, useTheme } from '~/contexts/ThemeProvider';

export type OnboardingFormFieldValueProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'autoFocus'
  | 'editable'
  | 'keyboardType'
  | 'maxLength'
  | 'onChangeText'
  | 'placeholder'
  | 'value'
  | 'multiline'
  | 'numberOfLines'
  | 'clearButtonMode'
  | 'onFocus'
> & {
  inputRef?: React.Ref<TextInput>;
  readOnly?: boolean;
};

const OnboardingFormFieldValue: FC<OnboardingFormFieldValueProps> = ({
  inputRef,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  editable = true,
  numberOfLines,
  keyboardType,
  maxLength,
  onChangeText,
  placeholder,
  value,
  onFocus,
  clearButtonMode = 'always',
  readOnly = false,
}) => {
  const t = useTheme();

  // Not using memoization here because this is fast and when true
  // the compiler infers that numberOfLines exists
  const multiline = numberOfLines !== undefined && numberOfLines > 1;

  return (
    <View>
      <TextInput
        ref={inputRef}
        onFocus={onFocus}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        autoFocus={autoFocus}
        clearButtonMode={clearButtonMode}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.text.tertiary}
        // Fixes multi-line boxes being vertically centered on Android
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          t.textBase,
          t.texts.primary,
          t.borderDefault,
          t.border,
          t.rounded,
          t.p4,
          multiline
            ? {
                paddingTop: sizes.s4,
                height: 30 * numberOfLines,
                maxHeight: 30 * numberOfLines,
              }
            : {},
          !editable && t.bgMuted,
        ]}
        value={value}
        readOnly={readOnly}
      />
    </View>
  );
};

OnboardingFormFieldValue.displayName = 'OnboardingFormFieldValue';

export { OnboardingFormFieldValue };
