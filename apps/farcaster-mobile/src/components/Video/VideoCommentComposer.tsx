import { Octicons } from '@expo/vector-icons';
import { PasteInputRef } from '@mattermost/react-native-paste-input';
import { ApiCast, ApiUser } from 'farcaster-client-data';
import {
  CastReactionType,
  useCreateCast,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { Platform, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Spacer } from '~/components/Spacer';
import { ClearableTextInput } from '~/components/TextInput/ClearableTextInput';
import { ClearableTextInputRef } from '~/components/TextInput/ClearableTextInputProps';
import { hitSlop } from '~/constants/Pressable';
import { mentionRegexForAutocomplete } from '~/constants/Regex';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { UserMentionAutocomplete } from '~/screens/CreateCast/UserMentionAutocomplete';
import { getGenericAutocompleteMentionInfo } from '~/utils/CastUtils';
import { trackError } from '~/utils/ErrorUtils';

const inputMinHeight = 36;
const inputMaxHeight = 180;

const styleRoundedComposer = {
  borderRadius: 20,
  overflow: 'hidden',
} as ViewStyle;

const styleCenterButtonsWrapper = {
  height: inputMinHeight,
  justifyContent: 'center',
  alignSelf: 'flex-end',
} as ViewStyle;

type VideoCommentComposerProps = {
  cast: ApiCast;
  onSuccess?: ({ cast }: { cast: ApiCast }) => void;
  onError?: () => void;
  onMentionsPanelVisibleChange?: (isVisible: boolean) => void;
};

const VideoCommentComposer: React.FC<VideoCommentComposerProps> = React.memo(
  ({ cast, onSuccess, onError, onMentionsPanelVisibleChange }) => {
    const t = useTheme();

    const createCast = useCreateCast();
    const trackCastReaction = useTrackCastReaction();
    const currentUser = useCurrentUser_UNSAFE();
    const [commentText, setCommentText] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [selection, setSelection] = React.useState<{
      start: number;
      end: number;
    }>();

    const pasteInputRef = React.useRef<PasteInputRef>(null);
    const clearableTextInputRef = React.useRef<ClearableTextInputRef>(null);

    const getAutocompleteMentionInfo = (
      text: string,
      selection: undefined | { start: number; end: number },
    ) => {
      const userMentionInfo = getGenericAutocompleteMentionInfo(
        text.toLowerCase(),
        selection,
        '@',
        mentionRegexForAutocomplete,
      );
      if (userMentionInfo) {
        return { ...userMentionInfo, type: 'user' };
      }
    };

    const mentionInfo = useMemo(() => {
      const info = getAutocompleteMentionInfo(commentText, selection);
      return info;
    }, [selection, commentText]);

    const canSendComment = React.useMemo(() => {
      return !!(commentText && commentText.trim()) && !isLoading;
    }, [commentText, isLoading]);

    const onChangeText = React.useCallback((text: string) => {
      setCommentText(text);
    }, []);

    const onSendPress = React.useCallback(async () => {
      if (!commentText.trim() || isLoading) {
        return;
      }

      const message = commentText.trim();
      if (!message) {
        return;
      }

      setIsLoading(true);

      try {
        const data = await createCast({
          fid: currentUser.fid,
          castText: message,
          parentCastHash: cast.hash,
          skipFeedRegenrationDelay: true,
        });
        if (data === null) {
          onError?.();
        } else {
          trackCastReaction({
            castHash: cast.hash,
            type: CastReactionType.Reply,
            undo: false,
            feed: 'video',
          });
          clearableTextInputRef.current?.getValueAndReset();
          onSuccess?.({ cast: data.result.cast });
        }
        setIsLoading(false);
      } catch (error) {
        trackError(error);
        onError?.();
      } finally {
        setIsLoading(false);
      }
    }, [
      cast.hash,
      commentText,
      createCast,
      currentUser.fid,
      isLoading,
      onError,
      onSuccess,
      trackCastReaction,
    ]);

    const [userMentionsForHighlights, setUserMentionsForHighlights] =
      React.useState<string[]>([]);

    const onAutocompleteMention = React.useCallback(
      (user: ApiUser) => {
        if (mentionInfo?.type === 'user') {
          const newText =
            commentText.slice(0, mentionInfo.replace.start) +
            user.username +
            ' ' +
            commentText.slice(mentionInfo.replace.end);
          setCommentText(newText);

          if (typeof user.username !== 'undefined') {
            const username = user.username;
            setUserMentionsForHighlights((prev) => [username, ...prev]);
          }

          // Focus back on input
          setTimeout(() => pasteInputRef.current?.focus(), 50);
        }
      },
      [mentionInfo, commentText, setUserMentionsForHighlights],
    );

    return (
      <View style={[t.borderTHairline, t.borderFaint]}>
        <UserMentionAutocomplete
          mentionText={mentionInfo?.text.toLowerCase()}
          onAutocompleteMention={onAutocompleteMention}
          style={[
            t.bgDefault,
            {
              shadowColor: 'black',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
            },
          ]}
          inBottomSheet={true}
          onVisibleChange={onMentionsPanelVisibleChange}
        />
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.relative,
            t.bgDefault,
            t.pT2,
            t.pB2,
            t.flexGrow0,
          ]}
        >
          <Spacer horizontal size={3} />
          <Avatar
            diameter={40}
            pfpUrl={currentUser.pfp?.url}
            isHighlighted={false}
          />
          <Spacer horizontal size={3} />
          <View
            style={[
              t.flex1,
              t.flex,
              t.flexCol,
              t.roundedLg,
              t.flexGrow,
              t.backgrounds.default,
              styleRoundedComposer,
            ]}
          >
            <ClearableTextInput
              maxHeight={inputMaxHeight}
              pasteInputRef={pasteInputRef}
              ref={clearableTextInputRef}
              placeholder={`Add a comment...`}
              containerStyle={[
                t.backgrounds.default,
                t.texts.primary,
                {
                  paddingTop: 4,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingBottom: Platform.OS === 'android' ? 4 : 8,
                  maxHeight: inputMaxHeight,
                  fontSize: 16,
                },
              ]}
              value={commentText}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              onChangeText={onChangeText}
              inBottomSheet={true}
              editable={!isLoading}
              userMentions={userMentionsForHighlights}
            />
          </View>
          <Spacer horizontal size={4} />
          <View style={styleCenterButtonsWrapper}>
            <TouchableOpacity
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyCenter,
                canSendComment ? t.opacity100 : t.opacity50,
                t.bgAction,
                t.roundedFull,
                t.h8,
                t.w8,
                { height: 30, width: 30 },
              ]}
              hitSlop={hitSlop}
              onPress={onSendPress}
              disabled={!canSendComment}
              activeOpacity={0.75}
            >
              <Octicons
                name="arrow-up"
                size={16}
                style={[t.texts.light, { paddingLeft: 2 }]}
              />
            </TouchableOpacity>
          </View>
          <Spacer horizontal size={4} />
        </View>
      </View>
    );
  },
);

export { VideoCommentComposer };
