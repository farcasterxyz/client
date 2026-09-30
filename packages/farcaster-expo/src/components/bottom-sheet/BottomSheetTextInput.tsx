import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import React from 'react';
import { runOnJS } from 'react-native-reanimated';

import { useSharedTelemetry } from '../../contexts';
import { TextInput, TextInputProps } from '../design-system';

type Props = TextInputProps;
type KeyboardEventsHandle = {
  shouldHandleKeyboardEvents?: {
    value: boolean;
  };
};

export const BottomSheetTextInput = React.forwardRef<TextInput, Props>(
  ({ onFocus, onBlur, ...rest }, ref) => {
    // tells the modal when it should handle keyboard events
    const { shouldHandleKeyboardEvents } =
      useBottomSheetInternal() as KeyboardEventsHandle;
    const { trackError } = useSharedTelemetry();

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
      [shouldHandleKeyboardEvents, trackError],
    );

    const handleFocus = React.useCallback(
      (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        runOnJS(setKeyboardHandling)(true);
        onFocus?.(e);
      },
      [setKeyboardHandling, onFocus],
    );

    const handleBlur = React.useCallback(
      (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        runOnJS(setKeyboardHandling)(false);
        onBlur?.(e);
      },
      [setKeyboardHandling, onBlur],
    );

    return (
      <TextInput
        ref={ref}
        {...rest}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  },
);
