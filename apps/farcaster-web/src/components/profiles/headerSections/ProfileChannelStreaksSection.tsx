import { StarFillIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { useNonSuspenseActiveChannelStreak } from 'farcaster-client-hooks';
import React from 'react';

import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { ChannelStreaksModal } from '~/components/modals/ChannelStreaksModal';
import { UserChannelStreakModal } from '~/components/modals/UserChannelStreakModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';

type ProfileChannelStreaksSectionProps = {
  user: ApiUser;
};

const ProfileChannelStreaksSection: React.FC<
  ProfileChannelStreaksSectionProps
> = ({ user }) => {
  const { fid: currentUserFid } = useCurrentUser();

  const { optedOutChannelStreaks } = useUserAppContext();

  if (optedOutChannelStreaks) {
    return null;
  }

  return currentUserFid === user.fid ? (
    <ChannelStreaksSelf user={user} />
  ) : (
    <ChannelStreaks user={user} />
  );
};

ProfileChannelStreaksSection.displayName = 'ProfileChannelStreaksSection';

const ChannelStreaks: React.FC<ProfileChannelStreaksSectionProps> = ({
  user,
}) => {
  const { fid: currentUserFid } = useCurrentUser();

  const { trackEvent } = useAnalytics();

  const navigateToChannel = useNavigateToChannel();

  const [showChannelStreakModal, setShowChannelStreakModal] =
    React.useState<boolean>(false);

  const streak = React.useMemo(() => {
    return user.streak;
  }, [user.streak]);

  const onStartStreakClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickProfileChannelStreakNavigateToChannel, {});
  }, [trackEvent]);

  const metadata = React.useMemo(() => {
    if (typeof streak === 'undefined') {
      return undefined;
    }

    return streak.metadata;
  }, [streak]);

  const onActiveStreakClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();

      if (typeof streak === 'undefined') {
        return;
      }

      trackEvent(AnalyticsEvent.ClickProfileChannelStreak, {});

      if (user.fid === currentUserFid && typeof metadata !== 'undefined') {
        setShowChannelStreakModal(true);
        return;
      }

      navigateToChannel({ channelKey: streak.channel.key });
    },
    [currentUserFid, navigateToChannel, streak, trackEvent, user.fid, metadata],
  );

  const content = React.useMemo(() => {
    if (typeof streak === 'undefined') {
      return (
        <div
          className="flex w-max flex-row items-center space-x-1 rounded-full border px-[6px] py-[3px] text-sm text-muted bg-elevated border-default hover:cursor-pointer "
          onClick={onStartStreakClick}
        >
          <StarFillIcon size={14} />
          <div>Start a streak</div>
        </div>
      );
    }

    return (
      <div
        className="flex w-max flex-row items-center space-x-1 rounded-full bg-[#EAB30526] px-[6px] py-[3px] text-sm text-[#ECA220] hover:cursor-pointer dark:border dark:border-[#ECA220] dark:bg-app"
        onClick={onActiveStreakClick}
      >
        <div className="relative">
          <ChannelImage channelImageUrl={streak.channel.imageUrl} size="feed" />
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="absolute bottom-0 right-0 mb-[-2px] mr-[-4px]"
          >
            <path
              d="M5.77443 0.98137L5.32607 1.20268L5.77443 0.981369C5.62893 0.686608 5.32872 0.5 5 0.5C4.67128 0.5 4.37107 0.686608 4.22557 0.981369L3.30269 2.85103L1.23874 3.15271C0.913529 3.20024 0.643488 3.42825 0.542116 3.74089L1.01774 3.89511L0.542116 3.74089C0.440745 4.05353 0.525617 4.39662 0.761059 4.62594L2.25383 6.07989L1.90153 8.13399C1.84595 8.45801 1.97916 8.78549 2.24515 8.97871C2.51113 9.17193 2.86374 9.19738 3.15471 9.04436L5 8.07394L6.84529 9.04436C7.13626 9.19738 7.48887 9.17193 7.75485 8.97871C8.02083 8.78549 8.15405 8.45801 8.09847 8.13399L7.74617 6.07989L9.23894 4.62594C9.47438 4.39662 9.55926 4.05354 9.45788 3.74089L8.98226 3.89511L9.45788 3.74089C9.35651 3.42825 9.08647 3.20024 8.76126 3.15271L6.69731 2.85103L5.77443 0.98137Z"
              fill="#EAB305"
              stroke="#FCF4DA"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>{`${Math.max(1, streak.streakCount)}d`}</div>
      </div>
    );
  }, [onActiveStreakClick, onStartStreakClick, streak]);

  if (typeof streak === 'undefined' && user.fid !== currentUserFid) {
    return null;
  }

  return (
    <>
      <ChannelStreaksModal>{content}</ChannelStreaksModal>
      {showChannelStreakModal && (
        <UserChannelStreakModal
          onCancel={() => setShowChannelStreakModal(false)}
        />
      )}
    </>
  );
};

