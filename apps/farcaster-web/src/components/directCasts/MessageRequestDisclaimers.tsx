import { ApiUserMinimal } from 'farcaster-client-data';
import {
  useAlterPlaintextDirectCastConversationCategory,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ReportUserModal } from '~/components/modals/ReportUserModal';
import { useDirectCastConversationContext } from '~/contexts/ManageDirectCastConversationProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useCanGoBack } from '~/hooks/navigation/useCanGoBack';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type MessageRequestDisclaimersProps = {
  requestFid: number;
  requesterUsername: string;
  category: 'request' | 'void';
};

const MessageRequestDisclaimers: React.FC<MessageRequestDisclaimersProps> = ({
  requestFid,
  requesterUsername,
  category,
}) => {
  const { fid: currentUserFid } = useCurrentUser();
  const { trackEvent } = useTrackEvent();
  const goBack = useGoBack();
  const canGoBack = useCanGoBack();
  const { conversation, deleteConversation } =
    useDirectCastConversationContext();
  const [reportUserDialogOpen, setReportUserDialogOpen] = useState(false);

  const alterConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();

  const navigateToConversation = useNavigateToDirectCastsConversation();
  const navigateToInbox = useNavigateToDirectCastsInbox();

  const wrappedDeleteConversation = async () => {
    const { deleted } = await deleteConversation();

    if (deleted) {
      trackEvent({
        name: 'reject direct cast request',
        props: {
          conversationId: conversation.conversationId,
          via: 'conversation view',
          action: 'delete',
        },
      });

      if (canGoBack) {
        goBack();
      } else {
        navigateToInbox();
      }
    }
  };

  const onAccept = async () => {
    try {
      await alterConversationCategory({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        fromCategory: category,
        toCategory: 'default',
      });
      navigateToConversation({
        conversationId: conversation?.conversationId,
      });
    } catch (e) {
      trackError(e);
      toast({
        message: `Failed to accept direct cast request`,
        type: 'error',
      });
    }
  };

  const disclaimerText =
    category === 'void'
      ? 'This message was hidden. Accept to move it to your inbox.'
      : 'Accept or reply to this request to move it to your inbox.';

  return (
    <div className="flex justify-center py-4 bg-faint">
      <div className="grid gap-4">
        <div>{disclaimerText}</div>
        <div className="grid grid-cols-3 gap-2">
          <DefaultButton variant="danger" onClick={wrappedDeleteConversation}>
            Delete
          </DefaultButton>
          <DefaultButton
            variant="secondary"
            onClick={() => setReportUserDialogOpen(true)}
          >
            Report user
          </DefaultButton>
          <DefaultButton onClick={onAccept}>Accept</DefaultButton>
        </div>
        {reportUserDialogOpen && requestFid && (
          <ReportUserModal
            targetUser={
              { fid: requestFid, username: requesterUsername } as ApiUserMinimal
            }
            onClose={() => setReportUserDialogOpen(false)}
            onSubmit={wrappedDeleteConversation}
          />
        )}
      </div>
    </div>
  );
};

export { MessageRequestDisclaimers };
