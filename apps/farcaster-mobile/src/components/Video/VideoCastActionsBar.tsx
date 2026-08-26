import { ApiCast } from 'farcaster-client-data';
import {
  CastClickType,
  CastReactionType,
  formatShorthandNumber,
  resolveUsername,
  UpdateCastLikeError,
  useCreateCastLike,
  useDeleteCastLike,
  useGloballyCachedCast,
  usePrefetchShareCast,
  usePrefetchThread,
  useTrackCastClick,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { Send } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleProp, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useToast } from 'react-native-toast-notifications';

import { HeartIcon } from '~/components/casts/CastActions/Likes';
import { RecastIcon } from '~/components/casts/CastActions/Recasts';
import { ReplyIcon } from '~/components/casts/CastActions/Replies';
import { Text2 } from '~/components/Text';
import { castQuotePromptKey } from '~/constants/Storage';
import { useCastToTakeAction } from '~/contexts/CastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { trackError } from '~/utils/ErrorUtils';

import { VideoCollect } from './VideoCollect';
import { VideoCommentsSheet } from './VideoCommentsSheet';
import { NUM_SUGGESTED_TARGETS, VideoShareSheet } from './VideoShareSheet';

type VideoCastActionsBarProps = {
  cast: ApiCast;
  faint?: boolean;
  style?: StyleProp<ViewStyle>;
  onPlayStateChangeRequest?: (playState: 'play' | 'pause') => void;
  onLike?: (handler: (allowUnlike?: boolean) => void) => void;
};

