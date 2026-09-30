import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiTokenLinkCore } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  UpdateCastLikeError,
  useCreateCastLike,
  useDeleteCastLike,
  useGloballyCachedCast,
} from 'farcaster-client-hooks';
import { Avatar } from 'farcaster-expo/src/components/Avatar';
import compact from 'lodash/compact';
import { Heart } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { FeedCastBody } from '~/components/casts/CastBody';
import { CastUsernameAndTimestamp } from '~/components/casts/CastUsernameAndTimestamp';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useCastAttachment } from '~/hooks/useCastAttachment';
import { useHaptics } from '~/hooks/useHaptics';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { trackError } from '~/utils/ErrorUtils';

interface VideoCommentProps {
  cast: ApiCast;
  onNavigate?: () => void;
}

const VideoComment = memo(
  ({ cast: fallbackCast, onNavigate }: VideoCommentProps) => {
    const t = useTheme();
    const cast = useGloballyCachedCast({ fallback: fallbackCast });
    const toast = useToast();
    const { triggerImpactAsync } = useHaptics();
    const createCastLike = useCreateCastLike();
    const deleteCastLike = useDeleteCastLike();
    const push = usePush();
    const isSubmitting = useRef(false);
    const pushToUserProfile = usePushToUserProfile();
    const isProUser = useUserLevel(cast.author) === 'pro';
    const { trackEvent } = useAnalytics();
    const reacted = cast.viewerContext?.reacted || false;
    const reactionCount = cast.reactions?.count || 0;

    const handleLike = useCallback(async () => {
      if (isSubmitting.current) {
        return;
      }
      trackEvent(AnalyticsEvent.VideoFeedCommentLike);
      isSubmitting.current = true;

      if (!reacted) {
        triggerImpactAsync();
      }

      try {
        if (reacted) {
          try {
            await deleteCastLike({ cast });
          } catch (error) {
            toast.show('Failed to unlike the comment.', {
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
            toast.show('Failed to like the comment.', {
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
        isSubmitting.current = false;
      }
    }, [
      cast,
      createCastLike,
      deleteCastLike,
      reacted,
      toast,
      triggerImpactAsync,
      trackEvent,
    ]);

    const { regularCastByteLimit } = useUserAppContext();

    const { bodyTextOverride: bodyText } = useCastAttachment({
      cast,
      text: cast.text,
      embeds: cast.embeds,
      focusedCastMode: false,
      composerMode: false,
    });

    const shouldTruncate = bodyText.length > regularCastByteLimit + 10; // 10 extra bytes for ellipsis

    const truncatedBodyText = useMemo(() => {
      return shouldTruncate
        ? `${bodyText.slice(0, regularCastByteLimit)}...`
        : bodyText;
    }, [bodyText, regularCastByteLimit, shouldTruncate]);

    const mentions = cast.mentions;

    const tokenMentions = useMemo(() => {
      if (typeof cast.embeds !== 'undefined' && cast.embeds.urls.length !== 0) {
        const possibleTokenEmbeds = cast.embeds.urls.map(({ token }) => token);
        const mentions: string[] = [];
        for (const pte of possibleTokenEmbeds) {
          if (typeof pte !== 'undefined') {
            mentions.push(pte.ca);
          }
        }
        return mentions;
      }

      return [];
    }, [cast.embeds]);

    const tokenMentionsV2 = useMemo(() => {
      if (typeof cast.embeds !== 'undefined' && cast.embeds.urls.length !== 0) {
        const possibleTokenEmbeds = cast.embeds.urls.map(
          ({ tokenV2 }) => tokenV2,
        );
        const mentions: ApiTokenLinkCore[] = [];
        for (const pte of possibleTokenEmbeds) {
          if (typeof pte !== 'undefined') {
            mentions.push(pte);
          }
        }
        return mentions;
      }

      return [];
    }, [cast.embeds]);

    const { linkifiedText, hasOnlyImages } = useLinkifyText({
      text: truncatedBodyText,
      mentions: compact(mentions?.map((mention) => mention.username)),
      channelMentions: cast.channelMentions?.map(({ key }) => key),
      tokenMentions: tokenMentions,
      tokenMentionsV2: tokenMentionsV2,
      options: {
        navMethod: 'push',
        onNavigate,
      },
    });

    const handleProfileTap = useCallback(() => {
      onNavigate?.();
      pushToUserProfile({ fid: cast.author.fid });
    }, [onNavigate, pushToUserProfile, cast.author.fid]);

    const handleBodyTap = useCallback(() => {
      onNavigate?.();
      push('Cast', { castHash: cast.hash });
    }, [onNavigate, push, cast.hash]);

    if (hasOnlyImages) {
      return null;
    }

    return (
      <View
        style={[
          t.flexRow,
          t.pX4,
          t.pY3,
          t.borderDefault,
          t.borderBHairline,
          { gap: 12 },
        ]}
      >
        <Pressable onPress={handleProfileTap}>
          <Avatar
            diameter={48}
            pfpUrl={cast.author.pfp?.url}
            isHighlighted={false}
            blockAnimated
          />
        </Pressable>

        <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
          <CastUsernameAndTimestamp
            fid={cast.author.fid}
            username={cast.author.username}
            timestamp={cast.timestamp}
            isProUser={isProUser}
            inversedTextColors={false}
            isFocusedCast={false}
            showMemberBadge={false}
            channel={undefined}
            variant="default"
            hideTimestamp={false}
            onPress={handleProfileTap}
          />

          <Pressable onPress={handleBodyTap}>
            <FeedCastBody
              bodyWithLinks={linkifiedText}
              isTruncatedCastText={shouldTruncate}
              onShowMorePress={() => {}}
              skipShowMoreCTA={true}
              isFocusedCast={false}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={handleLike}
          style={[t.flexCol, t.itemsCenter, t.justifyStart, t.mT7, { gap: 2 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={20}
            color={reacted ? t.colors.actionRed : t.colors.text.tertiary}
            fill={reacted ? t.colors.actionRed : 'transparent'}
          />
          {reactionCount > 0 && (
            <Text2 color="tertiary" size="xs">
              {formatShorthandNumber(reactionCount)}
            </Text2>
          )}
        </Pressable>
      </View>
    );
  },
);

VideoComment.displayName = 'VideoComment';

export { VideoComment };
