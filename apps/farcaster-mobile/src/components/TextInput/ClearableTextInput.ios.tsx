import * as React from 'react';
import {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInputProps,
} from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import { ClearableTextInputProps } from './ClearableTextInputProps';
import { LinkifiedTextarea } from './LinkifiedTextarea';

function ClearableTextInput({
  pasteInputRef,
  onChangeText,
  value,
  ref,
  ...rest
}: ClearableTextInputProps) {
  const pendingMessageRef = React.useRef<
    { value: string; resolve: (value: string) => void } | undefined
  >(undefined);
  const lastKeyPressedRef = React.useRef<string | undefined>(undefined);
  const lastTextInputSentRef = React.useRef<number>(-1);
  const focusedRef = React.useRef<boolean>(false);
  const resettingRef = React.useRef<boolean>(false);
  const resetTimeoutRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const [textInputKey, setTextInputKey] = React.useState<number>(0);
  const textInputKeyRef = React.useRef(textInputKey);

  const sendMessage = React.useCallback(() => {
    const pendingMessageSent =
      lastTextInputSentRef.current >= textInputKeyRef.current - 1;
    if (pendingMessageSent) {
      return;
    }
    const pendingMessage = pendingMessageRef.current;
    if (!pendingMessage) {
      throw new Error('pendingMessageRef is undefined in sendMessage');
    }
    pendingMessage.resolve(pendingMessage.value);

    const textInputSent = textInputKeyRef.current - 1;
    if (textInputSent > lastTextInputSentRef.current) {
      lastTextInputSentRef.current = textInputSent;
    }
  }, []);

  const endResetWindow = React.useCallback(() => {
    resettingRef.current = false;
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = undefined;
    }
  }, []);

  React.useEffect(() => endResetWindow, [endResetWindow]);

  const onCurrentInputChangeText = React.useCallback(
    (text: string) => {
      if (resettingRef.current) {
        // While a focused send is resetting the input, iOS may commit a
        // pending autocorrect suggestion, delivering the corrected full text
        // here before the input swap renders. That commit is always the first
        // change event after the send tap and always precedes the send's
        // resolution (change fires before blur), so the window closes on the
        // first event of any kind, and only a multi-code-point event that
        // arrives while the send is still unresolved is treated as the
        // commit: fold it into the in-flight message so the corrected text
        // sends, and swallow it so the field stays cleared. Anything else —
        // a keystroke, a single emoji (which is one code point but multiple
        // UTF-16 units), or any event after the send resolved — is the user
        // typing their next message and falls through.
        endResetWindow();
        const pendingMessage = pendingMessageRef.current;
        const pendingMessageSent =
          lastTextInputSentRef.current >= textInputKeyRef.current - 1;
        if (pendingMessage && !pendingMessageSent && [...text].length > 1) {
          pendingMessage.value = text;
          return;
        }
      }
      onChangeText(text);
    },
    [endResetWindow, onChangeText],
  );

  const onOldInputChangeText = React.useCallback(
    (text: string) => {
      const pendingMessage = pendingMessageRef.current;
      if (!pendingMessage) {
        throw new Error('onOldInputChangeText should have a pendingMessage');
      }
      const lastKeyPressed = lastKeyPressedRef.current;
      const pendingMessageSent =
        lastTextInputSentRef.current >= textInputKeyRef.current - 1;
      if (!pendingMessageSent && lastKeyPressed && lastKeyPressed.length > 1) {
        // This represents an autocorrect event on blur
        pendingMessage.value = text;
      }
      lastKeyPressedRef.current = undefined;

      sendMessage();
    },
    [sendMessage],
  );

  const { onKeyPress } = rest;
  const onOldInputKeyPress = React.useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const { key } = event.nativeEvent;
      if (
        lastKeyPressedRef.current &&
        lastKeyPressedRef.current.length > key.length
      ) {
        return;
      }
      lastKeyPressedRef.current = key;
      onKeyPress?.(event);
    },
    [onKeyPress],
  );

  const onOldInputFocus = React.useCallback(() => {
    // It's possible for the user to press the old input after the new one
    // appears. We can prevent that with pointerEvents="none", but that causes a
    // blur event when we set it, which makes the keyboard briefly pop down
    // before popping back up again when textInputRef is called below. Instead
    // we try to catch the focus event here and refocus the currentTextInput
    pasteInputRef.current?.focus();
  }, [pasteInputRef]);

  const { onSelectionChange } = rest;
  const getValueAndReset = React.useCallback(async () => {
    // We are doing something very naughty here, which is that we are
    // constructing a fake nativeEvent. We are certainly not including all the
    // fields that the type is expected to have, which is why we need to
    // any-type it. We know this is okay because the code that uses
    // ClearableTextInput only accesses event.nativeEvent.selection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeSelectionEvent: any = {
      nativeEvent: { selection: { end: 0, start: 0 } },
    };
    onSelectionChange?.(fakeSelectionEvent);

    onChangeText('');

    if (!focusedRef.current) {
      return value;
    }

    return await new Promise<string>((resolve) => {
      pendingMessageRef.current = { value, resolve };
      resettingRef.current = true;
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(endResetWindow, 500);
      const nextTextInputKey = ++textInputKeyRef.current;
      setTextInputKey(nextTextInputKey);
    });
  }, [endResetWindow, onChangeText, onSelectionChange, value]);

  React.useImperativeHandle(ref, () => ({ getValueAndReset }), [
    getValueAndReset,
  ]);

  const baseOnFocus = rest.onFocus;
  const onFocus = React.useCallback(
    (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      focusedRef.current = true;
      baseOnFocus?.(event);
    },
    [baseOnFocus],
  );

  const baseOnBlur = rest.onBlur;
  const onBlur = React.useCallback(
    (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      focusedRef.current = false;
      if (pendingMessageRef.current) {
        // This is to catch a race condition where somebody hits the send button
        // and then blurs the TextInput before the textInputKey increment can
        // rerender this component. With this.focused set to false, the new
        // TextInput won't focus, and the old TextInput won't blur, which means
        // nothing will call sendMessage unless we do it right here.
        sendMessage();
      }
      baseOnBlur?.(event);
    },
    [sendMessage, baseOnBlur],
  );

  const t = useTheme();

  const containerStyle = React.useMemo(() => {
    const style = [t.absolute, { left: -9999, top: -9999 }];
    if (rest.containerStyle) {
      style.push(...rest.containerStyle);
    }
    return style;
  }, [t.absolute, rest.containerStyle]);

  const textInputs = [];
  if (textInputKey > 0) {
    textInputs.push(
      <LinkifiedTextarea
        {...rest}
        containerStyle={containerStyle}
        onKeyPress={onOldInputKeyPress}
        onFocus={onOldInputFocus}
        onBlur={sendMessage}
        onChangeText={onOldInputChangeText}
        value={value}
        key={textInputKey - 1}
      />,
    );
  }
  textInputs.push(
    <LinkifiedTextarea
      {...rest}
      autoFocus={focusedRef.current}
      onFocus={onFocus}
      onBlur={onBlur}
      onChangeText={onCurrentInputChangeText}
      value={value}
      key={textInputKey}
      ref={pasteInputRef}
    />,
  );

  return <>{textInputs}</>;
}

const MemoizedClearableTextInput = React.memo(ClearableTextInput);

export { MemoizedClearableTextInput as ClearableTextInput };