const VideoCastActionsBar = memo(
  ({
    cast: fallbackCast,
    faint,
    style,
    onPlayStateChangeRequest,
    onLike,
  }: VideoCastActionsBarProps) => {
    const cast = useGloballyCachedCast({ fallback: fallbackCast });
    const t = useTheme();
    const trackCastClick = useTrackCastClick();
    const trackCastReaction = useTrackCastReaction();
    const { showGlobalPrompt } = useGlobalPrompts();
    const [showCommentsSheet, setShowCommentsSheet] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const { setCastToTakeAction } = useCastToTakeAction();
    const toast = useToast();
    const { triggerImpactAsync } = useHaptics();
    const createCastLike = useCreateCastLike();
    const deleteCastLike = useDeleteCastLike();
    const prefetchThread = usePrefetchThread();
    const prefetchShareCast = usePrefetchShareCast();
    const {
      replies: { count: replyCount },
      reactions: { count: reactionCount },
      recasts: { count: recastCount },
    } = cast;

    const recasted = cast.viewerContext?.recast || false;
    const reacted = cast.viewerContext?.reacted || false;
    const showCollectible = !!cast.collectible;

    const heartScale = useSharedValue(1);

    const handleComment = useCallback(() => {
      if (cast.replyDisabled) {
        return;
      }

      triggerImpactAsync();

      if (cast.author.viewerContext?.blockedBy) {
        Alert.alert(
          'Unable to reply',
          `${resolveUsername({
            username: cast.author.username,
            fid: cast.author.fid,
          })} has blocked you. You cannot reply to their casts.`,
        );
        return;
      }

      trackCastClick({ type: CastClickType.Reply, feed: 'video' });
      setShowCommentsSheet(true);
    }, [cast, trackCastClick, triggerImpactAsync]);

    const handleRecast = useCallback(() => {
      if (cast.author.viewerContext?.blockedBy) {
        Alert.alert(
          'Unable to quote or recast',
          `${resolveUsername({
            username: cast.author.username,
            fid: cast.author.fid,
          })} has blocked you. You cannot quote or recast their casts.`,
        );
        return;
      }

      triggerImpactAsync();

      setCastToTakeAction({
        cast: {
          ...cast,
          reason: undefined,
        },
        inModalContext: true,
        feed: 'video',
      });

      showGlobalPrompt({ key: castQuotePromptKey });
    }, [cast, setCastToTakeAction, showGlobalPrompt, triggerImpactAsync]);

    const isUpdatingReactionRef = useRef<boolean>(undefined);
    const handleLike = useCallback(
      async (allowUnlike: boolean = true) => {
        if (
          (reacted && !allowUnlike) ||
          isUpdatingReactionRef.current === !reacted
        ) {
          return;
        }
        isUpdatingReactionRef.current = !reacted;

        if (!reacted) {
          triggerImpactAsync();

          // Trigger heartbeat animation when liking
          heartScale.value = withSequence(
            withSpring(1.2, {
              damping: 8,
              stiffness: 100,
            }),
            withSpring(0.9, {
              damping: 8,
              stiffness: 100,
            }),
            withSpring(1.1, {
              damping: 8,
              stiffness: 100,
            }),
            withSpring(1, {
              damping: 10,
              stiffness: 50,
            }),
          );
        }

        trackCastReaction({
          castHash: cast.hash,
          type: CastReactionType.Like,
          undo: !!reacted,
          castFid: cast.author.fid,
          feed: 'video',
        });

        try {
          if (reacted) {
            try {
              await deleteCastLike({ cast });
            } catch (error) {
              toast.show('Failed to unlike the cast.', {
                type: 'danger',
              });
              trackError(
                new UpdateCastLikeError({
                  error,
                  castHash: cast.hash,
                }),
              );
            }
          } else {
            try {
              await createCastLike({ cast });
            } catch (error) {
              toast.show('Failed to like the cast.', {
                type: 'danger',
              });
              trackError(
                new UpdateCastLikeError({
                  error,
                  castHash: cast.hash,
                }),
              );
            }
          }
        } finally {
          isUpdatingReactionRef.current = undefined;
        }
      },
      [
        cast,
        createCastLike,
        deleteCastLike,
        heartScale,
        reacted,
        toast,
        trackCastReaction,
        triggerImpactAsync,
      ],
    );

    React.useEffect(() => {
      onLike?.(handleLike);
    }, [onLike, handleLike]);

    const handleShare = useCallback(() => {
      triggerImpactAsync();

      setShowShareSheet(true);
    }, [setShowShareSheet, triggerImpactAsync]);

    const handleCommentsPrefetch = useCallback(() => {
      prefetchThread({
        castHash: cast.hash,
        shouldSkipIfRecentlyPrefetched: true,
        shouldAvoidUpdatingGlobalCache: false,
      });
    }, [cast.hash, prefetchThread]);

    const handleShareCastPrefetch = useCallback(() => {
      prefetchShareCast({
        castHash: cast.hash,
        context: 'video',
        maxTargets: NUM_SUGGESTED_TARGETS,
      });
    }, [cast.hash, prefetchShareCast]);

    const commentGesture = useMemo(
      () =>
        Gesture.Tap()
          .onStart(() => {
            'worklet';
            runOnJS(handleCommentsPrefetch)();
          })
          .onEnd(() => {
            'worklet';
            runOnJS(handleComment)();
          }),
      [handleCommentsPrefetch, handleComment],
    );

    const recastGesture = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          'worklet';
          runOnJS(handleRecast)();
        }),
      [handleRecast],
    );

    const likeGesture = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          'worklet';
          runOnJS(handleLike)();
        }),
      [handleLike],
    );

    const shareGesture = useMemo(
      () =>
        Gesture.Tap()
          .onStart(() => {
            'worklet';
            runOnJS(handleShareCastPrefetch)();
          })
          .onEnd(() => {
            'worklet';
            runOnJS(handleShare)();
          }),
      [handleShareCastPrefetch, handleShare],
    );

    const actionButtonStyle = useMemo(
      () => [t.flex, t.flexCol, t.itemsCenter, t.justifyCenter, { gap: 6 }],
      [t],
    );

    const heartAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartScale.value }],
    }));

    const handleVideoCommentsDismiss = useCallback(
      ({ navigatedAway }: { navigatedAway: boolean }) => {
        if (navigatedAway) {
          onPlayStateChangeRequest?.('pause');
        }
        setShowCommentsSheet(false);
      },
      [onPlayStateChangeRequest, setShowCommentsSheet],
    );

    const handleCollectPress = useCallback(() => {
      onPlayStateChangeRequest?.('pause');
    }, [onPlayStateChangeRequest]);

    return (
      <>
        <View style={[t.flex, t.flexCol, { gap: 20 }, style]}>
          <GestureDetector gesture={likeGesture}>
            <View style={actionButtonStyle}>
              <Animated.View style={heartAnimatedStyle}>
                <HeartIcon
                  size={24}
                  color={
                    reacted
                      ? t.colors.actionRed
                      : faint
                        ? t.colors.text.tertiary
                        : t.colors.text.light
                  }
                  active={reacted}
                />
              </Animated.View>
              <Text2 color="light" size="xs" weight="semibold">
                {formatShorthandNumber(reactionCount)}
              </Text2>
            </View>
          </GestureDetector>

          <GestureDetector gesture={recastGesture}>
            <View style={actionButtonStyle}>
              <RecastIcon
                size={24}
                active={recasted}
                color={
                  recasted
                    ? undefined
                    : faint
                      ? t.colors.text.tertiary
                      : t.colors.text.light
                }
              />
              <Text2 color="light" size="xs" weight="semibold">
                {formatShorthandNumber(recastCount)}
              </Text2>
            </View>
          </GestureDetector>

          <GestureDetector gesture={commentGesture}>
            <View style={actionButtonStyle}>
              <ReplyIcon
                size={24}
                color={faint ? t.colors.text.tertiary : t.colors.text.light}
              />
              <Text2 color="light" size="xs" weight="semibold">
                {formatShorthandNumber(replyCount)}
              </Text2>
            </View>
          </GestureDetector>

          {showCollectible && (
            <VideoCollect cast={cast} onPress={handleCollectPress} />
          )}

          <GestureDetector gesture={shareGesture}>
            <View style={actionButtonStyle}>
              <Send
                size={24}
                color={faint ? t.colors.text.tertiary : t.colors.text.light}
              />
              <Text2 color="light" size="xs" weight="semibold">
                Share
              </Text2>
            </View>
          </GestureDetector>
        </View>

        {showCommentsSheet && (
          <VideoCommentsSheet
            cast={cast}
            onDismiss={handleVideoCommentsDismiss}
          />
        )}
        {showShareSheet && (
          <VideoShareSheet
            cast={cast}
            onDismiss={() => setShowShareSheet(false)}
          />
        )}
      </>
    );
  },
);

VideoCastActionsBar.displayName = 'VideoCastActionsBar';

export { VideoCastActionsBar };
