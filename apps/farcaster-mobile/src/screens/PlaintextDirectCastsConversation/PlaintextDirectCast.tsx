import { Octicons } from '@expo/vector-icons';
import {
  ApiDirectCastMessageUserContext,
  ApiDirectCastMessageV3,
  ApiDirectCastUrlEmbedDisplayMode,
  ApiMediaV2,
  ApiUser,
  getCastURL,
  getDeprecatedCastURL,
} from 'farcaster-client-data';
import {
  determineEmbedRenders,
  resolveUsernameShort,
  useAddReactionToPlaintextDirectCast,
  useDirectCastConversation,
  useRemoveReactionFromPlaintextDirectCast,
} from 'farcaster-client-hooks';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  Keyframe,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text } from '~/components/Text';
import { directCastFontSize } from '~/constants/Cast';
import { linkifyWithMentionsMatch } from '~/constants/Regex';
import { directCastReactionPromptKey } from '~/constants/Storage';
import { useBlurOverlay } from '~/contexts/BlurOverlayProvider';
import { useDirectCastsAnimationsHistory } from '~/contexts/DirectCastsAnimationsHistoryProvider';
import { useDirectCastToTakeAction } from '~/contexts/DirectCastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useV3DirectCastMetadata } from '~/hooks/data/directCasts/useDirectCastMetadata';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useHaptics } from '~/hooks/useHaptics';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import {
  loadDirectCastUrlEmbedDisplayMode,
  loadDirectCastUrlEmbedHidden,
  persistDirectCastUrlEmbedHidden,
} from '~/utils/directCastUrlEmbedHiddenStorage';

import { DirectCastAvatar } from './DirectCastAvatar';
import { DirectCastContextMenu } from './DirectCastContextMenu';
import { DirectCastReactions } from './DirectCastReactions';
import { DirectCastRichAnnouncementCTA } from './DirectCastRichAnnouncementCTA';
import { DirectCastCastEmbeds } from './Embeds/DirectCastCastEmbeds';
import { DirectCastGroupInviteEmbeds } from './Embeds/DirectCastGroupInviteEmbeds';
import { DirectCastImageEmbed } from './Embeds/DirectCastImageEmbed';
import { DirectCastReplyTo } from './Embeds/DirectCastReplyTo';
import { DirectCastURLEmbeds } from './Embeds/DirectCastURLEmbeds';
import { DirectCastVideoEmbed } from './Embeds/DirectCastVideoEmbed';
import { SetReplyTo } from './PlaintextDirectCastsConversationScreen';
import { SwipeToReplyDirectCastWrapper } from './SwipeToReplyDirectCastWrapper';

const ANIMATE_IF_POSTED_SINCE = 60000;

// Forces an iOS UIScrollView's contentInset to zero. Used to
// defensively override any leaked native state that would otherwise
// allow scrolling into empty headroom above the visible content.
const NO_CONTENT_INSET = { top: 0, bottom: 0, left: 0, right: 0 };

type BubbleProps = {
  bubbleAnimatedViewKey: string;
  conversationId: string;
  conversationHasPinnedMessages: boolean;
  conversationIsGroup: boolean;
  conversationIsMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  viewerCanPinMessages: boolean;
  currentUserFid: number;
  innerRef?: React.RefObject<View | null>;
  position?: { x: number; y: number; width: number; height: number };
  directCast: ApiDirectCastMessageV3;
  directCastInReplyToSender: ApiDirectCastMessageUserContext | undefined;
  shouldCollapseAbove: boolean;
  shouldCollapseBelow: boolean;
  setReplyTo: SetReplyTo;
  scrollToReply: () => void;
  shouldHighlight: boolean;
  urlEmbedHiddenByViewer: boolean;
  onHideUrlPreviewForViewer: () => void;
  locallyChosenUrlEmbedDisplayMode:
    | ApiDirectCastUrlEmbedDisplayMode
    | undefined;
};

export type MessageInterface = {
  focus: () => void;
};

type PlaintextDirectCastProps = {
  conversationId: string;
  conversationHasPinnedMessages: boolean;
  conversationIsGroup: boolean;
  conversationIsMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  viewerCanPinMessages: boolean;
  currentUserFid: number;
  directCast: ApiDirectCastMessageV3;
  shouldCollapseAbove: boolean;
  shouldCollapseBelow: boolean;
  setReplyTo: SetReplyTo;
  scrollToReply: () => void;
  isMostRecent?: boolean;
  messageRef: React.Ref<MessageInterface>;
};

