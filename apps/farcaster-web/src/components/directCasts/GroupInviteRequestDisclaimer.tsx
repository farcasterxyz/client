import { TrashIcon } from '@primer/octicons-react';
import { ApiUser, ApiUserMinimal } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { ReportUserModal } from '~/components/modals/ReportUserModal';
import { useDirectCastConversationContext } from '~/contexts/ManageDirectCastConversationProvider';
import { useCanGoBack } from '~/hooks/navigation/useCanGoBack';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

const GroupInviteRequestDisclaimer: React.FC<{
  inviter?: ApiUserMinimal;
}> = ({ inviter }) => {
  const goBack = useGoBack();
  const canGoBack = useCanGoBack();
  const { acceptGroupInvite, declineGroupInvite, conversation } =
    useDirectCastConversationContext();

  const navigateToConversation = useNavigateToDirectCastsConversation();
  const navigateToInbox = useNavigateToDirectCastsInbox();

  const username = resolveUsername({
    fid: inviter?.fid,
    username: inviter?.username,
  });

  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [reportUserDialogOpen, setReportUserDialogOpen] = useState(false);

  const onAccept = useCallback(async () => {
    try {
      await acceptGroupInvite();
      navigateToConversation({
        conversationId: conversation?.conversationId,
      });
    } catch (e) {
      trackError(e);
      toast({
        message: `Failed to accept group invitation`,
        type: 'error',
      });
    }
  }, [acceptGroupInvite, navigateToConversation, conversation]);

  const onDelete = useCallback(async () => {
    try {
      await declineGroupInvite();
      if (canGoBack) {
        goBack();
      } else {
        navigateToInbox();
      }
    } catch (e) {
      trackError(e);
      toast({
        message: `Failed to delete conversation`,
        type: 'error',
      });
    }
  }, [declineGroupInvite, canGoBack, goBack, navigateToInbox]);

  const icon = useCallback(({ size }: { size: number }) => {
    return <TrashIcon size={size} />;
  }, []);

  return (
    <div className="flex justify-center py-4 bg-faint">
      <div className="grid gap-4">
        <div className="text-center text-lg font-bold">
          Join the conversation
        </div>
        {username ? (
          <div>
            Accept this group invitation from{' '}
            <span className="font-semibold">
              {' '}
              <LinkToProfileWithSummaryTooltip
                user={inviter as ApiUser}
                title={username}
                className="relative hover:underline"
              >
                {username}
              </LinkToProfileWithSummaryTooltip>
            </span>{' '}
            to move it to your inbox.
          </div>
        ) : (
          <div>Accept this group invitation to move it to your inbox.</div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <DefaultButton
            variant="danger"
            onClick={() => setDeclineDialogOpen(true)}
          >
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
        {declineDialogOpen && (
          <ConfirmationModal
            onCancel={() => {
              setDeclineDialogOpen(false);
            }}
            onConfirm={onDelete}
            confirmText="Delete"
            title="Delete group chat?"
            icon={icon}
            body="Are you sure you want to delete this group chat? This is permanent, and cannot be undone."
            hideAreYouSure
            destructive
          />
        )}
        {reportUserDialogOpen && inviter?.fid && (
          <ReportUserModal
            targetUser={inviter as ApiUser}
            onClose={() => setReportUserDialogOpen(false)}
            onSubmit={onDelete}
          />
        )}
      </div>
    </div>
  );
};

export { GroupInviteRequestDisclaimer };
