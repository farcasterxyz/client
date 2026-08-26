import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import PasteInput, {
  PasteInputProps,
  PasteInputRef,
} from '@mattermost/react-native-paste-input';
import React from 'react';
import { runOnJS } from 'react-native-reanimated';

import { trackError } from '~/utils/ErrorUtils';

type Props = PasteInputProps;
type KeyboardEventsHandle = {
  shouldHandleKeyboardEvents?: {
    value: boolean;
  };
};

export const BottomSheetPasteInput = React.forwardRef<PasteInputRef, Props>(
  ({ onFocus, onBlur, ...rest }, ref) => {
    // tells the modal when it should handle keyboard events
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

    const handleFocus = React.useCallback(
      (e: Parameters<NonNullable<PasteInputProps['onFocus']>>[0]) => {
        runOnJS(setKeyboardHandling)(true);
        onFocus?.(e);
      },
      [setKeyboardHandling, onFocus],
    );

    const handleBlur = React.useCallback(
      (e: Parameters<NonNullable<PasteInputProps['onBlur']>>[0]) => {
        runOnJS(setKeyboardHandling)(false);
        onBlur?.(e);
      },
      [setKeyboardHandling, onBlur],
    );

    return (
      <PasteInput
        ref={ref}
        {...rest}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  },
);
