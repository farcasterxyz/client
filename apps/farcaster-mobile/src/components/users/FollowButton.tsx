import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  UnableToFollowUserError,
  useCreateFollow,
  useDeleteFollow,
  useGloballyCachedUser,
  useTrackEvent,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonSize } from '~/components/Button/types';
import { ButtonV2 } from '~/components/ButtonV2';
import { FollowAnalyticsData } from '~/components/users/types';
import { followsDisabledPromptKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { trackError } from '~/utils/ErrorUtils';

type FollowButtonProps = {
  targetUser: ApiUser;
  size: ButtonSize;
  /**
   * standalone - button is primary / secondary
   * list - button is secondary / tertiary
   */
  presentation: 'list' | 'standalone';
  onToggle?: (action: 'follow' | 'unfollow') => void;
  onAfterFollow?: () => void;
  onAfterUnfollow?: () => void;
  extraFollowAnalyticsData?: FollowAnalyticsData;
};

/**
 * Simplified, optimized follow button using the design system button
 * component. Avoid adding styles. If another variant is significantly
 * different consider refactoring the logic into a hook and introducing
 * a second component.
 */
const FollowButton: FC<FollowButtonProps> = memo(
  ({
    targetUser: fallbackTargetUser,
    size = 'normal',
    presentation,
    onToggle,
    onAfterFollow,
    onAfterUnfollow,
    extraFollowAnalyticsData,
  }) => {
    const currentUser = useGloballyCachedCurrentUser();
    const targetUser = useGloballyCachedUser({ fallback: fallbackTargetUser });

    const { showGlobalPrompt } = useGlobalPrompts();
    const { shouldLinkToUser } = useUserLinkHelpers();

    const createFollow = useCreateFollow();
    const deleteFollow = useDeleteFollow();
    const { disableFollow } = useUserAppContext();

    const { trackEvent } = useTrackEvent();

    const toast = useToast();

    const isViewerFollowing = targetUser.viewerContext?.following;
    const disabled = !isViewerFollowing && disableFollow;
    const normalizedFollowAnalyticsData = useMemo(() => {
      if (!extraFollowAnalyticsData) {
        return undefined;
      }

      const { on, via, ...restFollowAnalyticsData } = extraFollowAnalyticsData;

      return {
        ...restFollowAnalyticsData,
        ...((on ?? via) ? { on: on ?? via } : {}),
      };
    }, [extraFollowAnalyticsData]);

    const normalizedFollowAnalyticsDataForEvent = useMemo(() => {
      if (!normalizedFollowAnalyticsData) {
        return undefined;
      }

      if (!isViewerFollowing) {
        return normalizedFollowAnalyticsData;
      }

      const {
        includeReason: _includeReason,
        sourceSurface: _sourceSurface,
        ...restFollowAnalyticsData
      } = normalizedFollowAnalyticsData;

      return restFollowAnalyticsData;
    }, [isViewerFollowing, normalizedFollowAnalyticsData]);

    const onFollowPress = React.useCallback(async () => {
      trackEvent(
        isViewerFollowing
          ? AnalyticsEvent.AccountUnfollow
          : AnalyticsEvent.AccountFollow,
        {
          target: targetUser.fid,
          ...normalizedFollowAnalyticsDataForEvent,
        },
      );

      try {
        if (isViewerFollowing) {
          onToggle && onToggle('follow');

          await deleteFollow({ followee: targetUser, follower: currentUser });

          if (typeof onAfterUnfollow === 'function') {
            onAfterUnfollow();
          }
        } else {
          onToggle && onToggle('unfollow');

          await createFollow({ followee: targetUser, follower: currentUser });

          if (typeof onAfterFollow === 'function') {
            onAfterFollow();
          }
        }
      } catch (error) {
        toast.show('Unable to follow user', { type: 'danger' });

        trackError(
          new UnableToFollowUserError({
            followerFid: currentUser.fid,
            followeeFid: targetUser.fid,
            follow: !isViewerFollowing,
            error,
          }),
        );
      }
    }, [
      createFollow,
      currentUser,
      deleteFollow,
      isViewerFollowing,
      normalizedFollowAnalyticsDataForEvent,
      onAfterFollow,
      onAfterUnfollow,
      onToggle,
      targetUser,
      toast,
      trackEvent,
    ]);

    const pushToUserProfile = usePushToUserProfile();

    const onDisabledPress = React.useCallback(() => {
      if (shouldLinkToUser({ fid: targetUser.fid })) {
        pushToUserProfile({ fid: targetUser.fid });
      } else {
        showGlobalPrompt({ key: followsDisabledPromptKey });
      }
    }, [pushToUserProfile, shouldLinkToUser, showGlobalPrompt, targetUser.fid]);

    if (currentUser.fid === targetUser.fid) {
      return null;
    }

    const onPress = disabled ? onDisabledPress : onFollowPress;

    return (
      <FollowButtonInner
        isFollowing={isViewerFollowing ?? false}
        isFollowed={targetUser.viewerContext?.followedBy ?? false}
        onPress={onPress}
        disabled={disabled}
        presentation={presentation}
        size={size}
      />
    );
  },
);

FollowButton.displayName = 'FollowButton';

const FollowButtonInner = memo(
  ({
    isFollowing,
    isFollowed,
    onPress,
    disabled,
    presentation,
    size,
  }: {
    isFollowing: boolean;
    isFollowed: boolean;
    disabled: boolean;
    presentation: 'standalone' | 'list';
    onPress: () => void;
    size: ButtonSize;
  }) => {
    const variant = useMemo(() => {
      if (presentation === 'list') {
        return isFollowing ? 'tertiary' : 'secondary';
      } else {
        return isFollowing ? 'secondary' : 'primary';
      }
    }, [isFollowing, presentation]);

    return (
      <View style={{ minWidth: 102 }}>
        <ButtonV2
          title={
            isFollowing ? 'Following' : isFollowed ? 'Follow back' : 'Follow'
          }
          height={size}
          onPress={onPress}
          variant={variant}
          disabled={disabled}
          width="full"
        />
      </View>
    );
  },
);

FollowButtonInner.displayName = 'FollowButtonInner';

export { FollowButton };
