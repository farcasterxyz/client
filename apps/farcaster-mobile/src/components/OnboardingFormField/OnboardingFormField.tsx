import React, { FC } from 'react';
import { View, ViewStyle } from 'react-native';

import {
  OnboardingFormFieldLabel,
  OnboardingFormFieldLabelProps,
} from './OnboardingFormFieldLabel';
import {
  OnboardingFormFieldValue,
  OnboardingFormFieldValueProps,
} from './OnboardingFormFieldValue';

type OnboardingFormFieldProps = OnboardingFormFieldLabelProps &
  OnboardingFormFieldValueProps & {
    containerStyle?: ViewStyle[];
  };

const OnboardingFormField: FC<OnboardingFormFieldProps> = ({
  inputRef,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  containerStyle,
  editable = true,
  multiline = false,
  keyboardType,
  label,
  maxLength,
  onChangeText,
  placeholder,
  value,
  numberOfLines,
  clearButtonMode,
  readOnly,
  onFocus,
}) => {
  return (
    <View style={[containerStyle]}>
      {label && <OnboardingFormFieldLabel label={label} />}
      <OnboardingFormFieldValue
        inputRef={inputRef}
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
        clearButtonMode={clearButtonMode}
        readOnly={readOnly}
        onFocus={onFocus}
      />
    </View>
  );
};

OnboardingFormFieldLabel.displayName = 'OnboardingFormFieldLabel';

export { OnboardingFormField };
