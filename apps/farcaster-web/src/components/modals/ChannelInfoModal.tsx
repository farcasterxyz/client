import { useChannelDetails } from 'farcaster-client-hooks';
import React, { Suspense } from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { User } from '~/components/users/User';

import { DefaultCloseModalButton } from './DefaultCloseModalButton';

type ChannelInfoModalProps = {
  channelKey: string;
  onCancel: () => void;
};

const ChannelInfoModal: React.FC<ChannelInfoModalProps> = React.memo(
  ({ channelKey, onCancel }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onCancel}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="flex h-auto w-[500px] flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex w-full flex-row-reverse px-2">
                <DefaultCloseModalButton onClick={onCancel} className="p-2" />
              </div>
              <div className="flex w-full flex-col space-y-8 p-6 pt-0">
                <Suspense fallback={<LoadingIndicator />}>
                  <ChannelInfoModalContent channelKey={channelKey} />
                </Suspense>
              </div>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

type ChannelInfoModalContentProsp = Pick<ChannelInfoModalProps, 'channelKey'>;

const ChannelInfoModalContent: React.FC<ChannelInfoModalContentProsp> =
  React.memo(({ channelKey }) => {
    const { data } = useChannelDetails({ key: channelKey });

    return (
      <>
        <div className="flex flex-col">
          <span className="font-semibold text-default">Owner</span>
          <div>
            {data?.lead ? (
              <User
                user={data.lead}
                compact
                avatarSizing="sm"
                hideFollowButton
                showFollowing
                className="mt-2 border-b-0"
                withDetailsPopover
                sidePadding={false}
              />
            ) : (
              <span className="text-muted">No owner</span>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-default">Moderator</span>
          <div>
            {data?.moderator ? (
              <User
                user={data.moderator}
                avatarSizing="sm"
                compact
                hideFollowButton
                showFollowing
                className="mt-2 border-b-0"
                withDetailsPopover
                sidePadding={false}
              />
            ) : (
              <span className="text-muted">No moderator</span>
            )}
          </div>
        </div>
      </>
    );
  });

ChannelInfoModal.displayName = 'UserExtrasModal';

export { ChannelInfoModal };