const Bubble: FC<BubbleProps> = ({
  bubbleAnimatedViewKey,
  conversationId,
  conversationHasPinnedMessages,
  conversationIsGroup,
  conversationIsMuted,
  conversationOtherPartyLastReadTime,
  viewerCanPinMessages,
  currentUserFid,
  innerRef,
  position,
  directCast,
  shouldCollapseAbove,
  shouldCollapseBelow,
  setReplyTo,
  scrollToReply,
  directCastInReplyToSender,
  shouldHighlight,
  urlEmbedHiddenByViewer,
  onHideUrlPreviewForViewer,
  locallyChosenUrlEmbedDisplayMode,
}) => {
  const t = useTheme();
  const { showGlobalPrompt } = useGlobalPrompts();
  const { senderFid, message, metadata, payload } = directCast;
  const isAdmin = useIsAdmin();

  const addReaction = useAddReactionToPlaintextDirectCast();
  const removeDirectCastReaction = useRemoveReactionFromPlaintextDirectCast();
  const { setDirectCastToTakeAction, recentReactions, addToRecentReactions } =
    useDirectCastToTakeAction();

  // Subscribe only to whether the viewer is an admin of this conversation --
  // the single field this cell reads -- so the per-message Bubble re-renders
  // when admin-ness changes rather than on every unrelated conversation update
  // (new message, unread-count, poll) that the full-object subscription saw.
  const { data: viewerIsConversationAdmin = false } = useDirectCastConversation(
    {
      conversationId,
      select: (conversation) => conversation?.viewerContext.access === 'admin',
    },
  );

  const canPinMessagesInConversation = React.useMemo(() => {
    return conversationIsGroup && viewerCanPinMessages && !directCast.isDeleted;
  }, [conversationIsGroup, viewerCanPinMessages, directCast.isDeleted]);

  const selfDirectCast = useMemo(() => {
    return senderFid === currentUserFid;
  }, [currentUserFid, senderFid]);

  const canDeleteMessage = React.useMemo(() => {
    if (conversationIsGroup) {
      return (
        (viewerIsConversationAdmin || selfDirectCast) && !directCast.isDeleted
      );
    }
    return selfDirectCast && !directCast.isDeleted;
  }, [
    conversationIsGroup,
    viewerIsConversationAdmin,
    directCast.isDeleted,
    selfDirectCast,
  ]);

  const { renderEmbedType: determinedEmbedType } = determineEmbedRenders({
    directCast,
  });

  const renderEmbedType =
    determinedEmbedType === 'url' && urlEmbedHiddenByViewer
      ? undefined
      : determinedEmbedType;

  const urlEmbedDisplayMode =
    locallyChosenUrlEmbedDisplayMode ??
    directCast.metadata?.urlEmbedDisplayMode;

  const groupInviteEmbeds = useMemo(() => {
    if (
      typeof metadata === 'undefined' ||
      typeof metadata.groupInvites === 'undefined'
    ) {
      return [];
    }

    return metadata.groupInvites;
  }, [metadata]);

  const castEmbeds = useMemo(() => {
    if (
      typeof metadata === 'undefined' ||
      typeof metadata.casts === 'undefined'
    ) {
      return [];
    }

    return metadata.casts;
  }, [metadata]);

  const urlEmbeds = React.useMemo(() => {
    if (
      typeof metadata === 'undefined' ||
      typeof metadata.urls === 'undefined'
    ) {
      return [];
    }

    return metadata.urls;
  }, [metadata]);

  const mediaEmbeds = useMemo(() => {
    if (
      typeof payload !== 'undefined' &&
      payload.type === 'rich_announcement' &&
      payload.payload.imageUrl
    ) {
      return [
        {
          version: '2',
          height: 600,
          width: 600,
          staticRaster: payload.payload.imageUrl,
        } satisfies ApiMediaV2,
      ];
    }

    if (
      typeof metadata === 'undefined' ||
      typeof metadata.medias === 'undefined'
    ) {
      return [];
    }

    return metadata.medias;
  }, [metadata, payload]);

  const videoEmbeds = useMemo(() => {
    if (
      typeof metadata === 'undefined' ||
      typeof metadata.videos === 'undefined'
    ) {
      return [];
    }

    return metadata.videos;
  }, [metadata]);

  const shouldNotRenderTheDirectCastBody = useMemo(() => {
    const trimmedMessage = message.trim();

    if (mediaEmbeds.length === 1) {
      const mediaEmbed = mediaEmbeds[0].staticRaster;
      return mediaEmbed === trimmedMessage;
    }

    if (videoEmbeds.length === 1) {
      const videoEmbed = videoEmbeds[0].sourceUrl;
      return videoEmbed === trimmedMessage;
    }

    return false;
  }, [videoEmbeds, mediaEmbeds, message]);

  const shouldShowUserDisplayName = useMemo(() => {
    return (
      conversationIsGroup &&
      !selfDirectCast &&
      ((!shouldCollapseAbove && shouldCollapseBelow) ||
        (!shouldCollapseAbove && !shouldCollapseBelow))
    );
  }, [
    conversationIsGroup,
    selfDirectCast,
    shouldCollapseAbove,
    shouldCollapseBelow,
  ]);

  const matches = useMemo(() => linkifyWithMentionsMatch(message), [message]);
  let mentions: string[];
  if (directCast.viewerContext?.isOptimistic) {
    mentions = matches?.filter((m) => m.schema === '@').map((m) => m.url) ?? [];
  } else {
    mentions = (directCast.mentions ?? [])
      .map((m) => m.user.username)
      .filter((username): username is string => username !== undefined);
  }

  const possiblyBodyContentTitleText = React.useMemo(() => {
    if (
      typeof payload === 'undefined' ||
      payload.type !== 'rich_announcement'
    ) {
      return undefined;
    }

    return payload.payload.title;
  }, [payload]);

  const cleanedUpText = React.useMemo(() => {
    if (
      mediaEmbeds.length !== 0 &&
      message.startsWith(mediaEmbeds[0].staticRaster)
    ) {
      return message.replace(mediaEmbeds[0].staticRaster, '').trimStart();
    }

    if (
      videoEmbeds.length !== 0 &&
      message.startsWith(videoEmbeds[0].sourceUrl)
    ) {
      return message.replace(videoEmbeds[0].sourceUrl, '').trimStart();
    }

    if (castEmbeds.length !== 0) {
      const cast = castEmbeds[0];
      const castURL = getCastURL({
        castUsername: cast.author.username,
        castHash: cast.hash,
      });
      if (message.startsWith(castURL)) {
        return message.replace(castURL, '').trimStart() || message;
      }
      const deprecatedCastURL = getDeprecatedCastURL({
        castUsername: cast.author.username,
        castHash: cast.hash,
      });
      if (message.startsWith(deprecatedCastURL)) {
        return message.replace(deprecatedCastURL, '').trimStart() || message;
      }
    }

    if (
      typeof payload !== 'undefined' &&
      payload.type === 'rich_announcement'
    ) {
      return payload.payload.body;
    }

    return message;
  }, [castEmbeds, mediaEmbeds, message, payload, videoEmbeds]);

  const { linkifiedText } = useLinkifyText({
    text: cleanedUpText,
    mentions,
    channelMentions: matches?.filter((m) => m.schema === '/').map((m) => m.url),
    options: {
      skipFarcasterLinkTruncate: false,
      skipURLTruncates: true,
      applyInvertedLinkStyles: selfDirectCast
        ? [t.directCasts.textLink, t.underline]
        : [t.directCasts.textLink, t.underline],
      treatImageUrlsAsLinks: !isAdmin,
    },
  });

  const { setBlurOverlayChildren } = useBlurOverlay();

  // Track touch start position when the bubble is in overlay mode so we
  // can distinguish a tap (dismiss overlay) from a scroll (leave open).
  const overlayTouchStartXRef = useRef(0);
  const overlayTouchStartYRef = useRef(0);

  const directCastMetadataToRender = useV3DirectCastMetadata({
    directCastIsPinned: directCast.isPinned,
    selfDirectCast: directCast.senderFid === currentUserFid,
    timestamp: directCast.serverTimestamp,
    conversationMuted: conversationIsMuted,
    conversationOtherPartyLastReadTime: conversationOtherPartyLastReadTime,
    wrappingContainerHasBRSpace: false,
  });

  const [usedEmojis, setUsedEmojis] = useState(
    new Set(directCast?.viewerContext?.reactions),
  );

  useEffect(() => {
    setUsedEmojis(new Set(directCast?.viewerContext?.reactions));
  }, [directCast?.viewerContext?.reactions]);

  const renderReaction = React.useCallback(
    (reaction: string) => {
      return (
        <TouchableOpacity
          style={[
            t.p2,
            t.roundedFull,
            usedEmojis.has(reaction) ? t.bgPillActive : t.bgTransparent,
          ]}
          key={`reaction-${directCast.messageId}-${reaction}`}
          onPress={() => {
            if (usedEmojis.has(reaction)) {
              removeDirectCastReaction({
                fid: currentUserFid,
                conversationId: directCast.conversationId,
                messageId: directCast.messageId,
                reaction,
              });
            } else {
              addToRecentReactions(reaction);

              addReaction({
                fid: currentUserFid,
                conversationId: directCast.conversationId,
                messageId: directCast.messageId,
                reaction,
              });
            }
            setBlurOverlayChildren();
          }}
        >
          <Text style={[t.textXl]}>{reaction}</Text>
        </TouchableOpacity>
      );
    },
    [
      addReaction,
      addToRecentReactions,
      currentUserFid,
      directCast.conversationId,
      directCast.messageId,
      setBlurOverlayChildren,
      t.p2,
      t.textXl,
      usedEmojis,
      removeDirectCastReaction,
      t.bgPillActive,
      t.bgTransparent,
      t.roundedFull,
    ],
  );

  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (position) {
      scale.value = withSpring(1.1, {
        damping: 10,
        stiffness: 200,
      });
    } else {
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 100,
      });
    }
  }, [position, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const renderingInOverlayBubble = useMemo(() => {
    return typeof position !== 'undefined';
  }, [position]);

  const senderUsername = useMemo(() => {
    return resolveUsernameShort({
      username: directCast.senderContext.username,
      fid: directCast.senderContext.fid,
    });
  }, [directCast.senderContext.fid, directCast.senderContext.username]);

  const isProUser = useUserLevel(directCast.senderContext as ApiUser) === 'pro';

  const bubbleMessage = useMemo(() => {
    return (
      <>
        {directCast.isDeleted ? (
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.p2, { gap: 4 }]}>
            <Octicons
              name="circle-slash"
              size={16}
              style={[selfDirectCast ? { color: '#C7D1DB' } : t.texts.tertiary]}
            />
            <Text
              style={[
                { fontSize: directCastFontSize },
                selfDirectCast ? { color: '#C7D1DB' } : t.texts.tertiary,
                t.italic,
              ]}
            >
              {linkifiedText}
            </Text>
          </View>
        ) : (
          <View style={[t.p2, { gap: 8 }]}>
            {typeof directCast.inReplyTo !== 'undefined' &&
              typeof directCastInReplyToSender !== 'undefined' && (
                <DirectCastReplyTo
                  currentUserFid={currentUserFid}
                  composerDismissReplyPress={undefined}
                  directCastMessageId={directCast.inReplyTo.messageId}
                  directCastMessage={directCast.inReplyTo.message}
                  directCastSender={directCastInReplyToSender}
                  directCastMetadata={directCast.inReplyTo.metadata}
                  directCastTimestamp={directCast.inReplyTo.serverTimestamp}
                  renderingInComposer={false}
                  renderingInOverlayBubble={renderingInOverlayBubble}
                  renderingInSelfDirectCast={
                    currentUserFid === directCast.senderFid
                  }
                  onPress={scrollToReply}
                />
              )}
            <View style={[t.relative, t.flex, t.flexRow, t.flexWrap]}>
              <Text
                style={[
                  [selfDirectCast ? t.texts.primary : t.texts.primary],
                  { alignSelf: 'flex-start' },
                  { fontSize: directCastFontSize },
                ]}
              >
                {typeof possiblyBodyContentTitleText !== 'undefined' && (
                  <Text style={[t.texts.primary, t.fontSemibold, t.textBase]}>
                    {`${possiblyBodyContentTitleText}\n\n`}
                  </Text>
                )}
                {linkifiedText}
                {!renderingInOverlayBubble && (
                  <View
                    style={[
                      t.mL1,
                      t.opacity0,
                      t._mT1, // Negative top margin is needed to avoid content looking off-center as we only hide it with opacity.
                      { alignSelf: 'flex-end' },
                    ]}
                  >
                    {directCastMetadataToRender}
                  </View>
                )}
              </Text>
              {!renderingInOverlayBubble && (
                <View style={[t.absolute, t.right0, { bottom: -1.25 }]}>
                  {directCastMetadataToRender}
                </View>
              )}
            </View>
          </View>
        )}
      </>
    );
  }, [
    currentUserFid,
    directCast.inReplyTo,
    directCast.isDeleted,
    directCast.senderFid,
    directCastInReplyToSender,
    directCastMetadataToRender,
    linkifiedText,
    possiblyBodyContentTitleText,
    renderingInOverlayBubble,
    scrollToReply,
    selfDirectCast,
    t._mT1,
    t.absolute,
    t.flex,
    t.flexRow,
    t.flexWrap,
    t.fontSemibold,
    t.italic,
    t.itemsCenter,
    t.mL1,
    t.opacity0,
    t.p2,
    t.relative,
    t.right0,
    t.textBase,
    t.texts.primary,
    t.texts.tertiary,
  ]);

  const onSwipeCallback = useCallback(() => {
    runOnJS(setReplyTo)({
      directCast,
      replyToSenderDisplayName: senderUsername,
    });
  }, [directCast, senderUsername, setReplyTo]);

  const embedRoundingStyles = React.useMemo(
    () =>
      shouldShowUserDisplayName
        ? [{ borderRadius: 8 }, t.roundedTNone]
        : [{ borderRadius: 8 }],
    [shouldShowUserDisplayName, t.roundedTNone],
  );

  const imageEmbedWithPositionHandling = useMemo(() => {
    return (
      <DirectCastImageEmbed
        medias={mediaEmbeds}
        directCastIsPinned={directCast.isPinned}
        selfDirectCast={directCast.senderFid === currentUserFid}
        timestamp={directCast.serverTimestamp}
        conversationIsMuted={conversationIsMuted}
        conversationOtherPartyLastReadTime={conversationOtherPartyLastReadTime}
        shouldRenderMetadata={shouldNotRenderTheDirectCastBody}
        embedRoundingStyles={embedRoundingStyles}
        shouldCapMaxHeight={renderingInOverlayBubble}
      />
    );
  }, [
    mediaEmbeds,
    directCast.isPinned,
    directCast.senderFid,
    directCast.serverTimestamp,
    currentUserFid,
    conversationIsMuted,
    conversationOtherPartyLastReadTime,
    shouldNotRenderTheDirectCastBody,
    embedRoundingStyles,
    renderingInOverlayBubble,
  ]);

  const backgroundColor = React.useMemo(() => {
    return selfDirectCast ? t.directCasts.bgSelf : t.directCasts.bg;
  }, [selfDirectCast, t.directCasts.bg, t.directCasts.bgSelf]);

  const highlightKeyframes = React.useMemo(() => {
    if (!shouldHighlight) {
      return undefined;
    }

    const BubbleHighlight = new Keyframe({
      0: backgroundColor,
      75: t.directCasts.bgHighlight,
      100: backgroundColor,
    }).duration(1_200);

    return BubbleHighlight;
  }, [backgroundColor, shouldHighlight, t.directCasts.bgHighlight]);

  const directCastBody = React.useMemo(() => {
    // Bubble children, used identically in both branches below. Extracted
    // so we don't duplicate the JSX between the overlay (ScrollView) and
    // regular (View) paths.
    const bubbleContent = (
      <>
        {shouldShowUserDisplayName && (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.p2,
              typeof renderEmbedType !== 'undefined' ? t.pB2 : t.pB0,
              { gap: 4 },
            ]}
          >
            <Text
              style={[t.fontSemibold, t.textSm, t.directCasts.textUsername]}
            >
              {senderUsername}
            </Text>
            {isProUser && <FarcasterProBadge size={18} />}
          </View>
        )}
        {renderEmbedType === 'group-invite' && (
          <DirectCastGroupInviteEmbeds groupInviteEmbeds={groupInviteEmbeds} />
        )}
        {renderEmbedType === 'cast' && (
          <DirectCastCastEmbeds
            castEmbeds={castEmbeds}
            selfDirectCast={directCast.senderFid === currentUserFid}
            embedRoundingStyles={embedRoundingStyles}
          />
        )}
        {renderEmbedType === 'url' && (
          <DirectCastURLEmbeds
            urlEmbeds={urlEmbeds}
            embedRoundingStyles={embedRoundingStyles}
            selfDirectCast={directCast.senderFid === currentUserFid}
            urlEmbedDisplayMode={urlEmbedDisplayMode}
          />
        )}
        {renderEmbedType === 'image' && imageEmbedWithPositionHandling}
        {renderEmbedType === 'video' && (
          <DirectCastVideoEmbed
            videos={videoEmbeds}
            directCastIsPinned={directCast.isPinned}
            selfDirectCast={directCast.senderFid === currentUserFid}
            timestamp={directCast.serverTimestamp}
            conversationIsMuted={conversationIsMuted}
            conversationOtherPartyLastReadTime={
              conversationOtherPartyLastReadTime
            }
            shouldRenderMetadata={shouldNotRenderTheDirectCastBody}
            embedRoundingStyles={embedRoundingStyles}
            shouldCapMaxHeight={renderingInOverlayBubble}
          />
        )}
        {!shouldNotRenderTheDirectCastBody && bubbleMessage}
        {typeof payload !== 'undefined' &&
          payload.type === 'rich_announcement' && (
            <DirectCastRichAnnouncementCTA payload={payload.payload} />
          )}
      </>
    );

    return (
      <Animated.View
        ref={innerRef}
        collapsable={false}
        key={bubbleAnimatedViewKey}
        entering={highlightKeyframes}
        style={[
          animatedStyle,
          { borderRadius: 8 },
          backgroundColor,
          t.flexShrink,
          t.justifyBetween,
          { marginBottom: 2 },
          !renderingInOverlayBubble && {
            minWidth: '25%',
            maxWidth: '105%',
          },
        ]}
      >
        {renderingInOverlayBubble ? (
          // Long-press preview intentionally caps height at 340 and needs
          // to scroll long messages within the popup.
          //
          // - `contentInset={NO_CONTENT_INSET}` defensively overrides any
          //   leaked native UIScrollView state so empty scrollable
          //   headroom can't appear above the bubble content (same
          //   pattern as the cast detail FlatList in #9916).
          // - `alwaysBounceVertical={false}` so a short message that
          //   already fits in 340px doesn't get iOS's rubber-band
          //   pull-anywhere bounce — that bounce shows a scroll
          //   indicator and a brief drag, which feels like the bubble
          //   is scrolling when it isn't. Long messages still bounce
          //   at content edges normally because contentSize > layout.
          <ScrollView
            style={[t.flex, { maxHeight: 340 }]}
            contentInset={NO_CONTENT_INSET}
            alwaysBounceVertical={false}
            showsVerticalScrollIndicator={false}
          >
            {bubbleContent}
          </ScrollView>
        ) : (
          // Plain View — no scrollable surface, so the bubble cannot be
          // dragged into a non-zero contentOffset by any path (Pressable
          // child drags, programmatic scrollTo, iOS auto-scroll-to-input).
          // If the bubble's parent is ever wrongly height-clamped, content
          // overflows visibly instead of being silently offset mid-content.
          <View style={[t.flex]}>{bubbleContent}</View>
        )}
      </Animated.View>
    );
  }, [
    innerRef,
    bubbleAnimatedViewKey,
    highlightKeyframes,
    animatedStyle,
    t.flexShrink,
    t.justifyBetween,
    t.flex,
    t.flexRow,
    t.itemsCenter,
    t.fontSemibold,
    t.textSm,
    t.directCasts.textUsername,
    t.p2,
    t.pB2,
    t.pB0,
    backgroundColor,
    renderingInOverlayBubble,
    shouldShowUserDisplayName,
    renderEmbedType,
    senderUsername,
    isProUser,
    groupInviteEmbeds,
    castEmbeds,
    directCast.senderFid,
    directCast.isPinned,
    directCast.serverTimestamp,
    currentUserFid,
    embedRoundingStyles,
    urlEmbeds,
    urlEmbedDisplayMode,
    imageEmbedWithPositionHandling,
    videoEmbeds,
    conversationIsMuted,
    conversationOtherPartyLastReadTime,
    shouldNotRenderTheDirectCastBody,
    bubbleMessage,
    payload,
  ]);

  const renderDirectCast = useMemo(() => {
    const core = <React.Fragment>{directCastBody}</React.Fragment>;

    const disabled = directCast.isDeleted || renderingInOverlayBubble;

    const allowPointerEventsButDisableSwipe =
      typeof directCast.payload !== 'undefined' &&
      directCast.payload.type === 'rich_announcement';

    if (disabled) {
      // Deleted messages: block all interactions.
      // Overlay (long-press preview): block at this view so swipe-to-reply
      // doesn't fire here, but allow descendants to receive touches so the
      // inner ScrollView can still be scrolled when a long message
      // overflows the overlay's `maxHeight: 340` cap. We also detect taps
      // at this level (regardless of which inner element claimed the
      // touch) so taps anywhere on the bubble — including on an embed's
      // inner Pressable — dismiss the overlay. RN's onTouch* events
      // bubble through the React tree even when a child has the
      // responder, so this fires for embed-tap, plain-area-tap, and
      // scroll-end alike. We distinguish tap from scroll by movement
      // delta — large delta means the user was scrolling, leave the
      // overlay open.
      return (
        <View
          style={[t.flex, selfDirectCast ? t.flexRowReverse : t.flexRow]}
          pointerEvents={directCast.isDeleted ? 'none' : 'box-none'}
          onTouchStart={
            directCast.isDeleted
              ? undefined
              : (e) => {
                  overlayTouchStartXRef.current = e.nativeEvent.pageX;
                  overlayTouchStartYRef.current = e.nativeEvent.pageY;
                }
          }
          onTouchEnd={
            directCast.isDeleted
              ? undefined
              : (e) => {
                  const dx = Math.abs(
                    e.nativeEvent.pageX - overlayTouchStartXRef.current,
                  );
                  const dy = Math.abs(
                    e.nativeEvent.pageY - overlayTouchStartYRef.current,
                  );
                  if (dx < 10 && dy < 10) {
                    setBlurOverlayChildren();
                  }
                }
          }
        >
          {core}
        </View>
      );
    }

    return (
      <View style={[t.flex, selfDirectCast ? t.flexRowReverse : t.flexRow]}>
        <SwipeToReplyDirectCastWrapper
          placedAtTheEndOfRow={selfDirectCast}
          onSwipeCallback={onSwipeCallback}
          disabled={allowPointerEventsButDisableSwipe}
        >
          {core}
        </SwipeToReplyDirectCastWrapper>
      </View>
    );
  }, [
    directCast.isDeleted,
    directCast.payload,
    directCastBody,
    onSwipeCallback,
    renderingInOverlayBubble,
    selfDirectCast,
    setBlurOverlayChildren,
    t.flex,
    t.flexRow,
    t.flexRowReverse,
  ]);

  const { width: windowWidth } = useWindowDimensions();

  const wrapperStyle = React.useMemo(() => {
    if (typeof position !== 'undefined') {
      return [
        t.flex,
        t.flexCol,
        {
          maxWidth: '65%',
          gap: 24,
          position: 'absolute',
          top: Math.max(position.y - 80, 128),
          right: selfDirectCast ? 24 : undefined,
          left: selfDirectCast ? undefined : 24,
        },
      ];
    }

    const margin = windowWidth / 6;

    return [
      t.flex1,
      t.flexCol,
      selfDirectCast ? { marginLeft: margin } : { marginRight: margin },
    ];
  }, [position, selfDirectCast, t.flex, t.flex1, t.flexCol, windowWidth]);

  return (
    <View style={wrapperStyle}>
      {renderingInOverlayBubble && (
        <View
          style={[
            selfDirectCast ? t.selfEnd : t.selfStart,
            t.dark ? t.bgDefault : t.bgDefault,
            t.flex,
            t.flexRow,
            t.roundedFull,
          ]}
        >
          {recentReactions.map(renderReaction)}
          <TouchableOpacity
            style={[
              t.pB1,
              t.mY1,
              t.mR1,
              t.w8,
              t.roundedFull,
              t.dark ? t.bgDefault : t.bgDefault,
            ]}
            onPress={() => {
              setDirectCastToTakeAction(directCast);
              showGlobalPrompt({ key: directCastReactionPromptKey });
            }}
          >
            <Text style={[t.text2xl, t.textCenter, t.texts.secondary]}>+</Text>
          </TouchableOpacity>
        </View>
      )}
      <View
        style={[t.wFull, t.flex, selfDirectCast ? t.flexRowReverse : t.flexRow]}
      >
        {/*
          Plain View — was previously a Pressable with no press handlers.
          Pressable always installs touch-claiming behavior (to detect
          taps), and on iOS that competes with the inner ScrollView's pan
          recognizer for vertical drag, so the long-press-overlay's
          scroll never worked even with `pointerEvents="box-none"` on the
          disabled wrapper above. View has no touch-claiming behavior, so
          the inner ScrollView gets drags freely.
        */}
        <View
          style={[
            t.flex,
            t.flexCol,
            renderingInOverlayBubble &&
              typeof position !== 'undefined' && [
                {
                  marginLeft: 12,
                  marginRight: 12,
                  width: position.width,
                },
              ],
          ]}
        >
          {renderDirectCast}
          {!renderingInOverlayBubble && (
            <DirectCastReactions
              currentUserFid={currentUserFid}
              directCast={directCast}
            />
          )}
        </View>
      </View>
      {renderingInOverlayBubble && (
        <View
          style={[
            selfDirectCast ? t.selfEnd : t.selfStart,
            t.dark ? t.bgDefault : t.bgDefault,
            t.roundedLg,
          ]}
        >
          <DirectCastContextMenu
            currentUserFid={currentUserFid}
            directCast={directCast}
            directCastDisplayName={senderUsername}
            conversationId={conversationId}
            conversationHasPinnedMessages={conversationHasPinnedMessages}
            viewerCanPinMessages={canPinMessagesInConversation}
            viewerCanDeleteMessage={canDeleteMessage}
            setReplyTo={setReplyTo}
            onMenuItemClick={setBlurOverlayChildren}
            hideUrlPreviewForViewer={
              determinedEmbedType === 'url' && !urlEmbedHiddenByViewer
                ? onHideUrlPreviewForViewer
                : undefined
            }
          />
        </View>
      )}
    </View>
  );
};

