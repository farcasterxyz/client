import { RocketIcon } from '@primer/octicons-react';
import { formatDuration } from 'farcaster-client-hooks';
import React, { FC, memo, useEffect, useState } from 'react';

import { UserBoostInfoModal } from '~/components/modals/UserBoostInfoModal';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';

interface UserBoostActiveBannerProps {
  type: 'home' | 'composer';
}

const UserBoostActiveBanner: FC<UserBoostActiveBannerProps> = memo(
  ({ type }) => {
    const { userBoost } = useUserAppContext();
    const [showUserBoostInfo, setShowUserBoostInfo] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Refresh every 30 seconds
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 30000);

      return () => clearInterval(interval);
    }, []);

    if (!userBoost || userBoost.endsAt < currentTime) {
      return null;
    }

    return (
      <>
        {type === 'home' ? (
          <div className="p-3">
            <div
              className="flex cursor-pointer flex-row items-center gap-3 rounded-lg px-4 py-3 bg-overlay-light hover:bg-overlay-medium"
              onClick={() => {
                setShowUserBoostInfo(true);
              }}
            >
              <RocketIcon size={20} className="text-action-yellow" />
              <div className="text-default">
                Casts are being boosted!
                <span className="ml-2 text-muted">
                  {formatDuration(userBoost.endsAt - currentTime)} left
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mt-2 flex cursor-pointer flex-row items-center gap-3 rounded-lg py-2 pl-3 pr-2 bg-elevated hover:bg-overlay-medium"
            onClick={() => setShowUserBoostInfo(true)}
          >
            <RocketIcon size={18} className="text-action-yellow" />
            <div className="text-[14px]">
              Casts are being boosted!
              <span className="ml-2 text-muted">
                {formatDuration(userBoost.endsAt - currentTime)} left
              </span>
            </div>
          </div>
        )}
        <UserBoostInfoModal
          open={showUserBoostInfo}
          onOpenChange={(open) => setShowUserBoostInfo(open)}
          showCastButton={type === 'home'}
        />
      </>
    );
  },
);
UserBoostActiveBanner.displayName = 'UserBoostActiveBanner';

export { UserBoostActiveBanner };
