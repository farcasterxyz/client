import * as Clipboard from 'expo-clipboard';
import React, {
  forwardRef,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { hitSlop } from '../../constants/Pressable';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnfocusInputs } from '../../contexts/UnfocusInputsProvider';

type TextareaProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'autoFocus'
  | 'editable'
  | 'keyboardType'
  | 'maxLength'
  | 'numberOfLines'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'onSelectionChange'
  | 'onKeyPress'
  | 'placeholder'
  | 'scrollEnabled'
  | 'spellCheck'
  | 'testID'
  | 'textAlignVertical'
  | 'value'
> & {
  bordered?: boolean;
  containerStyle?: ViewStyle[];
  height?: number;
  inputStyle?: TextStyle[];
  maxHeight?: number;
  maxLength?: number;
  minHeight?: number;
  onPasteImage?: (base64Data: string) => void;
  textAlign?: 'left' | 'center';
};

const Textarea = forwardRef<TextInput, TextareaProps>(
  (
    {
      autoCapitalize = 'sentences',
      autoCorrect = true,
      autoFocus,
      bordered = true,
      editable = true,
      keyboardType = 'default',
      height,
      maxLength,
      maxHeight,
      minHeight,
      numberOfLines,
      onBlur,
      onChangeText,
      onFocus,
      onSelectionChange,
      onKeyPress,
      onPasteImage,
      placeholder,
      scrollEnabled = true,
      spellCheck = true,
      containerStyle,
      inputStyle,
      testID,
      textAlign = 'left',
      textAlignVertical = 'top',
      value,
    },
    forwardRef,
  ) => {
    const t = useTheme();

    const fallbackRef = useRef<TextInput>(null);
    const inputRef = (forwardRef || fallbackRef) as RefObject<TextInput>;
    const [isFocused, setIsFocused] = useState(false);

    const { addListener, removeListener } = useUnfocusInputs();

    useEffect(() => {
      const onUnfocusInputs = () => {
        inputRef.current?.blur();
      };
      addListener(onUnfocusInputs);
      return () => removeListener(onUnfocusInputs);
    }, [addListener, inputRef, removeListener]);

    return (
      <View
        style={[
          t.bgInput,
          bordered && t.border,
          isFocused ? t.borderDefault : t.borderDefault,
          t.roundedLg,
          t.flexShrink,
          t.flexGrow0,
          containerStyle,
        ]}
      >
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          editable={editable}
          keyboardType={keyboardType}
          hitSlop={hitSlop}
          maxLength={maxLength}
          multiline
          numberOfLines={numberOfLines}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) {
              onBlur(e);
            }
          }}
          onChangeText={async (text) => {
            // Unfortunately, RN doesn't provide a good way for us to tell that the user
            // has just pasted an image, so we need to infer this from the text.
            // Let's see what text (if any) was added and whether it looks like a file path.
            const addedText = value ? text.replace(value, '') : text;
            const didPotentiallyPasteImage =
              onPasteImage && addedText.trim().startsWith('file:///');

            // If the user did potentially just paste an image, try to pull it from their clipboard
            // and call the `onPasteImage` callback. If we don't find an image, we'll behave as we would
            // for any change text event. If we do find an image, we'll revert to the previous text
            // (i.e. without the filepath) and skip the `onChangeText` callback.
            // This approach has the undesirable side effect of briefly showing the filepath
            // within the text input, but for now it's the best we have.
            if (didPotentiallyPasteImage) {
              const hasImage = await Clipboard.hasImageAsync();

              if (hasImage) {
                const clipboardImage = await Clipboard.getImageAsync({
                  format: 'png',
                });

                if (clipboardImage && onPasteImage) {
                  onPasteImage(clipboardImage.data);
                }

                // Revert the changed text, because the user just pasted an image,
                // then return before calling the onChangeText callback.
                inputRef.current?.setNativeProps({ text: value });
                return;
              }
            }

            if (onChangeText) {
              onChangeText(text);
            }
          }}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) {
              onFocus(e);
            }
          }}
          onKeyPress={onKeyPress}
          onSelectionChange={onSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={t.colors.text.tertiary}
          ref={inputRef}
          scrollEnabled={scrollEnabled}
          selectionColor={t.colors.selection}
          spellCheck={spellCheck}
          testID={testID}
          style={[
            textAlign === 'center' ? t.textCenter : t.textLeft,
            t.texts.primary,
            t.textLg,
            t.alignCenter,
            {
              height,
              minHeight,
              maxHeight,
            },
            inputStyle,
          ]}
          textAlignVertical={textAlignVertical}
          value={value}
        />
      </View>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
