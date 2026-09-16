import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiXPReward,
  ApiXPRewardStatus,
  ApiXPRewardType,
  formatDisplayDollars,
} from 'farcaster-client-data';
import { useTimeAgo } from 'farcaster-client-hooks';
import {
  BanIcon,
  CalendarOffIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  TimerIcon,
} from 'lucide-react';
import React, { useCallback } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { Typography } from '~/components/design-system/atoms/Typography';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';

const EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

function getXpRewardStatusLabel(status: ApiXPRewardStatus): string {
  switch (status) {
    case 'earned':
      return 'Claimed';
    case 'pending':
      return 'Unclaimed';
    case 'error':
      return 'Error';
    case 'claiming':
      return 'Claiming';
    case 'expired':
      return 'Expired';
  }
}

function getXpRewardStatusColor(status: ApiXPRewardStatus) {
  switch (status) {
    case 'earned':
      return 'text-secondary' as const;
    case 'pending':
      return 'text-brand' as const;
    case 'error':
      return 'text-danger' as const;
    default:
      return 'text-secondary' as const;
  }
}

type XpRewardDetailsModalProps = {
  xpReward: ApiXPReward;
  onClose: () => void;
};

function getXpRewardTypeLabel(type: ApiXPRewardType) {
  switch (type) {
    case 'swap':
      return 'Swap';
    case 'pro':
      return 'Bought PRO';
    case 'join':
      return 'Join';
    case 'referral':
      return 'Referral';
    default:
      return '';
  }
}

function XpRewardStatusIcon({
  status,
}: {
  status: ApiXPRewardStatus;
}): React.ReactNode {
  switch (status) {
    case 'earned':
      return (
        <CircleCheckIcon size={16} className={getXpRewardStatusColor(status)} />
      );
    case 'pending':
      return (
        <CircleDashedIcon
          size={16}
          className={getXpRewardStatusColor(status)}
        />
      );
    case 'expired':
      return (
        <CalendarOffIcon size={16} className={getXpRewardStatusColor(status)} />
      );
    case 'claiming':
      return <TimerIcon size={16} className={getXpRewardStatusColor(status)} />;
    case 'error':
      return <BanIcon size={16} className={getXpRewardStatusColor(status)} />;
  }
}

export const XpRewardDetailsModal: React.FC<XpRewardDetailsModalProps> =
  React.memo(({ onClose, xpReward }) => {
    const navigateToProfile = useNavigateToProfile();
    const { trackEvent } = useAnalytics();
    const onProfilePress = useCallback(() => {
      trackEvent(AnalyticsEvent.ViewXPUserProfile, {
        fid: xpReward?.user.fid,
      });
      navigateToProfile({ user: xpReward?.user });
    }, [xpReward?.user, navigateToProfile, trackEvent]);

    const timeAgo = useTimeAgo({ timestamp: xpReward.timestamp });
    const expiresIn = useTimeAgo({
      timestamp: xpReward.timestamp + EXPIRATION_TIME,
    });
    const { status } = xpReward;
    return (
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full items-center justify-center p-4">
          <div className="border-top border-left border-right relative w-full max-w-xl overflow-hidden rounded-2xl p-6 shadow-xl bg-app">
            <div className="row flex gap-3">
              <div onClick={onProfilePress}>
                <Avatar user={xpReward?.user} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="row flex gap-1">
                  <XpRewardStatusIcon status={status} />
                  <Typography
                    label="Body/Medium"
                    className={getXpRewardStatusColor(status)}
                  >
                    {getXpRewardStatusLabel(status)}
                  </Typography>
                </div>
                <div onClick={onProfilePress}>
                  <Typography label="Body/Medium" color="primary">
                    {xpReward?.user.username}
                  </Typography>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-row justify-between gap-1 p-2">
                <p>{getXpRewardTypeLabel(xpReward.type)}</p>
                <p>{formatDisplayDollars(xpReward.usdc)}</p>
              </div>
              <div className="flex flex-row justify-between gap-1 rounded-lg p-2 bg-surface-secondary">
                <p>Time</p>
                <p>{timeAgo + ' ago'}</p>
              </div>
              {status === 'pending' && (
                <div className="flex flex-row justify-between gap-1 p-2">
                  <p>Expires In</p>
                  <p>{expiresIn}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    );
  });

XpRewardDetailsModal.displayName = 'XpRewardDetailsModal';
