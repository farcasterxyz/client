import * as Clipboard from 'expo-clipboard';
import { ClipboardPaste, Search, X } from 'lucide-react-native';
import React, {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { hitSlop } from '../../constants';
import { useTheme, useUnfocusInputs } from '../../contexts';
import { useSafeFocusEffect } from '../../hooks/useSafeFocusEffect';
import { sizes } from '../../theme';
import { BottomSheetTextInput } from '../bottom-sheet/BottomSheetTextInput';
import { AnimatedPressable } from './AnimatedPressable';
import { TextInput } from './atoms/TextInput';
import { Text2 } from './Text';

type SearchInputProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'autoFocus'
  | 'editable'
  | 'keyboardType'
  | 'onBlur'
  | 'onFocus'
  | 'onChangeText'
  | 'onKeyPress'
  | 'spellCheck'
  | 'value'
  | 'onSubmitEditing'
> & {
  width: number | string;
  align?: 'left' | 'center';
  inBottomSheet?: boolean;
  placeholder: string | React.ReactElement;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
  onPaste?: (text: string) => void;
  pasteColor?: string;
};

const SearchInput = forwardRef<TextInput, SearchInputProps>(
  (
    {
      autoCapitalize = 'none',
      autoCorrect = true,
      autoFocus,
      editable,
      keyboardType,
      onChangeText,
      onKeyPress,
      onBlur,
      onFocus,
      onSubmitEditing,
      placeholder,
      spellCheck = true,
      value,
      width,
      align = 'center',
      inBottomSheet = false,
      onClose,
      style,
      placeholderStyle,
      onPaste,
      pasteColor,
    },
    inputRef,
  ) => {
    const t = useTheme();

    const defaultRef = useRef<TextInput>(null);

    const currentInput = inputRef
      ? (inputRef as RefObject<TextInput>).current
      : defaultRef.current;

    const [isFocused, setIsFocused] = useState(autoFocus);

    const { addListener, removeListener } = useUnfocusInputs();

    const applyFocusedRenderStyles = React.useMemo(() => {
      return isFocused || !!value;
    }, [isFocused, value]);

    useEffect(() => {
      const onUnfocusInputs = () => {
        currentInput?.blur();
      };

      addListener(onUnfocusInputs);

      return () => removeListener(onUnfocusInputs);
    }, [addListener, currentInput, inputRef, removeListener]);

    useSafeFocusEffect(
      useCallback(() => {
        if (Platform.OS === 'android') {
          // On Android there is a bug where if the user signs in (either through importing account or registering)
          // and navigates to the search screen, the TextInput seems to ignore the left padding. This is a hack
          // to manually set the left padding for the native component whenever the screen comes into focus,
          // which seems to force a re-render where Android will respect the given padding.
          currentInput?.setNativeProps({ paddingLeft: sizes.s9 });
        }
      }, [currentInput]),
    );

    const alignStyle = align === 'center' ? t.justifyCenter : t.justifyStart;

    const SearchInputComponent = inBottomSheet
      ? BottomSheetTextInput
      : TextInput;

    return (
      <View style={[t.flexRow, alignStyle, t.relative]}>
        <SearchInputComponent
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          clearButtonMode="never"
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          hitSlop={hitSlop}
          keyboardType={keyboardType}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) {
              onBlur(e);
            }
          }}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) {
              onFocus(e);
            }
          }}
          onKeyPress={onKeyPress}
          ref={inputRef ?? defaultRef}
          selectionColor={t.colors.selection}
          spellCheck={spellCheck}
          returnKeyType="search"
          style={[
            {
              // android needs height to be explicit to match iOS
              height: 40,
              borderRadius: 8,
            },
            t.texts.primary,
            t.textBase,
            t.fontMedium,
            t.backgrounds.secondary,
            t.borderHairline,
            t.borders.primary,
            t.pR2,
            t.pY2,
            t.textLeft,
            t.pL9, // If we change this, be sure to update the padding specified in the Android focus hack above.
            { width },
            t.z0,
            applyFocusedRenderStyles ? t.pR7 : {},
            style,
          ]}
          value={value}
        />
        {applyFocusedRenderStyles && (
          <AnimatedPressable
            style={[
              t.flex,
              t.flexRow,
              t.absolute,
              t.z10,
              t.top0,
              t.right0,
              t.bottom0,
              t.itemsCenter,
              t.p2,
            ]}
            onPress={() => {
              onChangeText && onChangeText('');
              (
                defaultRef.current || (inputRef as RefObject<TextInput>).current
              )?.blur();
              onClose?.();
            }}
          >
            <X size={18} style={[t.texts.primary]} />
          </AnimatedPressable>
        )}
        <Pressable
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.wFull,
            t.justifyBetween,
            t.absolute,
            t.pX3,
            { height: 40, gap: 4 },
            applyFocusedRenderStyles ? t.texts.brand : t.texts.tertiary,
            applyFocusedRenderStyles && { pointerEvents: 'none', opacity: 0.5 },
          ]}
          onPress={() => {
            (
              defaultRef.current || (inputRef as RefObject<TextInput>).current
            )?.focus();
          }}
        >
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Search size={18} style={placeholderStyle ?? t.texts.tertiary} />
            <View style={[applyFocusedRenderStyles ? t.hidden : undefined]}>
              {typeof placeholder === 'string' ? (
                <Text2
                  align="left"
                  weight="medium"
                  style={placeholderStyle ?? t.texts.tertiary}
                >
                  {' '}
                  {placeholder}
                </Text2>
              ) : (
                placeholder
              )}
            </View>
          </View>
          {onPaste && (
            <AnimatedPressable
              style={[
                t.flexRow,
                t.itemsCenter,
                { gap: 4 },
                applyFocusedRenderStyles && t.hidden,
              ]}
              onPress={() => {
                Clipboard.getStringAsync().then((text) => {
                  const trimmedText = text.trim();
                  onPaste(trimmedText);
                  (
                    defaultRef.current ||
                    (inputRef as RefObject<TextInput>).current
                  )?.blur();
                });
              }}
            >
              <ClipboardPaste
                size={18}
                color={pasteColor ?? t.colors.text.secondary}
              />
              <Text2
                weight="medium"
                size="sm"
                style={[{ color: pasteColor ?? t.colors.text.secondary }]}
              >
                Paste
              </Text2>
            </AnimatedPressable>
          )}
        </Pressable>
      </View>
    );
  },
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
