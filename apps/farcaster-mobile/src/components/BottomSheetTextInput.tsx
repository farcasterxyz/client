import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { runOnJS } from 'react-native-reanimated';

import { trackError } from '~/utils/ErrorUtils';

type BottomSheetTextInputProps = TextInputProps & {
  inputRef: React.RefObject<TextInput | null>;
};
type KeyboardEventsHandle = {
  shouldHandleKeyboardEvents?: {
    value: boolean;
  };
};

const BottomSheetTextInput: React.FC<BottomSheetTextInputProps> = React.memo(
  ({ inputRef, onFocus, onBlur, ...rest }) => {
    // see https://ui.gorhom.dev/components/bottom-sheet/keyboard-handling/
    const { shouldHandleKeyboardEvents } =
      useBottomSheetInternal() as KeyboardEventsHandle;

    const setKeyboardHandling = React.useCallback(
      (value: boolean) => {
        try {
          if (!shouldHandleKeyboardEvents) {
            return;
          }
          shouldHandleKeyboardEvents.value = value;
        } catch (error) {
          trackError(error);
        }
      },
      [shouldHandleKeyboardEvents],
    );

    useEffect(() => {
      return () => {
        // Reset the flag on unmount
        runOnJS(setKeyboardHandling)(false);
      };
    }, [setKeyboardHandling]);

    const handleOnFocus = useCallback(
      (args: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        runOnJS(setKeyboardHandling)(true);
        if (onFocus) {
          onFocus(args);
        }
      },
      [onFocus, setKeyboardHandling],
    );

    const handleOnBlur = useCallback(
      (args: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        runOnJS(setKeyboardHandling)(false);
        if (onBlur) {
          onBlur(args);
        }
      },
      [onBlur, setKeyboardHandling],
    );

    return (
      <TextInput
        ref={inputRef}
        onBlur={handleOnBlur}
        onFocus={handleOnFocus}
        {...rest}
      />
    );
  },
);

BottomSheetTextInput.displayName = 'BottomSheetTextInput';

export { BottomSheetTextInput };