Bubble.displayName = 'DirectCastBubble';

const PlaintextDirectCast: FC<PlaintextDirectCastProps> = ({
  conversationId,
  conversationHasPinnedMessages,
  conversationIsGroup,
  conversationIsMuted,
  conversationOtherPartyLastReadTime,
  viewerCanPinMessages,
  currentUserFid,
  directCast,
  shouldCollapseAbove,
  shouldCollapseBelow,
  setReplyTo,
  scrollToReply,
  messageRef,
  isMostRecent = false,
}) => {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  const bubbleRef = useRef<View>(null);

  const pushToUserProfile = usePushToUserProfile();

  const { senderFid } = directCast;

  const { setBlurOverlayChildren } = useBlurOverlay();

  const { renderEmbedType: baseEmbedForUrl } = determineEmbedRenders({
    directCast,
  });

  const [urlEmbedHiddenByViewer, setUrlEmbedHiddenByViewer] = useState(false);
  const [
    locallyChosenUrlEmbedDisplayMode,
    setLocallyChosenUrlEmbedDisplayMode,
  ] = useState<ApiDirectCastUrlEmbedDisplayMode | undefined>(undefined);

  // Load both per-message view preferences in a single effect so the two
  // AsyncStorage reads resolve together and their state updates batch into one
  // render of the freshly-mounted (or recycled) cell instead of two. The sets
  // stay unconditional so a recycled cell correctly resets to the new
  // message's stored values rather than retaining the previous message's.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadDirectCastUrlEmbedHidden(directCast.messageId),
      loadDirectCastUrlEmbedDisplayMode(directCast.messageId),
    ]).then(([hidden, mode]) => {
      if (cancelled) {
        return;
      }
      setUrlEmbedHiddenByViewer(hidden);
      setLocallyChosenUrlEmbedDisplayMode(mode);
    });
    return () => {
      cancelled = true;
    };
  }, [directCast.messageId]);

  const hideUrlPreviewForViewer = useCallback(() => {
    if (baseEmbedForUrl !== 'url' || urlEmbedHiddenByViewer) {
      return;
    }
    void persistDirectCastUrlEmbedHidden(directCast.messageId);
    setUrlEmbedHiddenByViewer(true);
  }, [baseEmbedForUrl, directCast.messageId, urlEmbedHiddenByViewer]);

  const groupConversation = useMemo(() => {
    return conversationIsGroup;
  }, [conversationIsGroup]);

  const selfDirectCast = useMemo(() => {
    return senderFid === currentUserFid;
  }, [currentUserFid, senderFid]);

  const shouldShowUserAvatar = useMemo(() => {
    return (
      groupConversation &&
      !selfDirectCast &&
      ((shouldCollapseAbove && !shouldCollapseBelow) ||
        (!shouldCollapseAbove && !shouldCollapseBelow))
    );
  }, [
    groupConversation,
    selfDirectCast,
    shouldCollapseAbove,
    shouldCollapseBelow,
  ]);

  const directCastInReplyToSender = useMemo(() => {
    if (typeof directCast.inReplyTo === 'undefined') {
      return undefined;
    }

    return directCast.inReplyTo.senderContext;
  }, [directCast.inReplyTo]);

  const cloneAndSetMessage = React.useCallback(() => {
    if (directCast.isDeleted) {
      return;
    }

    triggerImpactAsync();

    const refToUse = bubbleRef.current;

    const showOverlay = (
      measuredWidth: number,
      measuredHeight: number,
      pageX: number,
      pageY: number,
    ) => {
      const windowHeight = Dimensions.get('window').height;
      const windowWidth = Dimensions.get('window').width;

      // Use fallback values if measure() returned zeros (common on Android)
      const width = measuredWidth > 0 ? measuredWidth : windowWidth * 0.65;
      const height = measuredHeight > 0 ? measuredHeight : 100;
      const px = pageX > 0 ? pageX : selfDirectCast ? windowWidth * 0.35 : 8;
      const py = pageY > 0 ? pageY : windowHeight / 2 - 100;

      const messageHeight = height > 300 ? 360 : height;
      let calcY = py + (height > 300 ? height - 360 : 0);

      if (calcY + messageHeight + 200 > windowHeight || calcY < 50) {
        calcY = windowHeight / 2 - 100;
      }

      setBlurOverlayChildren(
        <Bubble
          bubbleAnimatedViewKey={directCast.messageId}
          position={{ x: px, y: calcY, width, height }}
          conversationId={conversationId}
          conversationHasPinnedMessages={conversationHasPinnedMessages}
          conversationIsGroup={conversationIsGroup}
          conversationIsMuted={conversationIsMuted}
          conversationOtherPartyLastReadTime={
            conversationOtherPartyLastReadTime
          }
          viewerCanPinMessages={viewerCanPinMessages}
          currentUserFid={currentUserFid}
          directCast={directCast}
          shouldCollapseAbove={shouldCollapseAbove}
          shouldCollapseBelow={shouldCollapseBelow}
          setReplyTo={setReplyTo}
          directCastInReplyToSender={directCastInReplyToSender}
          scrollToReply={scrollToReply}
          shouldHighlight={false}
          urlEmbedHiddenByViewer={urlEmbedHiddenByViewer}
          onHideUrlPreviewForViewer={hideUrlPreviewForViewer}
          locallyChosenUrlEmbedDisplayMode={locallyChosenUrlEmbedDisplayMode}
        />,
      );
    };

    if (refToUse) {
      refToUse.measure((_fx, _fy, width, height, px, py) => {
        showOverlay(width, height, px, py);
      });
    } else {
      // Fallback if ref is not available (e.g. Android view flattening)
      showOverlay(0, 0, 0, 0);
    }
  }, [
    conversationHasPinnedMessages,
    conversationId,
    conversationIsGroup,
    conversationIsMuted,
    conversationOtherPartyLastReadTime,
    currentUserFid,
    directCast,
    directCastInReplyToSender,
    scrollToReply,
    selfDirectCast,
    setBlurOverlayChildren,
    setReplyTo,
    shouldCollapseAbove,
    shouldCollapseBelow,
    viewerCanPinMessages,
    triggerImpactAsync,
    hideUrlPreviewForViewer,
    urlEmbedHiddenByViewer,
    locallyChosenUrlEmbedDisplayMode,
  ]);

  const focusOnMessageAndBlurEverythingElse = React.useCallback(() => {
    Keyboard.dismiss();

    cloneAndSetMessage();
  }, [cloneAndSetMessage]);

  React.useImperativeHandle(messageRef, () => {
    return {
      focus: focusOnMessageAndBlurEverythingElse,
    };
  });

  const wasPostedRecently = useMemo(() => {
    const timeSinceCreated =
      Date.now() - new Date(directCast.serverTimestamp).getTime();
    return timeSinceCreated < ANIMATE_IF_POSTED_SINCE;
  }, [directCast]);

  const {
    animatedMessages,
    updateAnimatedMessages,
    highlightedMessage,
    highlightedMessageViewKey,
  } = useDirectCastsAnimationsHistory();

  const shouldHighlight = React.useMemo(() => {
    return directCast.messageId === highlightedMessage;
  }, [directCast.messageId, highlightedMessage]);

  const bubbleAnimatedViewKey = React.useMemo(() => {
    return shouldHighlight && typeof highlightedMessageViewKey !== 'undefined'
      ? highlightedMessageViewKey
      : directCast.messageId;
  }, [directCast.messageId, highlightedMessageViewKey, shouldHighlight]);

  const shouldAnimateIn = useMemo(() => {
    return (
      wasPostedRecently &&
      isMostRecent &&
      !animatedMessages.has(directCast.messageId)
    );
  }, [animatedMessages, directCast.messageId, isMostRecent, wasPostedRecently]);

  React.useEffect(() => {
    if (shouldAnimateIn && !animatedMessages.has(directCast.messageId)) {
      // Update calls are going to be delayed with a timeout so
      // it should still allow smooth animations.
      runOnJS(updateAnimatedMessages)({ messageId: directCast.messageId });
    }
  }, [
    animatedMessages,
    directCast.messageId,
    shouldAnimateIn,
    updateAnimatedMessages,
  ]);

  const navigateToUserProfile = React.useCallback(() => {
    pushToUserProfile({ fid: senderFid });
  }, [pushToUserProfile, senderFid]);

  const directCastReactionsBottomPadding = React.useMemo(() => {
    return directCast.reactions.length !== 0
      ? { paddingBottom: 32 }
      : { paddingBottom: 6 };
  }, [directCast.reactions.length]);

  const viewEnteringAnimation = React.useMemo(() => {
    if (shouldAnimateIn) {
      return FadeInDown;
    }

    return undefined;
  }, [shouldAnimateIn]);

  return (
    <Animated.View
      key={directCast.messageId}
      entering={viewEnteringAnimation}
      style={[
        t.wFull,
        t.pX2,
        selfDirectCast ? t.itemsEnd : t.itemsStart,
        t.flex,
        t.flexCol,
        shouldCollapseBelow ? [{ paddingBottom: 2 }] : [t.mB2],
      ]}
    >
      <View
        style={[
          t.flex,
          !selfDirectCast && groupConversation ? [t.flexRow] : [t.flexCol],
          !selfDirectCast &&
            groupConversation &&
            !shouldShowUserAvatar && [t.pL8],
          t.flexGrow,
          t.flexShrink,
          t.wFull,
          selfDirectCast ? t.itemsEnd : t.itemsStart,
        ]}
      >
        {shouldShowUserAvatar && (
          <Pressable
            onPress={navigateToUserProfile}
            style={[
              t.w8,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.selfEnd,
              directCastReactionsBottomPadding,
            ]}
          >
            {/* @ts-expect-error FIXME: The context is not the full ApiUser prop */}
            <DirectCastAvatar user={directCast.senderContext} />
          </Pressable>
        )}
        <Bubble
          bubbleAnimatedViewKey={bubbleAnimatedViewKey}
          conversationId={conversationId}
          conversationHasPinnedMessages={conversationHasPinnedMessages}
          conversationIsGroup={conversationIsGroup}
          conversationIsMuted={conversationIsMuted}
          conversationOtherPartyLastReadTime={
            conversationOtherPartyLastReadTime
          }
          viewerCanPinMessages={viewerCanPinMessages}
          currentUserFid={currentUserFid}
          innerRef={bubbleRef}
          directCast={directCast}
          shouldCollapseAbove={shouldCollapseAbove}
          shouldCollapseBelow={shouldCollapseBelow}
          setReplyTo={setReplyTo}
          directCastInReplyToSender={directCastInReplyToSender}
          scrollToReply={scrollToReply}
          shouldHighlight={shouldHighlight}
          urlEmbedHiddenByViewer={urlEmbedHiddenByViewer}
          onHideUrlPreviewForViewer={hideUrlPreviewForViewer}
          locallyChosenUrlEmbedDisplayMode={locallyChosenUrlEmbedDisplayMode}
        />
      </View>
    </Animated.View>
  );
};

PlaintextDirectCast.displayName = 'PlaintextDirectCast';

export { PlaintextDirectCast };
