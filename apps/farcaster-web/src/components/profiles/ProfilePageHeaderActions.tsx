import {
  BellFillIcon,
  BellIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserProfile, canOverrideNeynarScore } from 'farcaster-client-data';
import {
  useDisableLinkNotifications,
  useEnableLinkNotifications,
  useGloballyCachedUser,
} from 'farcaster-client-hooks';
import { DollarSignIcon } from 'lucide-react';
import React, { memo, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { ComposeCastButton } from '~/components/forms/buttons/ComposeCastButton';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePayUser } from '~/contexts/PayUserProvider';
import { useFeatureGate } from '~/contexts/WebExperimentationProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { AnalyticsEventUsernameFallback } from '~/utils/userUtils';

import { CurrentUserProfileMenuActions } from './CurrentUserProfileMenuActions';
import { ProfileMenuActions } from './ProfileMenuActions';
import { UserCreatorLabelButton } from './UserCreatorLabelButton';
import { UserNeynarScoreOverrideButton } from './UserNeynarScoreOverrideButton';
import { UserQualityButton } from './UserQualityButton';

type ProfilePageHeaderActionsProps = {
  userProfile: ApiUserProfile;
};

const ProfilePageHeaderActions: React.FC<ProfilePageHeaderActionsProps> = memo(
  ({ userProfile }) => {
    const { user: fallbackUser, quality, badness, creatorLabel } = userProfile;
    const user = useGloballyCachedUser({ fallback: fallbackUser });
    const { trackEvent } = useAnalytics();
    const [isComposingCast, setIsComposingCast] = React.useState(false);
    const currentUser = useCurrentUser();

    useHotkeys('n', () => {
      setIsComposingCast(true);
    });
    const isAdmin = useIsAdmin();
    const viewerCanOverrideNeynarScore = canOverrideNeynarScore(
      currentUser.fid,
    );
    const creatorLabels = useFeatureGate('creator_labels');

    const enablePushNotifications = useEnableLinkNotifications();
    const disablePushNotifications = useDisableLinkNotifications();

    const viewerHasNotificationsEnabled =
      !!user.viewerContext?.enableNotifications;
    const viewerCanEnableNotifications = user.viewerContext?.following ?? false;
    const isCurrentUser = user.fid === currentUser.fid;

    const onNotifyForCastsClick = useCallback(async () => {
      if (viewerHasNotificationsEnabled) {
        void disablePushNotifications({ targetFid: user.fid });
      } else {
        void enablePushNotifications({ targetFid: user.fid, filter: 'all' });
      }

      trackEvent(AnalyticsEvent.ClickUserCastNotification, {
        enabled: !viewerHasNotificationsEnabled,
        username: user.username || AnalyticsEventUsernameFallback,
      });
    }, [
      disablePushNotifications,
      enablePushNotifications,
      trackEvent,
      user.fid,
      user.username,
      viewerHasNotificationsEnabled,
    ]);

    const { launchPayUser } = usePayUser();

    const onPayUserClick = useCallback(() => {
      launchPayUser({ user, via: 'profile' });
    }, [launchPayUser, user]);

    return (
      <div className="flex flex-row items-center space-x-2">
        {viewerCanOverrideNeynarScore && (
          <UserNeynarScoreOverrideButton userProfile={userProfile} />
        )}
        {isAdmin && (
          <UserQualityButton user={user} quality={quality} badness={badness} />
        )}
        {isCurrentUser ? (
          <CurrentUserProfileMenuActions
            user={user}
            userProfile={userProfile}
          />
        ) : (
          <>
            {creatorLabels && (
              <UserCreatorLabelButton user={user} creatorLabel={creatorLabel} />
            )}
            {viewerCanEnableNotifications && (
              <div
                onClick={onNotifyForCastsClick}
                className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-none text-default hover:bg-overlay-faint"
              >
                {viewerHasNotificationsEnabled ? (
                  <div className="relative">
                    <BellFillIcon className="pt-px" />
                    <div className="absolute right-0 top-0 mr-[-2px] mt-3 flex items-center justify-center rounded-full p-[0.25px] bg-app">
                      <CheckCircleIcon size={8} />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <BellIcon className="pt-px" />
                    <div className="absolute right-0 top-0 mr-[-2px] mt-3 flex items-center justify-center rounded-full p-[0.25px] bg-app">
                      <PlusCircleIcon size={8} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div
              onClick={onPayUserClick}
              className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-none text-default hover:bg-overlay-faint"
            >
              <DollarSignIcon size={16} className="mt-[2px]" />
            </div>
            <ProfileMenuActions user={user} userProfile={userProfile} />
          </>
        )}
        <ComposeCastButton
          onClick={() => {
            trackEvent(AnalyticsEvent.AddCastModalShown, {
              username: user.username,
            });
            setIsComposingCast(true);
          }}
          className="hidden !h-[34px] items-center justify-center sm:flex"
        >
          Cast
        </ComposeCastButton>
        {isComposingCast && (
          <ComposeCastModal
            onClose={() => {
              setIsComposingCast(false);
            }}
            intent={
              !isCurrentUser
                ? {
                    addressedToUsername: user.username,
                  }
                : undefined
            }
            isIntentFromSearchParams={false}
          />
        )}
      </div>
    );
  },
);

ProfilePageHeaderActions.displayName = 'ProfilePageHeaderActions';

export { ProfilePageHeaderActions };
