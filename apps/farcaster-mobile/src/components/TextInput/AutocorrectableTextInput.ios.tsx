import * as React from 'react';
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputKeyPressEventData,
  TextInputProps,
} from 'react-native';

import {
  AutocorrectableTextInputProps,
  AutocorrectableTextInputRef,
} from './AutocorrectableTextInputProps';

const AutocorrectableTextInput = React.forwardRef(function ClearableTextInput(
  props: AutocorrectableTextInputProps,
  ref: React.Ref<AutocorrectableTextInputRef>,
) {
  const pendingResultRef = React.useRef<
    { value: string; resolve: (value: string) => void } | undefined
  >(undefined);
  const getValueCalledRef = React.useRef<boolean>(false);
  const lastKeyPressedRef = React.useRef<string | undefined>(undefined);
  const textInputRef = React.useRef<TextInput | null>(null);
  const focusedRef = React.useRef<boolean>(false);

  const sendMessage = React.useCallback(() => {
    if (getValueCalledRef.current) {
      return;
    }
    const pendingResult = pendingResultRef.current;
    if (!pendingResult) {
      throw new Error('no pendingResult');
    }
    pendingResult.resolve(pendingResult.value);
    getValueCalledRef.current = true;
  }, []);

  const baseOnChangeText = props.onChangeText;
  const onChangeText = React.useCallback(
    (text: string) => {
      const pendingResult = pendingResultRef.current;
      if (pendingResult) {
        const lastKeyPressed = lastKeyPressedRef.current;
        if (
          !getValueCalledRef.current &&
          lastKeyPressed &&
          lastKeyPressed.length > 1
        ) {
          // This represents an autocorrect event on blur
          pendingResult.value = text;
        }
        lastKeyPressedRef.current = undefined;
        sendMessage();
      }
      baseOnChangeText(text);
    },
    [sendMessage, baseOnChangeText],
  );

  const baseOnKeyPress = props.onKeyPress;
  const onKeyPress = React.useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const { key } = event.nativeEvent;
      if (
        lastKeyPressedRef.current &&
        lastKeyPressedRef.current.length > key.length
      ) {
        return;
      }
      lastKeyPressedRef.current = key;
      baseOnKeyPress?.(event);
    },
    [baseOnKeyPress],
  );

  const { value } = props;
  const getValue = React.useCallback(async () => {
    const textInput = textInputRef.current;
    if (!focusedRef.current || !textInput) {
      return value;
    }
    return await new Promise<string>((resolve) => {
      pendingResultRef.current = { value, resolve };
      textInput.blur();
    });
  }, [value]);

  React.useImperativeHandle(ref, () => ({ getValue }), [getValue]);

  const baseOnFocus = props.onFocus;
  const onFocus = React.useCallback(
    (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      focusedRef.current = true;
      baseOnFocus?.(event);
    },
    [baseOnFocus],
  );

  const baseOnBlur = props.onBlur;
  const onBlur = React.useCallback(
    (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      focusedRef.current = false;
      if (pendingResultRef.current) {
        // This is to catch a race condition where somebody hits the send button
        // and then blurs the TextInput before we blur it
        sendMessage();
      }
      baseOnBlur?.(event);
    },
    [sendMessage, baseOnBlur],
  );

  return (
    <TextInput
      {...props}
      onKeyPress={onKeyPress}
      autoFocus={focusedRef.current}
      onFocus={onFocus}
      onBlur={onBlur}
      onChangeText={onChangeText}
      value={value}
      ref={textInputRef}
    />
  );
});

const MemoizedAutocorrectableTextInput = React.memo(AutocorrectableTextInput);

export { MemoizedAutocorrectableTextInput as AutocorrectableTextInput };