ChannelStreaks.displayName = 'ChannelStreaks';

const ChannelStreaksSelf: React.FC<ProfileChannelStreaksSectionProps> = ({
  user,
}) => {
  const { fid: currentUserFid } = useCurrentUser();

  const { trackEvent } = useAnalytics();

  const navigateToChannel = useNavigateToChannel();

  const [showChannelStreakModal, setShowChannelStreakModal] =
    React.useState<boolean>(false);

  const { data, isLoading } = useNonSuspenseActiveChannelStreak({
    fid: user.fid,
  });

  const streak = React.useMemo(() => {
    return data?.result.streak;
  }, [data]);

  const onStartStreakClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickProfileChannelStreakNavigateToChannel, {});
  }, [trackEvent]);

  const metadata = React.useMemo(() => {
    if (typeof streak === 'undefined') {
      return undefined;
    }

    return streak.metadata;
  }, [streak]);

  const onActiveStreakClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();

      if (typeof streak === 'undefined') {
        return;
      }

      trackEvent(AnalyticsEvent.ClickProfileChannelStreak, {});

      if (user.fid === currentUserFid && typeof metadata !== 'undefined') {
        setShowChannelStreakModal(true);
        return;
      }

      navigateToChannel({ channelKey: streak.channel.key });
    },
    [currentUserFid, navigateToChannel, streak, trackEvent, user.fid, metadata],
  );

  const content = React.useMemo(() => {
    if (typeof streak === 'undefined') {
      return (
        <div
          className="flex w-max flex-row items-center space-x-1 rounded-full border px-[6px] py-[3px] text-sm text-muted bg-elevated border-default hover:cursor-pointer "
          onClick={onStartStreakClick}
        >
          <StarFillIcon size={14} />
          <div>Start a streak</div>
        </div>
      );
    }

    return (
      <div
        className="flex w-max flex-row items-center space-x-1 rounded-full bg-[#EAB30526] px-[6px] py-[3px] text-sm text-[#ECA220] hover:cursor-pointer dark:border dark:border-[#ECA220] dark:bg-app"
        onClick={onActiveStreakClick}
      >
        <div className="relative">
          <ChannelImage channelImageUrl={streak.channel.imageUrl} size="feed" />
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="absolute bottom-0 right-0 mb-[-2px] mr-[-4px]"
          >
            <path
              d="M5.77443 0.98137L5.32607 1.20268L5.77443 0.981369C5.62893 0.686608 5.32872 0.5 5 0.5C4.67128 0.5 4.37107 0.686608 4.22557 0.981369L3.30269 2.85103L1.23874 3.15271C0.913529 3.20024 0.643488 3.42825 0.542116 3.74089L1.01774 3.89511L0.542116 3.74089C0.440745 4.05353 0.525617 4.39662 0.761059 4.62594L2.25383 6.07989L1.90153 8.13399C1.84595 8.45801 1.97916 8.78549 2.24515 8.97871C2.51113 9.17193 2.86374 9.19738 3.15471 9.04436L5 8.07394L6.84529 9.04436C7.13626 9.19738 7.48887 9.17193 7.75485 8.97871C8.02083 8.78549 8.15405 8.45801 8.09847 8.13399L7.74617 6.07989L9.23894 4.62594C9.47438 4.39662 9.55926 4.05354 9.45788 3.74089L8.98226 3.89511L9.45788 3.74089C9.35651 3.42825 9.08647 3.20024 8.76126 3.15271L6.69731 2.85103L5.77443 0.98137Z"
              fill="#EAB305"
              stroke="#FCF4DA"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>{`${Math.max(1, streak.streakCount)}d`}</div>
      </div>
    );
  }, [onActiveStreakClick, onStartStreakClick, streak]);

  if (isLoading) {
    return null;
  }

  if (typeof streak === 'undefined' && user.fid !== currentUserFid) {
    return null;
  }

  return (
    <>
      <ChannelStreaksModal>{content}</ChannelStreaksModal>
      {showChannelStreakModal && (
        <UserChannelStreakModal
          onCancel={() => setShowChannelStreakModal(false)}
        />
      )}
    </>
  );
};

ChannelStreaksSelf.displayName = 'ChannelStreaksSelf';

export { ProfileChannelStreaksSection };
