import { useUnfocusInputs } from 'farcaster-expo';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  TextInput as TextInputRN,
  TextInputProps as TextInputPropsRN,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';

type TextInputProps = Pick<
  TextInputPropsRN,
  | 'underlineColorAndroid'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'autoFocus'
  | 'autoComplete'
  | 'clearButtonMode'
  | 'editable'
  | 'keyboardType'
  | 'maxLength'
  | 'onFocus'
  | 'onBlur'
  | 'onChangeText'
  | 'onSubmitEditing'
  | 'onKeyPress'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'returnKeyType'
  | 'returnKeyLabel'
  | 'selectTextOnFocus'
  | 'spellCheck'
  | 'textAlign'
  | 'textContentType'
  | 'multiline'
  | 'numberOfLines'
  | 'value'
  | 'onEndEditing'
  | 'defaultValue'
> & {
  // If you are setting a left padding, it's good to use this due to a bug in Android (see below)
  paddingLeft?: number;
  containerStyle?: ViewStyle[];
  inputStyle?: TextStyle[];
  variant?: 'default' | 'well' | 'no-style';
};

const TextInput = forwardRef<TextInputRN | null, TextInputProps>(
  (
    {
      autoCapitalize = 'none',
      autoComplete,
      autoCorrect = true,
      autoFocus,
      clearButtonMode,
      paddingLeft,
      containerStyle,
      editable = true,
      inputStyle,
      keyboardType = 'default',
      maxLength,
      onFocus,
      onBlur,
      onChangeText,
      onKeyPress,
      onSubmitEditing,
      placeholder,
      placeholderTextColor,
      returnKeyLabel,
      returnKeyType,
      selectTextOnFocus,
      spellCheck = true,
      textAlign,
      textContentType,
      multiline,
      numberOfLines,
      value,
      onEndEditing,
      variant = 'default',
      defaultValue,
    },
    forwardedRef,
  ) => {
    const t = useTheme();

    const [isFocused, setIsFocused] = useState(autoFocus);
    const inputRef = useRef<TextInputRN>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current as TextInputRN);

    const { addListener, removeListener } = useUnfocusInputs();

    const textInputStyles = React.useMemo(
      () => [
        t.texts.primary,
        t.textBase,
        t.bgInput,
        t.rounded,
        isFocused ? t.borderActive : t.borderDefault,
        ...(variant === 'default' ? [t.borderB, t.p1, t.pR2, t.textLg] : []),
        ...(variant === 'well'
          ? [
              t.borderHairline,
              t.textBase,
              {
                paddingTop: 7,
                paddingBottom: 7,
                paddingLeft: 9,
                paddingRight: 9,
              },
            ]
          : []),
        paddingLeft !== undefined ? { paddingLeft } : undefined,
        inputStyle,
      ],
      [
        inputStyle,
        isFocused,
        paddingLeft,
        t.bgInput,
        t.borderActive,
        t.borderB,
        t.borderDefault,
        t.borderHairline,
        t.p1,
        t.pR2,
        t.rounded,
        t.textBase,
        t.texts.primary,
        t.textLg,
        variant,
      ],
    );

    const placeholderTextColorHandled = React.useMemo(() => {
      return typeof placeholderTextColor !== 'undefined'
        ? placeholderTextColor
        : t.colors.text.tertiary;
    }, [placeholderTextColor, t.colors.text.tertiary]);

    const onFocusWrapped = React.useCallback(
      (e: Parameters<NonNullable<TextInputPropsRN['onFocus']>>[0]) => {
        setIsFocused(true);
        if (onFocus) {
          onFocus(e);
        }
      },
      [onFocus],
    );

    const onBlurWrapped = React.useCallback(
      (e: Parameters<NonNullable<TextInputPropsRN['onBlur']>>[0]) => {
        setIsFocused(false);
        if (onBlur) {
          onBlur(e);
        }
      },
      [onBlur],
    );

    useEffect(() => {
      const onUnfocusInputs = () => {
        inputRef.current?.blur();
      };

      addListener(onUnfocusInputs);
      return () => removeListener(onUnfocusInputs);
    }, [addListener, removeListener]);

    // On Android there is a bug where sometimes (depending on how the input is rendered), the input ignores
    // the left padding. This is a hack to force a re-render of the native component which fixes the issue.
    // A similar trick used in the Search bar is to re-render on focus, but this doesn't work universally
    // and didn't work for the drawer
    useEffect(() => {
      setTimeout(() => {
        if (paddingLeft !== undefined && Platform.OS === 'android') {
          inputRef.current?.setNativeProps({ paddingLeft });
        }
      }, 1000);
    }, [paddingLeft]);

    return (
      <View style={containerStyle}>
        <TextInputRN
          autoFocus={autoFocus}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          clearButtonMode={clearButtonMode}
          editable={editable}
          hitSlop={hitSlop}
          keyboardType={keyboardType}
          maxLength={maxLength}
          returnKeyLabel={returnKeyLabel}
          returnKeyType={returnKeyType}
          ref={inputRef}
          spellCheck={spellCheck}
          style={textInputStyles}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColorHandled}
          textAlign={textAlign}
          textContentType={textContentType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          selectionColor={t.colors.selection}
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          onFocus={onFocusWrapped}
          onBlur={onBlurWrapped}
          selectTextOnFocus={selectTextOnFocus}
          value={value}
          onEndEditing={onEndEditing}
          defaultValue={defaultValue}
          onSubmitEditing={onSubmitEditing}
        />
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';

export { TextInput, type TextInputProps };
