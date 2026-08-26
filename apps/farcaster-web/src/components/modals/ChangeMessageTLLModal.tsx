import { Dialog } from '@headlessui/react';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastConversationMessageTTLDays,
} from 'farcaster-client-data';
import { useUpdateConversationMessageTTL } from 'farcaster-client-hooks';
import React, { useEffect, useState } from 'react';

import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const ChangeMessageTLLModal: React.FC<{
  conversation: ApiDirectCastConversationInfoV3;
  newMessageTTL: ApiDirectCastConversationMessageTTLDays;
  onCancel?: () => void;
  onClose: () => void;
  onConfirm?: () => void;
}> = ({ conversation, onClose, onCancel, onConfirm, newMessageTTL }) => {
  const currentUser = useCurrentUser();
  const updateConversationMessageTTL = useUpdateConversationMessageTTL();
  const hasAutoConfirmed = React.useRef(false);

  const updateMessageTTL = React.useCallback(async () => {
    await updateConversationMessageTTL({
      conversationId: conversation.conversationId,
      ttl: newMessageTTL,
      senderContext: {
        fid: currentUser.fid,
        displayName: currentUser?.displayName ?? '',
        username: currentUser?.username ?? '',
      },
    });
  }, [
    conversation.conversationId,
    updateConversationMessageTTL,
    currentUser,
    newMessageTTL,
  ]);

  const [confirmed, setConfirmed] = useState(false);
  const handleClose = React.useCallback(() => {
    if (onCancel && !confirmed) {
      onCancel();
    }
    setConfirmed(false);
    onClose();
  }, [onCancel, confirmed, onClose]);

  const handleConfirm = React.useCallback(() => {
    setConfirmed(true);
    if (onConfirm) {
      onConfirm();
    } else {
      updateMessageTTL();
    }
    onClose();
  }, [updateMessageTTL, onConfirm, onClose]);

  useEffect(() => {
    if (
      Number(newMessageTTL) > Number(conversation.messageTTLDays) &&
      !hasAutoConfirmed.current
    ) {
      hasAutoConfirmed.current = true;
      handleConfirm();
    }
  }, [newMessageTTL, conversation.messageTTLDays, handleConfirm]);

  if (Number(newMessageTTL) >= Number(conversation.messageTTLDays)) {
    return null;
  }

  return (
    <Dialog open onClose={handleClose} className="relative z-50" static>
      <DialogBackdrop />
      <DialogPanelContainer>
        <Dialog.Panel className="w-full max-w-[387px] rounded-lg border p-4 bg-app border-default">
          <Dialog.Title className="mb-4 flex items-center text-xl font-medium text-default">
            Delete older messages?
          </Dialog.Title>
          <Dialog.Description className="flex flex-col space-y-2">
            <span className="font-normal">
              Changing the message auto-delete to{' '}
              <span className="font-semibold">
                {newMessageTTL} day
                {newMessageTTL === 1 ? '' : 's'}
              </span>{' '}
              will delete messages older than {newMessageTTL} day
              {newMessageTTL === 1 ? '' : 's'}.
            </span>
            <span className="font-semibold">This cannot be undone.</span>
          </Dialog.Description>
          <div className="mt-4 grid grid-cols-2 gap-[11px]">
            <DefaultButton onClick={handleClose} variant="secondary">
              Cancel
            </DefaultButton>
            <DefaultButton onClick={handleConfirm} variant="danger">
              Confirm
            </DefaultButton>
          </div>
        </Dialog.Panel>
      </DialogPanelContainer>
    </Dialog>
  );
};

export { ChangeMessageTLLModal };
