import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import {
  resolveUsername,
  resolveUsernameShort,
  UnableToFollowUserError,
  useCreateFollow,
  useDeleteFollow,
  useGloballyCachedCast,
  useGloballyCachedUser,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  TextLayoutEventData,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Avatar } from '~/components/Avatar';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useHaptics } from '~/hooks/useHaptics';
import { trackError } from '~/utils/ErrorUtils';

const VideoCastDetails = React.memo(
  ({
    cast: fallbackCast,
    style,
    onPlayStateChangeRequest,
  }: {
    cast: ApiCast;
    style?: StyleProp<ViewStyle>;
    onPlayStateChangeRequest?: (playState: 'play' | 'pause') => void;
  }) => {
    const t = useTheme();
    const cast = useGloballyCachedCast({ fallback: fallbackCast });
    const author = useGloballyCachedUser({ fallback: cast.author });
    const { trackEvent: trackAnalyticsEvent } = useAnalytics();
    const { trackEvent: trackSharedEvent } = useTrackEvent();
    const createFollow = useCreateFollow();
    const deleteFollow = useDeleteFollow();
    const { triggerImpactAsync } = useHaptics();
    const toast = useRootToast();
    const isProUser = useUserLevel(author) === 'pro';
    const isViewerFollowing = author.viewerContext?.following;
    const currentUser = useCurrentUser_UNSAFE();
    const currentUserIsAuthor = currentUser.fid === author.fid;
    const [isTruncated, setIsTruncated] = useState(false);
    // Whether a caption overflows one line is a fixed property of the text, so
    // measure it once and freeze the result. Re-deciding on every layout pass
    // makes the hidden measuring text and the conditional "Show more" line feed
    // back into each other; for captions that land on the one-line wrap
    // boundary this oscillates, and because the whole overlay is anchored by
    // its bottom edge the username/Follow row visibly vibrates. The guard is
    // keyed to the text itself (not a boolean) so a recycled/edited cast is
    // re-measured on its next onTextLayout without any effect-ordering race.
    const measuredTextRef = useRef<string | null>(null);

    const usernameToDisplay = useMemo(
      () =>
        resolveUsernameShort({
          username: author.username,
          fid: author.fid,
        }),
      [author.fid, author.username],
    );

    const pushToUserProfile = usePushToUserProfile();
    const handleProfileTap = useCallback(() => {
      onPlayStateChangeRequest?.('pause');
      pushToUserProfile({ fid: author.fid });
    }, [pushToUserProfile, author.fid, onPlayStateChangeRequest]);

    const profileTap = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          'worklet';
          runOnJS(handleProfileTap)();
        }),
      [handleProfileTap],
    );

    const handleFollowTap = useCallback(async () => {
      triggerImpactAsync();

      try {
        trackSharedEvent(AnalyticsEvent.AccountFollow, {
          target: author.fid,
          on: 'avatar',
          ...(cast.channel?.key ? { castChannel: cast.channel.key } : {}),
          castHash: cast.hash,
        });

        await createFollow({ followee: author, follower: currentUser });

        const followeeUsername = resolveUsername({
          username: author.username,
          fid: author.fid,
        });

        toast.hideAll();
        toast.show(
          <>
            Followed {followeeUsername}.{' '}
            <Text2 weight="semibold" color="light" size="xs">
              Undo
            </Text2>
          </>,
          {
            type: 'generic',
            duration: 3000,
            placement: 'top',
            data: {
              onClick: async () => {
                trackSharedEvent(AnalyticsEvent.AccountUnfollow, {
                  target: author.fid,
                  on: 'avatar',
                });

                try {
                  await deleteFollow({
                    followee: author,
                    follower: currentUser,
                  });

                  toast.hideAll();
                  toast.show(`Unfollowed ${followeeUsername}`, {
                    type: 'generic',
                    placement: 'top',
                  });
                } catch (error) {
                  toast.show('Unable to unfollow user', {
                    type: 'danger',
                    placement: 'top',
                  });
                }
              },
            },
          },
        );
      } catch (error) {
        toast.show('Unable to follow user', {
          type: 'danger',
          placement: 'top',
        });
        trackError(
          new UnableToFollowUserError({
            followerFid: currentUser.fid,
            followeeFid: author.fid,
            follow: true,
            error,
          }),
        );
      }
    }, [
      author,
      cast.channel?.key,
      cast.hash,
      createFollow,
      currentUser,
      deleteFollow,
      trackSharedEvent,
      triggerImpactAsync,
      toast,
    ]);

    const followTap = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          'worklet';
          runOnJS(handleFollowTap)();
        }),
      [handleFollowTap],
    );

    const push = usePush();
    const { hash } = cast;
    const handleTextTap = useCallback(() => {
      onPlayStateChangeRequest?.('pause');
      trackAnalyticsEvent(AnalyticsEvent.VideoFeedCastBodyShowMore);
      push('Cast', { castHash: hash });
    }, [push, hash, trackAnalyticsEvent, onPlayStateChangeRequest]);

    const textTap = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          'worklet';
          runOnJS(handleTextTap)();
        }),
      [handleTextTap],
    );

    const handleFullTextLayout = useCallback(
      (e: NativeSyntheticEvent<TextLayoutEventData>) => {
        // Already measured this exact caption — keep the frozen decision.
        if (measuredTextRef.current === cast.text) {
          return;
        }
        measuredTextRef.current = cast.text;
        setIsTruncated(e.nativeEvent.lines.length > 1);
      },
      [cast.text],
    );

    return (
      <View style={[t.flex, t.flexCol, { gap: 12, maxWidth: '80%' }, style]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <GestureDetector gesture={profileTap}>
            <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <Avatar
                diameter={40}
                pfpUrl={author.pfp?.url}
                isHighlighted={false}
                blockAnimated
              />

              <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 1 }]}>
                <Text2 weight="semibold" color="light">
                  {usernameToDisplay}
                </Text2>
                {isProUser && <FarcasterProBadge size={18} />}
              </View>
            </View>
          </GestureDetector>
          {!isViewerFollowing && !currentUserIsAuthor && (
            <GestureDetector gesture={followTap}>
              <View
                style={[
                  t.pX2,
                  t.pY1,
                  t.roundedLg,
                  { borderColor: t.colors.text.light, borderWidth: 1 },
                ]}
              >
                <Text2 weight="semibold" color="light" size="xs">
                  Follow
                </Text2>
              </View>
            </GestureDetector>
          )}
        </View>
        <GestureDetector gesture={textTap}>
          <View
            collapsable={false}
            style={[{ position: 'relative' }, t.flex, t.flexCol, { gap: 2 }]}
          >
            <Text2 weight="medium" color="light" size="sm" numberOfLines={1}>
              {cast.text}
            </Text2>
            {isTruncated && (
              <Text2
                weight="medium"
                color="light"
                size="sm"
                style={{ opacity: 0.7 }}
              >
                Show more
              </Text2>
            )}
            <Text2
              weight="medium"
              color="light"
              size="sm"
              style={{ position: 'absolute', opacity: 0, width: '100%' }}
              onTextLayout={handleFullTextLayout}
            >
              {cast.text}
            </Text2>
          </View>
        </GestureDetector>
      </View>
    );
  },
);

export { VideoCastDetails };
