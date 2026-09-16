import * as Clipboard from 'expo-clipboard';
import { useRootToast } from 'farcaster-expo';
import React, { FC, memo, ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { LongPressCopyText } from '~/components/LongPressCopyText';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';

type CastBodyProps = {
  bodyWithLinks: ReactNode;
  isFocusedCast: boolean;
  numberOfLines?: number;
  copyableText?: string;
};

const EXTRA_WHITESPACE_FOR_SHOW_MORE_HANDLING = ' ';

// Bumped this from 10 -> 12 as most 320 on recent iPhone devices were getting the
// show more treatment.
// FIXME: The real issue here is React Native sometimes collapses new lines when
// max lines are set and that results in lines count not matching what was rendered.
const FEED_MAX_LINES = 12;

const CastBody: FC<CastBodyProps> = memo(
  ({ bodyWithLinks, isFocusedCast, numberOfLines, copyableText }) => {
    const t = useTheme();
    const toast = useRootToast();

    const textStyles = useCastBodyTextStyle(isFocusedCast);

    const onCopy = React.useCallback(async () => {
      if (!copyableText) {
        return;
      }

      await Clipboard.setStringAsync(copyableText);
      toast.show('Cast text copied to clipboard', {
        type: 'success',
        placement: 'bottom',
      });
    }, [copyableText, toast]);

    const style = [
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.texts.primary,
      ...textStyles,
    ];

    return (
      <View style={[t.flexCol]}>
        {bodyWithLinks !== null &&
          (isFocusedCast ? (
            // `selectable` is a no-op on Android under RN 0.83 New
            // Architecture, so Android gets the long-press "Copy" bubble
            // instead; iOS keeps the native selection callout.
            Platform.OS === 'android' && copyableText ? (
              <LongPressCopyText
                style={style}
                onCopy={onCopy}
                accessibilityLabel="Copy cast text"
              >
                {bodyWithLinks}
              </LongPressCopyText>
            ) : (
              <Text style={style} selectable={true}>
                {bodyWithLinks}
              </Text>
            )
          ) : (
            <Text style={style} numberOfLines={numberOfLines}>
              {bodyWithLinks}
            </Text>
          ))}
      </View>
    );
  },
);

type FeedCastBodyProps = CastBodyProps & {
  skipShowMoreCTA: boolean;
  isTruncatedCastText: boolean;
  onShowMorePress: () => void;
};

// Splitting this due to the rendering difference between the thread and feed views.
// Keeping them the same component requires a re-render and text layout shifts between
// renders of thread and feed for the same cast so it does not work that well.
const FeedCastBody: FC<FeedCastBodyProps> = memo(
  ({
    bodyWithLinks,
    isTruncatedCastText,
    onShowMorePress,
    skipShowMoreCTA,
  }) => {
    const t = useTheme();
    const textStyles = useCastBodyTextStyle();

    const [shouldExpandInPlace, setShouldExpandInPlace] =
      React.useState<boolean>(false);

    const onShowMorePressInternal = React.useCallback(() => {
      setShouldExpandInPlace(true);

      onShowMorePress();
    }, [onShowMorePress]);

    const showMoreToRender = React.useMemo(() => {
      // TODO: Show more will no longer trigger due to the presable gate we added
      if (Platform.OS === 'ios') {
        return (
          <TextWithPress style={[t.rounded]} onPress={onShowMorePressInternal}>
            <Text style={[t.texts.brand, ...textStyles]}>Show more</Text>
          </TextWithPress>
        );
      }

      return <Text style={[...textStyles, t.texts.brand]}>Show more</Text>;
    }, [onShowMorePressInternal, t.rounded, t.texts.brand, textStyles]);

    const castNumberOfLinesVisible = isTruncatedCastText
      ? FEED_MAX_LINES
      : undefined;

    const numberOfLines = React.useMemo(() => {
      // Why are we doing this instead of setting the number of lines state?
      // We don't want to trigger any extra text layout callbacks to trigger new state updates.
      // This should result quickly in to update on the param.
      return shouldExpandInPlace ? undefined : castNumberOfLinesVisible;
    }, [castNumberOfLinesVisible, shouldExpandInPlace]);

    // const ellipsisSuffixed = React.useMemo(() => {
    //   return shouldExpandInPlace ? undefined : shouldShowEllipsis;
    // }, [shouldExpandInPlace, shouldShowEllipsis]);

    return (
      // NEYN-11640: stable selector for Maestro E2E flows that need to
      // navigate to cast detail. The outer cast-row Pressable
      // (CastContainer.tsx) is covered by nested touchables (avatar,
      // username, channel link) in its header row, so a bounds-center
      // tap on a short text-only cast lands on the channel link and
      // navigates to the channel instead of the cast detail — observed
      // in run 27290217711 / BS build b4af7aa5f7f9e8a78ef58ff64c89683f2ca602ff,
      // open-close-cast flow. The body View has no nested Pressable,
      // so its bounds-center tap bubbles up to the cast-row onPress.
      <View testID="cast-body" style={[t.relative, t.flexCol]}>
        {bodyWithLinks !== null && (
          <Text
            numberOfLines={numberOfLines}
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.texts.primary,
              ...textStyles,
            ]}
          >
            {bodyWithLinks}
            {typeof numberOfLines === 'undefined' &&
              isTruncatedCastText &&
              !skipShowMoreCTA &&
              EXTRA_WHITESPACE_FOR_SHOW_MORE_HANDLING}
            {typeof numberOfLines === 'undefined' &&
              isTruncatedCastText &&
              !skipShowMoreCTA &&
              showMoreToRender}
          </Text>
        )}
        {typeof numberOfLines !== 'undefined' &&
          !skipShowMoreCTA &&
          showMoreToRender}
      </View>
    );
  },
);

export { CastBody, FeedCastBody };
