import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useUnfocusInputs } from 'farcaster-expo';
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
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

type SearchInputWithAlternateStylingProps = Pick<
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

const SearchInputWithAlternateStyling = forwardRef<
  TextInput,
  SearchInputWithAlternateStylingProps
>(
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

    useFocusEffect(
      useCallback(() => {
        if (Platform.OS === 'android') {
          // On Android there is a bug where if the user signs in (either through importing account or registering)
          // and navigates to the search screen, the TextInput seems to ignore the left padding. This is a hack
          // to manually set the left padding for the native component whenever the screen comes into focus,
          // which seems to force a re-render where Android will respect the given padding.
          currentInput?.setNativeProps({ paddingLeft: sizes.s8 });
        }
      }, [currentInput]),
    );

    const alignStyle = align === 'center' ? t.justifyCenter : t.justifyStart;

    return (
      <View style={[t.flexRow, alignStyle, t.relative]}>
        <TextInput
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
          style={[
            {
              // android needs height to be explicit to match iOS
              height: 36,
              fontSize: 15,
              fontWeight: '400',
              borderRadius: 50,
              color: t.dark ? '#8B99A4' : '#546473',
              borderColor: t.dark ? '#4C3A4EC0' : '#D0D1D259',
            },
            t.border,
            t.pR2,
            t.pY2,
            t.textLeft,
            t.pL10, // If we change this, be sure to update the padding specified in the Android focus hack above.
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
              { marginTop: 7 },
              t.selfCenter,
              t.absolute,
              t.z10,
            ]}
            hitSlop={hitSlop}
            onPress={() => {
              onChangeText && onChangeText('');
              (
                defaultRef.current || (inputRef as RefObject<TextInput>).current
              )?.blur();
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              style={{ color: t.dark ? '#8B99A4' : '#546473' }}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            t.flex,
            t.flexRow,
            applyFocusedRenderStyles ? { left: 0 } : {},
            { marginTop: 10 },
            t.selfCenter,
            t.itemsCenter,
            t.justifyCenter,
            t.absolute,
            t.mL3,
            applyFocusedRenderStyles
              ? t.texts.brand
              : { color: t.dark ? '#8B99A4' : '#546473' },
          ]}
          onPress={() => {
            (
              defaultRef.current || (inputRef as RefObject<TextInput>).current
            )?.focus();
          }}
        >
          <Svg
            width="20"
            height="21"
            viewBox="0 0 20 21"
            fill="none"
            style={[t.mR2]}
          >
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.5415 2.16667C4.74455 2.16667 1.6665 5.24471 1.6665 9.04167C1.6665 12.8386 4.74455 15.9167 8.5415 15.9167C10.2149 15.9167 11.7487 15.3188 12.9409 14.325L17.6829 19.0669C17.927 19.311 18.3227 19.311 18.5668 19.0669C18.8109 18.8229 18.8109 18.4271 18.5668 18.1831L13.8248 13.4411C14.8186 12.2489 15.4165 10.7151 15.4165 9.04167C15.4165 5.24471 12.3385 2.16667 8.5415 2.16667ZM2.9165 9.04167C2.9165 5.93507 5.4349 3.41667 8.5415 3.41667C11.6481 3.41667 14.1665 5.93507 14.1665 9.04167C14.1665 12.1483 11.6481 14.6667 8.5415 14.6667C5.4349 14.6667 2.9165 12.1483 2.9165 9.04167Z"
              fill={t.dark ? '#8B99A4' : '#546473'}
            />
          </Svg>
          <Text
            style={[
              {
                fontSize: 15,
                fontWeight: '400',
              },
              applyFocusedRenderStyles
                ? t.hidden
                : { color: t.dark ? '#8B99A4' : '#546473' },
            ]}
          >
            {placeholder}
          </Text>
        </TouchableOpacity>
      </View>
    );
  },
);

SearchInputWithAlternateStyling.displayName = 'SearchInputWithAlternateStyling';

export { SearchInputWithAlternateStyling };
