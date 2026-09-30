import { AnalyticsEvent } from 'farcaster-analytics';
import { usePinCast, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';

import { MegaphoneIcon } from '~/components/casts/actions/icons/Megaphone';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

interface PinCastModalProps {
  castHash: string;
  channelKey: string;
  onClose: () => void;
}

const PinCastModal: FC<PinCastModalProps> = memo(
  ({ castHash, channelKey, onClose }) => {
    const { trackEvent } = useTrackEvent();
    const pinCast = usePinCast();

    const doPinCast = useCallback(
      async (notify: boolean) => {
        try {
          await pinCast({ castHash, notifyChannelMembers: notify, channelKey });

          if (notify) {
            toast({
              message: 'All channel members were notified',
              type: 'success',
            });
          } else {
            toast({
              message: 'Cast pinned',
              type: 'success',
            });
          }

          trackEvent(AnalyticsEvent.ClickPinCast, { notify });

          onClose();
        } catch (error) {
          trackError(error);
          toast({
            message: 'Error pinning, please try again later',
            type: 'error',
          });
        }
      },
      [pinCast, castHash, channelKey, trackEvent, onClose],
    );

    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent minHeightPx={120}>
            <DefaultModalHeader
              title="Announcement"
              onClose={onClose}
              icon={({ size }) => <MegaphoneIcon size={size} />}
            />
            <div className="flex w-full flex-col gap-4 px-4 pb-4">
              <div>
                Would you like to notify all channel followers about this cast?
              </div>
              <DefaultModalActionButtons
                isLoading={false}
                isPrimaryButtonDisabled={false}
                primaryButtonLabel="Notify"
                onPrimaryButtonClick={() => doPinCast(true)}
                secondaryButtonLabel="Don't notify"
                onSecondaryButtonClick={() => doPinCast(false)}
              />
            </div>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  },
);
PinCastModal.displayName = 'PinCastModal';

export { PinCastModal };
