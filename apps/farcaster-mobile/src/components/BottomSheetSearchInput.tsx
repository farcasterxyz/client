import { Ionicons } from '@expo/vector-icons';
import { useUnfocusInputs } from 'farcaster-expo';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';

import { BottomSheetTextInput } from './BottomSheetTextInput';

type BottomSheetSearchInputProps = Pick<
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
  | 'placeholder'
  | 'spellCheck'
  | 'value'
  | 'onSubmitEditing'
> & {
  width: number | string;
  align?: 'left' | 'center';
};

const BottomSheetSearchInput: React.FC<BottomSheetSearchInputProps> = ({
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
}) => {
  const t = useTheme();

  const inputRef = useRef<TextInput>(null);

  const [isFocused, setIsFocused] = useState(autoFocus);

  const { addListener, removeListener } = useUnfocusInputs();

  const applyFocusedRenderStyles = React.useMemo(() => {
    return isFocused || !!value;
  }, [isFocused, value]);

  useEffect(() => {
    const onUnfocusInputs = () => {
      inputRef.current?.blur();
    };

    addListener(onUnfocusInputs);

    return () => removeListener(onUnfocusInputs);
  }, [addListener, removeListener]);

  const alignStyle = align === 'center' ? t.justifyCenter : t.justifyStart;

  return (
    <View style={[t.flexRow, alignStyle, t.relative]}>
      <BottomSheetTextInput
        inputRef={inputRef}
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
        selectionColor={t.colors.selection}
        spellCheck={spellCheck}
        style={[
          {
            // android needs height to be explicit to match iOS
            height: 36,
          },
          t.texts.primary,
          t.textBase,
          t.backgrounds.secondary,
          t.roundedLg,
          t.pR2,
          t.pY2,
          t.textLeft,
          t.pL8, // If we change this, be sure to update the padding specified in the Android focus hack above.
          { width },
          t.z0,
          applyFocusedRenderStyles ? t.pR7 : {},
        ]}
        value={value}
      />
      {applyFocusedRenderStyles && (
        <TouchableOpacity
          style={[
            t.flex,
            t.flexRow,
            { right: 7 },
            t.selfCenter,
            t.absolute,
            t.z10,
          ]}
          hitSlop={hitSlop}
          onPress={() => {
            if (onChangeText) {
              onChangeText('');
            }
            (inputRef as RefObject<TextInput>).current?.blur();
          }}
        >
          <Ionicons name="close-circle" size={20} style={t.texts.tertiary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          t.flex,
          t.flexRow,
          applyFocusedRenderStyles ? { left: 0 } : {},
          t.selfCenter,
          t.itemsCenter,
          t.justifyCenter,
          t.absolute,
          t.mL3,
          applyFocusedRenderStyles ? t.texts.brand : t.texts.tertiary,
        ]}
        onPress={() => {
          inputRef.current?.focus();
        }}
      >
        <Ionicons
          name="search-outline"
          size={16}
          style={[t.texts.tertiary, { marginBottom: 0 }]}
        />
        <Text
          style={[
            t.textBase,
            applyFocusedRenderStyles ? t.hidden : t.texts.tertiary,
          ]}
        >
          {' '}
          {placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

BottomSheetSearchInput.displayName = 'BottomSheetSearchInput';

export { BottomSheetSearchInput };
