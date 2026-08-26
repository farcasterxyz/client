import { AlertIcon, CheckCircleFillIcon } from '@primer/octicons-react';
import { useActiveChannelStreak } from 'farcaster-client-hooks';
import React from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';
import { dayjs } from '~/utils/dayjs';

type UserChannelStreakModalProps = {
  onCancel: () => void;
};

const UserChannelStreakModal: React.FC<UserChannelStreakModalProps> =
  React.memo(({ onCancel }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onCancel}>
          <React.Suspense>
            <UserChannelStreakModalContent onCancel={onCancel} />
          </React.Suspense>
        </DefaultModalContainer>
      </Modal>
    );
  });

const UserChannelStreakModalContent: React.FC<UserChannelStreakModalProps> =
  React.memo(({ onCancel }) => {
    const { fid: currentUserFid } = useCurrentUser();

    const { data } = useActiveChannelStreak({ fid: currentUserFid });

    const streakLength = React.useMemo(() => {
      if (
        typeof data === 'undefined' ||
        typeof data.result.streak === 'undefined'
      ) {
        return 0;
      }

      return data.result.streak.streakCount;
    }, [data]);

    const metadata = React.useMemo(() => {
      if (
        typeof data === 'undefined' ||
        typeof data.result.streak === 'undefined' ||
        typeof data.result.streak.metadata === 'undefined'
      ) {
        return undefined;
      }

      return data.result.streak.metadata;
    }, [data]);

    const startedFormattedDateString = React.useMemo(() => {
      if (typeof metadata === 'undefined') {
        return;
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      return dayjs(metadata.latestWindowStartTimestamp)
        .tz(tz)
        .format('h:mma z');
    }, [metadata]);

    const expiresInHours = React.useMemo(() => {
      if (typeof metadata === 'undefined') {
        return;
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Custom thresholds are already configured in our dayjs setup
      return dayjs(metadata.expiresAtTimestamp).tz(tz).fromNow(true);
    }, [metadata]);

    const expiresFormattedDateString = React.useMemo(() => {
      if (typeof metadata === 'undefined') {
        return;
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      return dayjs(metadata.expiresAtTimestamp).tz(tz).format('h:mma z');
    }, [metadata]);

    const userAlreadyCasted = React.useMemo(() => {
      if (typeof metadata === 'undefined') {
        return false;
      }

      return metadata.latestWindowCastCount !== 0;
    }, [metadata]);

    const navigateToChannel = useNavigateToChannel();

    const onGoToChannelClick = React.useCallback(() => {
      onCancel();

      if (typeof data !== 'undefined' && data.result.streak) {
        navigateToChannel({ channelKey: data.result.streak.channel.key });
      }
    }, [data, navigateToChannel, onCancel]);

    if (typeof metadata === 'undefined') {
      return null;
    }

    return (
      <div className="flex size-full flex-col items-center justify-center p-4">
        <div
          className="flex h-auto w-[500px] flex-col items-start justify-center rounded-lg border p-4 pb-0 bg-app border-default"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex w-full flex-row items-center justify-between pl-6 pr-4">
            <div className="text-lg font-semibold text-default">
              About your streak
            </div>
          </div>
          <div className="flex w-full flex-col space-y-4 p-6">
            <div className="flex flex-col">
              <span className="font-semibold text-default">Streak length</span>
              <div className="flex flex-row items-center">
                <span className="text-default">{streakLength}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-default">
                Your streak window
              </span>
              <div className="flex flex-row items-center">
                <span className="text-default">
                  {startedFormattedDateString} to {expiresFormattedDateString}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-default">
                Current streak window
              </span>
              <div className="flex flex-col">
                <span className="flex flex-row items-center space-x-2 text-default">
                  <span>
                    {metadata.latestWindowCastCount === 0
                      ? 'No casts'
                      : metadata.latestWindowCastCount === 1
                        ? '1 cast'
                        : `${metadata.latestWindowCastCount} casts`}
                  </span>
                  {userAlreadyCasted ? (
                    <CheckCircleFillIcon className="text-success" />
                  ) : (
                    <AlertIcon className="text-muted" />
                  )}
                </span>
              </div>
            </div>
            {userAlreadyCasted ? (
              <span className="bg-success/30 flex flex-row items-center justify-center space-x-2 rounded px-2 py-3 text-success">
                <span className="font-semibold">
                  Your next window starts in {expiresInHours}
                </span>
              </span>
            ) : (
              <span className="flex flex-row items-center justify-center space-x-2 rounded px-2 py-3 text-muted bg-overlay-light">
                <span className="font-semibold">
                  You have {expiresInHours} left to cast
                </span>
              </span>
            )}
            <div className="grid grid-cols-2 grid-rows-1 items-center justify-between gap-4">
              <DefaultButton
                title="Close"
                className="outline-hidden flex h-10 !w-full flex-row items-center !justify-center space-x-1 self-center border !bg-transparent !p-0 !text-base !font-normal !text-muted border-default"
                onClick={onCancel}
              >
                <span className="flex flex-row items-center text-center">
                  Close
                </span>
              </DefaultButton>
              <DefaultButton
                title="Go to channel"
                className="outline-hidden flex h-10 !w-full  flex-row items-center !justify-center space-x-1 !text-base !font-normal !bg-action-primary hover:!bg-[#7C65C1F0]"
                onClick={onGoToChannelClick}
              >
                <span className="flex flex-row items-center text-center text-light">
                  Go to channel
                </span>
              </DefaultButton>
            </div>
          </div>
        </div>
      </div>
    );
  });

UserChannelStreakModal.displayName = 'UserChannelStreakModal';

export { UserChannelStreakModal };
