import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Octicons } from '@expo/vector-icons';
import {
  PastedFile,
  PasteInputRef,
} from '@mattermost/react-native-paste-input';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationViewCategory,
  ApiDirectCastMessageMetadata,
  ApiDirectCastMessageV3,
  ApiDirectCastUrlEmbedDisplayMode,
  ApiUser,
} from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { generateMessageId } from 'farcaster-cryptography';
import { useRootToast } from 'farcaster-expo';
import Linkify from 'linkify-it';
import debounce from 'lodash/debounce';
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Spacer } from '~/components/Spacer';
import { Text } from '~/components/Text';
import { ClearableTextInput } from '~/components/TextInput/ClearableTextInput';
import { ClearableTextInputRef } from '~/components/TextInput/ClearableTextInputProps';
import { directCastFontSize } from '~/constants/Cast';
import { imageRequestHeaders } from '~/constants/Images';
import { userLinkPrefix } from '~/constants/Link';
import { hitSlop } from '~/constants/Pressable';
import {
  cashtagMentionRegexForAutocomplete,
  cashtagMentionRegexForLinkify,
  mentionRegexForAutocomplete,
  mentionRegexForLinkify,
} from '~/constants/Regex';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDirectCastsDrafts } from '~/contexts/DirectCastsDraftsProvider';
import {
  AssetToImageUrlUpdateCallback,
  useDirectCastsImagePreview,
} from '~/contexts/DirectCastsImageUploadPreviewProvider';
import { useDirectCasts } from '~/contexts/DirectCastsProvider';
import { useDirectCastsVideoPreview } from '~/contexts/DirectCastsVideoUploadPreviewProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useHaptics } from '~/hooks/useHaptics';
import { useSetTabBarTopBorderHidden } from '~/navigation/BottomTabNavigatorContext';
import { UserMentionAutocomplete } from '~/screens/CreateCast/UserMentionAutocomplete';
import {
  getGenericAutocompleteMentionInfo,
  MAX_DIRECT_CAST_TEXT_LENGTH,
} from '~/utils/CastUtils';
import {
  persistDirectCastUrlEmbedDisplayMode,
  persistDirectCastUrlEmbedHidden,
} from '~/utils/directCastUrlEmbedHiddenStorage';
import { trackError } from '~/utils/ErrorUtils';
import {
  manuallyFetchDimensions,
  requestMediaLibraryPermissions,
} from '~/utils/ImageUtils';
import { tlds } from '~/utils/LinkifyUtils';
import { splice } from '~/utils/StringUtils';

import {
  DirectCastComposerEmbedPreviewsInterface,
  DirectCastsComposerEmbedPreviews,
} from './DirectCastComposerEmbedPreview';
import { DirectCastReplyTo } from './Embeds/DirectCastReplyTo';

const inputMinHeight = 36;
const inputMaxHeight = 360;

const styleRoundedComposer = {
  borderRadius: 20,
  overflow: 'hidden',
} as ViewStyle;

const styleCenterButtonsWrapper = {
  height: inputMinHeight,
  justifyContent: 'center',
  alignSelf: 'flex-end',
} as ViewStyle;

type PlaintextDirectCastComposerProps = {
  onInputFocus: () => void;
  onInputBlur: () => void;
  conversationId: string;
  conversationName: string;
  conversationParticipants: ApiUser[];
  conversationCategory: ApiDirectCastConversationViewCategory;
  conversationIsTokenGated: boolean;
  replyTo: ApiDirectCastMessageV3 | undefined;
  replyToSenderDisplayName: string | undefined;
  onDismissReplyTo: () => void;
  onBeforeSend?: () => void;
  onAfterSend?: () => void;
  intentText: string | undefined;
};

const getDirectCastsComposerInstance = () => {
  const instance = new Linkify();
  instance.tlds(tlds, true);

  instance.add('@', {
    validate: function (text, pos) {
      const tail: string = text.slice(pos);

      if (mentionRegexForLinkify.test(tail)) {
        // Linkifier allows punctuation chars before prefix,
        // but we additionally disable `@` ("@@mention" is invalid)
        if (tail.charAt(0) === '@') {
          return false;
        }

        const matches = tail.match(mentionRegexForLinkify);

        if (matches && matches.length > 0) {
          return matches[0].length;
        }
      }

      return false;
    },
    normalize: function (match) {
      match.url = userLinkPrefix + match.url.replace(/^@/, '');
    },
  });

  instance.add('$', {
    validate: (textToMatch: string, pos: number) => {
      const tail: string = textToMatch.slice(pos);
      const matches = tail.match(cashtagMentionRegexForLinkify);
      return matches?.[0]?.length || false;
    },
  });

  instance.set({ fuzzyLink: false });
  instance.set({ fuzzyEmail: false });
  instance.add('mailto:', null);
  instance.add('/', null);

  return instance;
};

