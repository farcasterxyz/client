import { RocketIcon, XIcon } from '@primer/octicons-react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  formatDuration,
  getNotionLinkTarget,
  useInvalidateUserAppContext,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, useEffect, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';

interface UserBoostInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showCastButton?: boolean;
}

const UserBoostInfoModal: FC<UserBoostInfoModalProps> = ({
  open,
  onOpenChange,
  showCastButton = true,
}) => {
  const { userBoost } = useUserAppContext();
  const { trackEvent } = useTrackEvent();
  const invalidateUserAppContext = useInvalidateUserAppContext();
  const [composerVisible, setComposerVisible] = useState(false);

  useEffect(() => {
    // Invalidate the user app context on mount to fetch the boost end time
    invalidateUserAppContext();
  }, [invalidateUserAppContext]);

  if (userBoost === undefined) {
    // We should never be here
    return null;
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange} modal={true}>
        <Dialog.Trigger asChild>moo</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-10 bg-overlay" />
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 max-h-[85vh] w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] py-6 bg-app">
            <div className="flex flex-row items-center justify-between pl-6 pr-4">
              <Dialog.Title className="flex flex-row items-center gap-3">
                <div className="flex size-[32px] items-center justify-center rounded-full bg-[#FBF0CD]">
                  <RocketIcon size={18} className="text-action-yellow" />
                </div>
                <div className="text-xl font-semibold">Boost</div>
              </Dialog.Title>
              <Dialog.Close asChild>
                <div className="flex w-max cursor-pointer flex-col items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default">
                  <XIcon size={20} className="text-default" />
                </div>
              </Dialog.Close>
            </div>
            <div className="mt-4 flex flex-col gap-4 px-6">
              <Dialog.Description>
                Casts will reach more people for the next{' '}
                {formatDuration(userBoost.endsAt - Date.now())}.{' '}
                <ExternalLink
                  href={getNotionLinkTarget({ to: 'boosts' })}
                  title="Learn more"
                >
                  Learn more
                </ExternalLink>
                .
              </Dialog.Description>
              {showCastButton && (
                <DefaultButton
                  title="Cast now"
                  onClick={() => {
                    trackEvent(AnalyticsEvent.PressUserBoostCastNow, undefined);

                    setComposerVisible(true);
                    onOpenChange(false);
                  }}
                  className="outline-hidden mt-1 h-12 w-full !text-base"
                >
                  Cast Now
                </DefaultButton>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {composerVisible && (
        <ComposeCastModal
          onClose={() => {
            setComposerVisible(false);
          }}
          intent={undefined}
        />
      )}
    </>
  );
};
UserBoostInfoModal.displayName = 'UserBoostInfoModal';

export { UserBoostInfoModal };
