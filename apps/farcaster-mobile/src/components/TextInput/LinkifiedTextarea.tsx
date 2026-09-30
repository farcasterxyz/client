import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import PasteInput, {
  PastedFile,
  PasteInputRef,
} from '@mattermost/react-native-paste-input';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useUnfocusInputs } from 'farcaster-expo';
import React, { RefObject, useEffect, useRef } from 'react';
import {
  Platform,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { BottomSheetPasteInput } from '~/components/BottomSheet/BottomSheetPasteInput';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { LinkifyInstanceType } from '~/utils/LinkifyUtils';

export type TextareaProps = Pick<
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
  | 'textAlignVertical'
  | 'value'
> & {
  bordered?: boolean;
  containerStyle?: ViewStyle[];
  height?: number;
  inputStyle?: TextStyle[];
  textStyle?: TextStyle[];
  maxHeight?: number;
  maxLength?: number;
  minHeight?: number;
  textAlign?: 'left' | 'center';
  userMentions?: string[];
  channelMentions?: string[];
  onImagePaste?: ({ pastedImageFile }: { pastedImageFile: PastedFile }) => void;
  linkifyInstance?: LinkifyInstanceType;
  ref?: RefObject<null | PasteInputRef>;
  inBottomSheet?: boolean;
};

const LinkifiedTextarea = ({
  autoCapitalize = 'sentences',
  autoCorrect = true,
  autoFocus,
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
  placeholder,
  scrollEnabled = true,
  spellCheck = true,
  containerStyle,
  inputStyle,
  textStyle,
  textAlign = 'left',
  textAlignVertical = 'top',
  value = '',
  userMentions,
  channelMentions,
  onImagePaste,
  linkifyInstance,
  ref,
  inBottomSheet,
}: TextareaProps) => {
  const t = useTheme();

  const fallbackRef: RefObject<null | PasteInputRef> =
    useRef<PasteInputRef>(null);
  const inputRef = (ref || fallbackRef) as RefObject<null | PasteInputRef>;
  const { trackEvent } = useAnalytics();

  const { addListener, removeListener } = useUnfocusInputs();

  const onPaste = React.useCallback(
    async (err: string | undefined, files: PastedFile[]) => {
      if (err) {
        return;
      }
      DdRum.addAction(
        RumActionType.CUSTOM,
        'PastedFile.LinkifiedTextarea.onPaste',
        {},
      );
      trackEvent(AnalyticsEvent.MiscPastedFile, {
        source: 'LinkifiedTextarea',
      });

      const firstImageMatchedFromPastedFiles = files.find((f) =>
        /\.(jpg|jpeg|png).*$/.test(f.uri),
      );

      if (
        typeof firstImageMatchedFromPastedFiles !== 'undefined' &&
        typeof onImagePaste !== 'undefined'
      ) {
        onImagePaste({ pastedImageFile: firstImageMatchedFromPastedFiles });
      }
    },
    [onImagePaste, trackEvent],
  );

  useEffect(() => {
    const onUnfocusInputs = () => {
      inputRef.current?.blur();
    };
    addListener(onUnfocusInputs);
    return () => removeListener(onUnfocusInputs);
  }, [addListener, inputRef, removeListener]);

  // RN 0.83 / Expo 55 regressions can make PasteInput fail to receive focus/taps
  // in some composer flows. Use native TextInput on mobile for consistent behavior.
  const useNativeTextInputFallback =
    Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View
      style={[
        t.bgInput,
        t.roundedLg,
        t.flexShrink,
        t.flexGrow0,
        containerStyle,
      ]}
    >
      {useNativeTextInputFallback ? (
        // IMPORTANT: keep this branch a controlled input via `value`. We
        // intentionally do NOT render `<Text>{linkifiedText}</Text>` as
        // children of TextInput here:
        //   - On iOS the native UITextView ignores `children` for content
        //     (it only reads `value`/`defaultValue`), so the JS state and
        //     the native text become desynchronized as you type, leading
        //     to dropped keystrokes, cursor jumps, and the IME composing
        //     buffer breaking after the input has been alive for a while.
        //   - On Android, mixing `value` with `children` triggers an
        //     invariant, and even without `value` the children-driven
        //     path resets edit state on every render.
        // Inline link/mention styling on the input itself is therefore
        // only available on the PasteInput (web) branch below; on mobile
        // the input renders plain text and styling is applied to the
        // rendered cast preview instead.
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline
          numberOfLines={numberOfLines}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onKeyPress={onKeyPress}
          onSelectionChange={onSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={t.colors.text.tertiary}
          ref={inputRef as unknown as RefObject<TextInput>}
          scrollEnabled={scrollEnabled}
          selectionColor={t.colors.selection}
          spellCheck={spellCheck}
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
      ) : (
        <LinkifiedPasteInput
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          editable={editable}
          keyboardType={keyboardType}
          inBottomSheet={inBottomSheet}
          inputRef={inputRef}
          maxLength={maxLength}
          numberOfLines={numberOfLines}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onPaste={onPaste}
          onKeyPress={onKeyPress}
          onSelectionChange={onSelectionChange}
          placeholder={placeholder}
          scrollEnabled={scrollEnabled}
          spellCheck={spellCheck}
          height={height}
          inputStyle={inputStyle}
          linkifyInstance={linkifyInstance}
          maxHeight={maxHeight}
          minHeight={minHeight}
          textAlign={textAlign}
          textStyle={textStyle}
          textAlignVertical={textAlignVertical}
          userMentions={userMentions}
          channelMentions={channelMentions}
          value={value}
        />
      )}
    </View>
  );
};

type LinkifiedPasteInputProps = Omit<
  TextareaProps,
  'containerStyle' | 'onImagePaste' | 'ref'
> & {
  inputRef: RefObject<null | PasteInputRef>;
  onPaste: (err: string | undefined, files: PastedFile[]) => Promise<void>;
};

const LinkifiedPasteInput = ({
  autoCapitalize,
  autoCorrect,
  autoFocus,
  editable,
  keyboardType,
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
  onPaste,
  placeholder,
  scrollEnabled,
  spellCheck,
  inputRef,
  inputStyle,
  textStyle,
  textAlign,
  textAlignVertical,
  value = '',
  userMentions,
  channelMentions,
  linkifyInstance,
  inBottomSheet,
}: LinkifiedPasteInputProps) => {
  const t = useTheme();
  const PasteInputComponent = inBottomSheet
    ? BottomSheetPasteInput
    : PasteInput;

  const { linkifiedText } = useLinkifyText({
    text: value,
    mentions: userMentions,
    channelMentions,
    options: {
      // Pasted cast links shouldn't be truncated since they will
      // be stored truncated on cast text.
      skipFarcasterLinkTruncate: true,
      skipURLTruncates: true,
      applyInvertedLinkStyles: [],
      linkifyInstance,
      textChangeAllowed: false,
      treatImageUrlsAsLinks: true,
    },
  });

  return (
    <PasteInputComponent
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      autoFocus={autoFocus}
      editable={editable}
      keyboardType={keyboardType}
      hitSlop={hitSlop}
      maxLength={maxLength}
      multiline
      numberOfLines={numberOfLines}
      onBlur={(e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        if (onBlur) {
          onBlur(e);
        }
      }}
      onChangeText={onChangeText}
      onFocus={(e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        if (onFocus) {
          onFocus(e);
        }
      }}
      onPaste={onPaste}
      onKeyPress={onKeyPress}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      placeholderTextColor={t.colors.text.tertiary}
      ref={inputRef}
      scrollEnabled={scrollEnabled}
      selectionColor={t.colors.selection}
      spellCheck={spellCheck}
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
    >
      <Text style={[t.texts.primary, t.textLg, textStyle]}>
        {linkifiedText}
      </Text>
    </PasteInputComponent>
  );
};

LinkifiedTextarea.displayName = 'LinkifiedTextarea';

export { LinkifiedTextarea };