const PlaintextDirectCastComposer = ({
  onInputFocus,
  onInputBlur,
  conversationId,
  conversationName,
  conversationParticipants,
  conversationCategory,
  conversationIsTokenGated,
  replyTo,
  onDismissReplyTo,
  onBeforeSend,
  onAfterSend,
  intentText,
}: PlaintextDirectCastComposerProps) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { trackEvent: eventingTrackEvent } = useTrackEvent();
  const toast = useRootToast();
  const { triggerImpactAsync } = useHaptics();

  const { setup: setupImagePreview, reset: resetImagePreview } =
    useDirectCastsImagePreview();
  const { setup: setupVideoPreview, reset: resetVideoPreview } =
    useDirectCastsVideoPreview();

  const [initialized, setInitialized] = React.useState<boolean>(false);
  const { getExistingDraft, saveDraft, discardDraft } = useDirectCastsDrafts();

  const currentUser = useCurrentUser_UNSAFE();
  const { sendDirectCast } = useDirectCasts();
  const conversationParticipantFids = conversationParticipants
    .filter((p) => p.fid !== currentUser.fid)
    .map((p) => p.fid);

  const [newDirectCastText, setNewDirectCastText] = React.useState<string>(
    // This will only be set on components first render. We are okay with that
    // since the intent is only used by a push notification navigate. If we introduce
    // other ways to insert some intents, we may likely need to re-think this and
    // probably mirror how we are handling drafts.
    intentText || '',
  );

  const [selection, setSelection] = React.useState<{
    start: number;
    end: number;
  }>();

  const pasteInputRef = React.useRef<PasteInputRef>(null);

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

    const tokenMentionInfo = getGenericAutocompleteMentionInfo(
      text,
      selection,
      '$',
      cashtagMentionRegexForAutocomplete,
    );
    if (tokenMentionInfo) {
      return { ...tokenMentionInfo, type: 'token' };
    }
  };

  const mentionInfo = useMemo(() => {
    const info = getAutocompleteMentionInfo(newDirectCastText, selection);
    return info;
  }, [selection, newDirectCastText]);

  const canSendDirectCast = React.useMemo(() => {
    return !!(
      newDirectCastText &&
      newDirectCastText.trim().length <= MAX_DIRECT_CAST_TEXT_LENGTH
    );
  }, [newDirectCastText]);

  const updateDraft = React.useCallback(
    ({ text }: { text: string }) => {
      if (text !== '') {
        saveDraft({ conversationId, text: text });
      } else {
        discardDraft({ conversationId });
      }
    },
    [conversationId, discardDraft, saveDraft],
  );

  const onBlur = React.useCallback(() => {
    onInputBlur();
  }, [onInputBlur]);

  const linkifyComposerLinkifyInstance = React.useMemo(() => {
    return getDirectCastsComposerInstance();
  }, []);

  const [shouldCheckMetadata, setShouldCheckMetadata] =
    React.useState<boolean>(false);

  const immediateSetOpenGraphLink = React.useCallback(
    (text: string) => {
      const matches = linkifyComposerLinkifyInstance.match(text.toLowerCase());

      if (matches && matches.length > 0) {
        const filteredMatches = matches.filter((m) => {
          return !m.text.startsWith('$');
        });

        setShouldCheckMetadata(filteredMatches.length !== 0);
      } else {
        setShouldCheckMetadata(false);
      }
    },
    [linkifyComposerLinkifyInstance],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetOpenGraphLink = React.useCallback(
    debounce((text: string) => immediateSetOpenGraphLink(text), 350, {
      leading: true,
    }),
    [],
  );

  const onChangeText = React.useCallback(
    (text: string) => {
      updateDraft({ text });

      setNewDirectCastText(text);

      debouncedSetOpenGraphLink(text);

      if (text.length > MAX_DIRECT_CAST_TEXT_LENGTH) {
        toast.hide('direct-cast-warn');
        toast.show(
          `Direct casts can't be more than ${MAX_DIRECT_CAST_TEXT_LENGTH} characters`,
          {
            id: 'direct-cast-warn',
          },
        );
      }
    },
    [debouncedSetOpenGraphLink, toast, updateDraft],
  );

  const onAssetFetched: AssetToImageUrlUpdateCallback = React.useCallback(
    async ({ message, metadata }) => {
      if (!message) {
        return;
      }

      triggerImpactAsync();

      const messageFinal = (message ?? '').trim();

      setNewDirectCastText('');

      discardDraft({ conversationId });

      const messageId = generateMessageId();

      const messageSenderContext = {
        displayName: currentUser.displayName,
        fid: currentUser.fid,
        pfp: currentUser.pfp,
        username: currentUser.username,
      };

      try {
        onDismissReplyTo();

        onBeforeSend?.();

        void sendDirectCast({
          data: {
            conversationId,
            conversationCategory: conversationCategory,
            fid: currentUser.fid,
            recipientFids: conversationParticipantFids,
            type: 'text',
            messageId: messageId,
            message: messageFinal,
            optimisticInReplyTo: replyTo,
            optimisticMetadata: metadata,
            senderContext: messageSenderContext,
          },
        });

        onAfterSend?.();

        if (conversationCategory === 'request') {
          eventingTrackEvent({
            name: 'accept direct cast request',
            props: {
              conversationId,
            },
          });
        }

        trackEvent(AnalyticsEvent.SendDirectCastWithImage, {
          participant_count: conversationParticipantFids.length,
        });
      } catch (error) {
        trackError(error);

        toast.show('Failed to send direct cast', { type: 'danger' });
      } finally {
        resetImagePreview();

        resetVideoPreview();
      }
    },
    [
      conversationCategory,
      conversationId,
      conversationParticipantFids,
      currentUser.displayName,
      currentUser.fid,
      currentUser.pfp,
      currentUser.username,
      discardDraft,
      eventingTrackEvent,
      onAfterSend,
      onBeforeSend,
      onDismissReplyTo,
      replyTo,
      resetImagePreview,
      resetVideoPreview,
      sendDirectCast,
      toast,
      trackEvent,
      triggerImpactAsync,
    ],
  );

  const focusOnInput = React.useCallback(() => {
    // We need to wait a tick otherwise the keyboard does not appear as the input is focused.
    // https://github.com/software-mansion/react-native-screens/issues/472#issuecomment-843122746
    setTimeout(() => pasteInputRef.current?.focus(), 50);
  }, []);

  const onClearSelectedAsset = React.useCallback(() => {
    // This used to clear the local asset cache but it was never
    // set. Since the callback is expected for the provider leaving
    // this as a no-op instead of changing the whole infra.
  }, []);

  const onAddImagePress = React.useCallback(async () => {
    if (pasteInputRef.current) {
      pasteInputRef.current.blur();
    }

    triggerImpactAsync();

    await requestMediaLibraryPermissions();

    let pickImageResult: ImagePicker.ImagePickerResult | undefined;
    try {
      pickImageResult = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        videoMaxDuration: 300,
        quality: 1,
      });
    } catch (e) {
      trackError(e);
      toast.show('Failed to pick image', { type: 'danger' });
      return;
    }

    if (pickImageResult.canceled) {
      return;
    }

    const { assets } = pickImageResult;
    const asset = assets ? assets[0] : undefined;

    if (!asset) {
      return;
    }

    if (asset.type === 'video') {
      setupVideoPreview({
        conversationName: conversationName,
        normalizedText: newDirectCastText,
        asset: asset,
        callback: onAssetFetched,
        resetAssetCallback: onClearSelectedAsset,
      });
    } else {
      Image.prefetch([asset.uri], {
        headers: imageRequestHeaders,
        cachePolicy: 'memory-disk',
      });

      setupImagePreview({
        conversationName: conversationName,
        normalizedText: newDirectCastText,
        asset: asset,
        callback: onAssetFetched,
        resetAssetCallback: onClearSelectedAsset,
      });
    }
  }, [
    conversationName,
    newDirectCastText,
    onClearSelectedAsset,
    onAssetFetched,
    setupImagePreview,
    setupVideoPreview,
    triggerImpactAsync,
    toast,
  ]);

  const clearableTextInputRef = React.useRef<ClearableTextInputRef>(null);

  const embedPreviewsRef =
    React.useRef<DirectCastComposerEmbedPreviewsInterface>(null);

  const [resolvedComposerMetadata, setResolvedComposerMetadata] =
    React.useState<ApiDirectCastMessageMetadata | undefined>(undefined);

  const [omitUrlPreview, setOmitUrlPreview] = React.useState(false);
  const [urlEmbedDisplayMode, setUrlEmbedDisplayMode] =
    React.useState<ApiDirectCastUrlEmbedDisplayMode>('compact');

  const onSendPress = useMemo(() => {
    const undebouncedOnSendPress = async () => {
      if (!newDirectCastText.trim()) {
        return;
      }

      const clearableTextInput = clearableTextInputRef.current;
      if (!clearableTextInput) {
        throw new Error('clearableTextInput should be set in onSendPress');
      }
      const textAfterReset = await clearableTextInput.getValueAndReset();
      const message = textAfterReset.trim();
      if (!message) {
        return;
      }

      triggerImpactAsync();

      discardDraft({ conversationId });

      const messageId = generateMessageId();

      const messageSenderContext = {
        displayName: currentUser.displayName,
        fid: currentUser.fid,
        pfp: currentUser.pfp,
        username: currentUser.username,
      };

      try {
        onDismissReplyTo();

        onBeforeSend?.();

        const directCastMetadata =
          typeof embedPreviewsRef.current !== 'undefined' &&
          embedPreviewsRef.current !== null
            ? embedPreviewsRef.current.getCurrentMessageMetadata()
            : undefined;

        // The server may re-parse URLs from the message text and rebuild
        // `metadata.urls`, ignoring whatever the client sent. To keep the
        // sender's chosen preview treatment (compact / large / text-only),
        // we persist the intent locally by messageId and the renderer
        // prefers the local value over the server-echoed metadata.
        const composerHasUrlEmbed =
          typeof resolvedComposerMetadata?.urls !== 'undefined' &&
          resolvedComposerMetadata.urls.length !== 0;

        if (composerHasUrlEmbed) {
          if (omitUrlPreview) {
            void persistDirectCastUrlEmbedHidden(messageId);
          } else {
            void persistDirectCastUrlEmbedDisplayMode(
              messageId,
              urlEmbedDisplayMode,
            );
          }
        }

        const directCastMessage = message;

        void sendDirectCast({
          data: {
            conversationId,
            conversationCategory: conversationCategory,
            fid: currentUser.fid,
            recipientFids: conversationParticipantFids,
            type: 'text',
            messageId: messageId,
            message: directCastMessage,
            optimisticInReplyTo: replyTo,
            optimisticMetadata: directCastMetadata,
            senderContext: messageSenderContext,
          },
        });

        onAfterSend?.();

        if (conversationCategory === 'request') {
          eventingTrackEvent({
            name: 'accept direct cast request',
            props: {
              conversationId,
            },
          });
        }

        trackEvent(AnalyticsEvent.CreateDirectCast, {
          participant_count: conversationParticipantFids.length,
          is_token_gated: conversationIsTokenGated,
        });
      } catch (error) {
        trackError(error);

        toast.show('Failed to send direct cast', { type: 'danger' });

        setNewDirectCastText(newDirectCastText);

        trackEvent(AnalyticsEvent.DirectCastFailedToSend, {});
        trackEvent(AnalyticsEvent.CreateDirectCastFailed, {});
      } finally {
        resetImagePreview();

        resetVideoPreview();
      }
    };

    return debounce(undebouncedOnSendPress, 500, {
      leading: true,
      trailing: false,
    });
  }, [
    conversationCategory,
    conversationId,
    conversationIsTokenGated,
    conversationParticipantFids,
    currentUser.displayName,
    currentUser.fid,
    currentUser.pfp,
    currentUser.username,
    discardDraft,
    eventingTrackEvent,
    newDirectCastText,
    omitUrlPreview,
    onAfterSend,
    onBeforeSend,
    onDismissReplyTo,
    replyTo,
    resetImagePreview,
    resetVideoPreview,
    resolvedComposerMetadata,
    sendDirectCast,
    toast,
    trackEvent,
    triggerImpactAsync,
    urlEmbedDisplayMode,
  ]);

  const onImagePasteOnComposer = React.useCallback(
    async ({ pastedImageFile }: { pastedImageFile: PastedFile }) => {
      trackEvent(AnalyticsEvent.MiscPastedFile, {
        source: 'PlaintextDirectCastComposer',
      });
      DdRum.addAction(
        RumActionType.CUSTOM,
        'PastedFile.PlaintextDirectCastComposer.onImagePasteOnComposer',
        {},
      );
      const { uri } = pastedImageFile;

      const dimensions = await manuallyFetchDimensions({ uri });

      Image.prefetch([uri], {
        headers: imageRequestHeaders,
        cachePolicy: 'memory-disk',
      });

      setupImagePreview({
        conversationName: conversationName,
        normalizedText: newDirectCastText,
        asset: {
          uri: uri,
          width: dimensions.width,
          height: dimensions.height,
        },
        callback: onAssetFetched,
        resetAssetCallback: onClearSelectedAsset,
      });
    },
    [
      conversationName,
      newDirectCastText,
      onClearSelectedAsset,
      onAssetFetched,
      setupImagePreview,
      trackEvent,
    ],
  );

  const [userMentionsForHighlights, setUserMentionsForHighlights] =
    React.useState<string[]>([]);

  React.useLayoutEffect(() => {
    const existingDraft = getExistingDraft({ conversationId });
    if (!initialized && typeof existingDraft !== 'undefined') {
      setNewDirectCastText(existingDraft);
    }
    setInitialized(true);
  }, [conversationId, getExistingDraft, initialized]);

  const onAutocompleteMention = React.useCallback(
    (user: ApiUser) => {
      if (mentionInfo?.type === 'user') {
        setNewDirectCastText(
          splice(
            newDirectCastText,
            mentionInfo.replace.start,
            mentionInfo.replace.end,
            user.username + ' ',
          ),
        );

        if (typeof user.username !== 'undefined') {
          const username = user.username;
          setUserMentionsForHighlights((prev) => [username, ...prev]);
        }

        focusOnInput();
      }
    },
    [focusOnInput, mentionInfo, newDirectCastText],
  );

  const urlPreviewAppliesToComposer = React.useMemo(() => {
    const m = resolvedComposerMetadata;
    if (typeof m === 'undefined') {
      return false;
    }
    if (typeof m.casts !== 'undefined' && m.casts.length !== 0) {
      return false;
    }
    if (typeof m.groupInvites !== 'undefined' && m.groupInvites.length !== 0) {
      return false;
    }
    return typeof m.urls !== 'undefined' && m.urls.length !== 0;
  }, [resolvedComposerMetadata]);

  React.useEffect(() => {
    if (!urlPreviewAppliesToComposer) {
      setOmitUrlPreview(false);
      setUrlEmbedDisplayMode('compact');
    }
  }, [urlPreviewAppliesToComposer]);

  const setTabBarTopBorderHidden = useSetTabBarTopBorderHidden();
  React.useEffect(() => {
    setTabBarTopBorderHidden(true);
    return () => {
      setTabBarTopBorderHidden(false);
    };
  }, [setTabBarTopBorderHidden]);

  return (
    <View style={[t.borderTHairline, t.borderFaint]}>
      {mentionInfo && mentionInfo.type === 'user' && (
        <UserMentionAutocomplete
          mentionText={mentionInfo?.text.toLowerCase()}
          prioritizeFids={conversationParticipantFids}
          prefillUsers={conversationParticipants.filter(
            (p) => p.fid !== currentUser.fid,
          )}
          onAutocompleteMention={onAutocompleteMention}
        />
      )}
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
        <Spacer horizontal size={4} />
        <View style={styleCenterButtonsWrapper}>
          <TouchableOpacity
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.opacity100,
              t.bgDefault,
              t.roundedFull,
              t.h8,
            ]}
            hitSlop={hitSlop}
            onPress={onAddImagePress}
            activeOpacity={0.75}
          >
            <Octicons name="plus" size={26} style={[t.texts.brand]} />
          </TouchableOpacity>
        </View>
        <Spacer horizontal size={4} />
        <View style={[t.flex1, t.flex, t.flexCol, t.roundedLg, t.flexGrow]}>
          <ScrollView
            style={[
              { maxHeight: inputMaxHeight },
              t.backgrounds.secondary,
              styleRoundedComposer,
            ]}
            scrollIndicatorInsets={{ top: 0, bottom: 0, right: 2 }}
            keyboardShouldPersistTaps="handled"
          >
            {shouldCheckMetadata && (
              <>
                <DirectCastsComposerEmbedPreviews
                  embedPreviewsRef={embedPreviewsRef}
                  message={newDirectCastText}
                  omitUrlPreview={omitUrlPreview}
                  urlEmbedDisplayMode={urlEmbedDisplayMode}
                  onResolvedMetadata={setResolvedComposerMetadata}
                />
                {urlPreviewAppliesToComposer && (
                  <View
                    style={[
                      t.flex,
                      t.flexRow,
                      t.flexWrap,
                      t.itemsCenter,
                      t.gap1,
                      t.pX3,
                      t.pB2,
                    ]}
                  >
                    {(
                      [
                        { id: 'compact', label: 'Compact' },
                        { id: 'large', label: 'Large' },
                        { id: 'off', label: 'Text only' },
                      ] as const
                    ).map((opt) => {
                      const isActive =
                        opt.id === 'off'
                          ? omitUrlPreview
                          : !omitUrlPreview && urlEmbedDisplayMode === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          onPress={() => {
                            if (opt.id === 'off') {
                              setOmitUrlPreview(true);
                            } else {
                              setOmitUrlPreview(false);
                              setUrlEmbedDisplayMode(opt.id);
                            }
                          }}
                          style={[
                            t.roundedFull,
                            t.pX2,
                            t.pY1,
                            t.border,
                            isActive ? t.bgActionSecondary : t.bgTransparent,
                            isActive
                              ? t.borderDesignSystemDefault
                              : t.borderTransparent,
                          ]}
                        >
                          <Text
                            style={[
                              t.textXs,
                              isActive ? t.fontSemibold : undefined,
                              isActive ? t.texts.primary : t.texts.secondary,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}
            {typeof replyTo !== 'undefined' &&
              typeof replyTo.senderContext !== 'undefined' && (
                <DirectCastReplyTo
                  directCastMessageId={replyTo.messageId}
                  directCastTimestamp={replyTo.serverTimestamp}
                  composerDismissReplyPress={onDismissReplyTo}
                  currentUserFid={currentUser.fid}
                  directCastMessage={replyTo.message}
                  directCastSender={replyTo.senderContext}
                  directCastMetadata={replyTo.metadata}
                  renderingInComposer={true}
                  renderingInSelfDirectCast={true}
                  renderingInOverlayBubble={false}
                  onPress={undefined}
                />
              )}
            <ClearableTextInput
              pasteInputRef={pasteInputRef}
              ref={clearableTextInputRef}
              placeholder="Write a message"
              containerStyle={[
                t.backgrounds.secondary,
                t.texts.primary,
                {
                  // for whatever reason, you have to explicitly set the paddingTop, rather than
                  // just general padding to take effect, also android has default padding that
                  // can't be removed without setting an explicit height, which we can't do here
                  // because of the multiline input
                  paddingTop: 4,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingBottom: Platform.OS === 'android' ? 4 : 8,
                  fontSize: directCastFontSize,
                },
              ]}
              value={newDirectCastText}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              onChangeText={onChangeText}
              onFocus={onInputFocus}
              onBlur={onBlur}
              onImagePaste={onImagePasteOnComposer}
              userMentions={userMentionsForHighlights}
              linkifyInstance={linkifyComposerLinkifyInstance}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
        <Spacer horizontal size={4} />
        <View style={styleCenterButtonsWrapper}>
          <TouchableOpacity
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              canSendDirectCast ? t.opacity100 : t.opacity50,
              t.bgAction,
              t.roundedFull,
              t.h8,
              t.w8,
              { height: 30, width: 30 },
            ]}
            hitSlop={hitSlop}
            onPress={onSendPress}
            disabled={!canSendDirectCast}
            activeOpacity={0.75}
          >
            <Octicons
              name="paper-airplane"
              size={16}
              style={[t.texts.light, { paddingLeft: 2 }]}
            />
          </TouchableOpacity>
        </View>
        <Spacer horizontal size={4} />
      </View>
    </View>
  );
};

PlaintextDirectCastComposer.displayName = 'PlaintextDirectCastComposer';

export { PlaintextDirectCastComposer };
