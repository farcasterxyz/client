import { AnalyticsEvent } from 'farcaster-analytics';
import type {
  ApiDirectCastConversationInfoV3,
  ApiUser,
} from 'farcaster-client-data';
import {
  useChangeMemberInPlaintextDirectCastGroup,
  useDirectCastConversation,
  useGetDirectCastGroupInvites,
  usePlaintextDirectCastGroupInvite,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { GroupInviteLink } from '~/components/groupChat/GroupInviteLink';
import { SearchUsersToAdd } from '~/components/groupChat/SearchUsersToAdd';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { toast } from '~/utils/toast';

import { DefaultModalContent } from './DefaultModalContent';
import { DefaultModalHeader } from './DefaultModalHeader';

type InviteLinkSectionProps = {
  currentUserFid: number;
  conversation: ApiDirectCastConversationInfoV3;
};

const ManageGroupAddUsersModalInviteLinkSection: React.FC<InviteLinkSectionProps> =
  React.memo(({ currentUserFid, conversation }) => {
    const { data: invite } = usePlaintextDirectCastGroupInvite({
      fid: currentUserFid,
      conversationId: conversation?.conversationId,
    });

    const groupInviteLink = React.useMemo(() => {
      return typeof invite !== 'undefined' &&
        typeof invite.inviteCode !== 'undefined' &&
        !invite.expired
        ? `https://farcaster.xyz/~/group/${invite.inviteCode}`
        : undefined;
    }, [invite]);

    if (typeof groupInviteLink === 'undefined') {
      return null;
    }
    return (
      <GroupInviteLink className="w-full" groupInviteLink={groupInviteLink} />
    );
  });

type ManageGroupAddUsersModalProps = {
  conversation?: ApiDirectCastConversationInfoV3;
  conversationId?: string;
  onClose: () => void;
  secondaryButtonLabel?: string;
};

const useConversation = (
  conversation?: ApiDirectCastConversationInfoV3,
  conversationId?: string,
) => {
  const { data } = useDirectCastConversation({
    conversationId: conversationId || '',
  });

  return useMemo(() => {
    if (conversation) {
      return conversation;
    }
    return data;
  }, [conversation, data]);
};

const ManageGroupAddUsersModal: React.FC<ManageGroupAddUsersModalProps> = ({
  conversation: propConversation,
  conversationId,
  onClose,
  secondaryButtonLabel,
}) => {
  const { trackEvent } = useAnalytics();
  const currentUser = useCurrentUser();
  const conversation = useConversation(propConversation, conversationId);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentUserFid = currentUser.fid;

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const { data: groupInvites } = useGetDirectCastGroupInvites({
    conversationId: conversation?.conversationId || '',
    enabled: conversation?.viewerContext.access === 'admin',
  });

  const [removedFids, setRemovedFids] = React.useState<number[]>([]);

  const changeMembers = useChangeMemberInPlaintextDirectCastGroup();

  const [memberFids, setMemberFids] = useState<number[]>([]);

  useEffect(() => {
    if (typeof conversation === 'undefined') {
      return;
    }
    const currentUserFromParticipants = conversation.participants.find(
      ({ fid }) => fid === currentUserFid,
    )?.fid;

    const adminsFromParticipants = conversation.participants
      .filter(
        ({ fid }) =>
          fid !== currentUserFid && conversation.adminFids.indexOf(fid) !== -1,
      )
      .map(({ fid }) => fid);

    const rest = conversation.participants
      .filter(
        ({ fid }) =>
          fid !== currentUserFid &&
          conversation.removedFids.indexOf(fid) === -1 &&
          conversation.adminFids.indexOf(fid) === -1,
      )
      .map(({ fid }) => fid);

    setMemberFids([
      currentUserFromParticipants!,
      ...(groupInvites?.map((invite) => invite.invitee.fid) || []),
      ...adminsFromParticipants,
      ...rest,
    ]);
  }, [conversation, currentUserFid, groupInvites]);

  const [userCanAddMembers, setUserCanAddMembers] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (typeof conversation === 'undefined') {
      return;
    }
    setUserCanAddMembers(
      conversation?.viewerContext.access === 'admin' ||
        (typeof conversation?.groupPreferences !== 'undefined' &&
          conversation?.groupPreferences.membersCanInvite),
    );
  }, [conversation]);

  const onSaveClick = React.useCallback(
    async (newCounterParties: ApiUser[]) => {
      if (!userCanAddMembers) {
        return;
      }

      try {
        trackEvent(AnalyticsEvent.AddMemberDirectCastsGroup, {
          new_member_count: newCounterParties.length,
        });

        await changeMembers({
          senderContext: {
            fid: currentUserFid,
            displayName: currentUser.displayName,
            username: currentUser.username,
          },
          conversationId: conversation?.conversationId || '',
          action: 'add',
          participants: newCounterParties,
        });
        const pendingInvites = newCounterParties.filter(
          (user) => user.viewerContext?.canAddToGroupDirectly === false,
        );
        if (pendingInvites.length > 0) {
          toast({
            message: `${pendingInvites.length} group invite${
              pendingInvites.length > 1 ? 's' : ''
            } pending`,
            toastId: 'group-invite-pending',
          });
        }
      } finally {
        onClose();
      }
    },
    [
      changeMembers,
      currentUser,
      conversation?.conversationId,
      currentUserFid,
      onClose,
      trackEvent,
      userCanAddMembers,
    ],
  );

  React.useEffect(() => {
    setRemovedFids(conversation?.removedFids || []);

    return () => {
      // TODO: Do we need to clean these up on actions - wouldn't component close
      // and re-render clear all these up anyway?
      setRemovedFids([]);
    };
  }, [conversation?.removedFids]);

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <DefaultModalContent>
          <DefaultModalHeader title="Add to group" onClose={onClose} />
          <React.Suspense fallback={<div className="h-[76px]" />}>
            {typeof conversation !== 'undefined' && (
              <div className="mb-4 w-full px-4">
                <ManageGroupAddUsersModalInviteLinkSection
                  currentUserFid={currentUserFid}
                  conversation={conversation}
                />
              </div>
            )}
          </React.Suspense>
          <div className="size-full overflow-hidden">
            {userCanAddMembers ? (
              <SearchUsersToAdd
                searchInputRef={searchInputRef}
                memberFids={memberFids}
                removedFids={removedFids}
                onSubmit={onSaveClick}
                submitButtonLabel="Invite"
                secondaryButtonLabel={secondaryButtonLabel || 'Cancel'}
                onSecondaryButtonClick={onClose}
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center p-4">
                <span className="text-center font-['Inter'] text-base font-normal leading-relaxed">
                  {userCanAddMembers !== null &&
                    'Only admins can add users to this group.'}
                </span>
              </div>
            )}
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};

ManageGroupAddUsersModal.displayName = 'ManageGroupAddUsersModal';

export { ManageGroupAddUsersModal };
