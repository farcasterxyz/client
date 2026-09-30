import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiUser } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  resolveUsername,
  useChangePhotoInPlaintextDirectCastGroup,
  useCreatePlaintextDirectCastGroup,
  useCreatePlaintextDirectCastGroupInvite,
  useDirectCastInboxByAccount,
  useOptimisticallyAddNewDirectCastConversationToInbox,
} from 'farcaster-client-hooks';
import React, { useEffect, useRef, useState } from 'react';

import { Textarea } from '~/components/forms/Textarea';
import { TextInput } from '~/components/forms/TextInput';
import { GroupImageSelector } from '~/components/groupChat/GroupImageSelector';
import { SearchUsersToAdd } from '~/components/groupChat/SearchUsersToAdd';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { defaultTextareaRows } from '~/constants/forms';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';

import { DefaultModalActionButtons } from './DefaultModalActionButtons';
import { DefaultModalContent } from './DefaultModalContent';
import { DefaultModalHeader } from './DefaultModalHeader';
import { ManageGroupAddUsersModal } from './ManageGroupAddUsersModal';

type NewDirectCastConversationModalProps = {
  onClose: () => void;
  allowGroups?: boolean | undefined;
};

const NewDirectCastConversationModal: React.FC<NewDirectCastConversationModalProps> =
  React.memo(({ onClose, allowGroups }) => {
    const { trackEvent } = useAnalytics();

    const [conversationImageURL, setConversationImageURL] = React.useState<
      string | undefined
    >(undefined);
    const currentUser = useCurrentUser();
    const addNewOptimisticConversation =
      useOptimisticallyAddNewDirectCastConversationToInbox();
    const createPlaintextDirectCastGroup = useCreatePlaintextDirectCastGroup();
    const changePhoto = useChangePhotoInPlaintextDirectCastGroup();
    const createDirectCastGroupInvite =
      useCreatePlaintextDirectCastGroupInvite();
    const [groupConversationId, setGroupConversationId] = useState<string>();
    const [showAddUsersModal, setShowAddUsersModal] = useState<boolean>(false);
    const [conversationId, setConversationId] = useState<string>();
    const [groupName, setGroupName] = useState<string>('');
    const [groupDescription, setGroupDescription] = useState<string>('');
    const { refetch } = useDirectCastInboxByAccount({
      fid: currentUser.fid,
      category: 'default',
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, []);

    const [counterParties, setCounterParties] = useState<ApiUser[]>([]);

    const navigateToDirectCastsConversation =
      useNavigateToDirectCastsConversation();

    const onClickCreate = async (newCounterParties: ApiUser[]) => {
      setCounterParties(newCounterParties);
      if (newCounterParties.length > 1 || newCounterParties.length === 0) {
        setGroupConversationId(
          [currentUser.fid, ...newCounterParties.map((p) => p.fid)]
            .sort()
            .join('-'),
        );
        if (newCounterParties.length > 0 && newCounterParties.length < 5) {
          setGroupName(
            newCounterParties
              .map((p) =>
                p.displayName
                  ? p.displayName.split(' ')[0]
                  : resolveUsername({ username: p.username, fid: p.fid }),
              )
              .join(', '),
          );
        }
      } else {
        const conversationId = buildNonGroupConversationId({
          participantFids: [
            currentUser.fid,
            ...newCounterParties.map((o) => o.fid),
          ],
        });

        addNewOptimisticConversation({
          currentUser,
          conversationId,
          counterParties: newCounterParties,
        });
        navigateToDirectCastsConversation({
          conversationId: conversationId,
        });
        onClose();
      }
    };

    const onClickGroupCreate = async (newCounterParties: ApiUser[]) => {
      setCounterParties(newCounterParties);
      const data = await createPlaintextDirectCastGroup({
        fid: currentUser.fid,
        participantFids: newCounterParties.map((p) => p.fid),
        name: groupName,
      });
      if (data === null) {
        // eslint-disable-next-line no-console
        console.warn(
          'data was null: NewDirectCastConversationModal:createPlaintextDirectCastGroup',
        );
      }
      const { result } = data;

      if (typeof conversationImageURL !== 'undefined') {
        await changePhoto({
          fid: currentUser.fid,
          conversationId: result.conversationId,
          photoUrl: conversationImageURL,
        });
      }

      await createDirectCastGroupInvite({
        fid: currentUser.fid,
        conversationId: result.conversationId,
      });

      trackEvent(AnalyticsEvent.CreateGroupDirectCasts, {
        participant_count: newCounterParties.length + 1,
        with_image: typeof conversationImageURL !== 'undefined',
      });

      setShowAddUsersModal(true);
      setConversationId(result.conversationId);
    };

    const goToGroupChat = () => {
      if (conversationId) {
        try {
          refetch();
        } catch {}
        onClose();
        navigateToDirectCastsConversation({
          conversationId: conversationId,
        });
      }
    };

    const submitButtonLabel = React.useMemo(() => {
      if (groupConversationId) {
        return 'Continue';
      }
      if (counterParties.length === 0) {
        return 'Select users';
      }
      return counterParties.length > 1 ? 'Continue' : 'Message';
    }, [groupConversationId, counterParties]);

    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent>
            <DefaultModalHeader
              title={
                groupConversationId || counterParties.length > 1
                  ? 'New group'
                  : 'New direct cast'
              }
              onClose={onClose}
            />
            {groupConversationId ? (
              <div className="flex size-full flex-col overflow-y-auto">
                <SetGroupChatDetails
                  conversationImageURL={conversationImageURL}
                  groupName={groupName}
                  groupDescription={groupDescription}
                  setGroupName={setGroupName}
                  setGroupDescription={setGroupDescription}
                  setConversationImageURL={setConversationImageURL}
                  onSubmit={() => onClickGroupCreate(counterParties)}
                  onClose={onClose}
                />
              </div>
            ) : (
              <div className="flex size-full flex-col overflow-hidden">
                <SearchUsersToAdd
                  searchInputRef={searchInputRef}
                  memberFids={[]}
                  removedFids={[]}
                  secondaryButtonLabel="Cancel"
                  onSecondaryButtonClick={onClose}
                  onSubmit={(newCounterParties) => {
                    if (groupConversationId) {
                      onClickGroupCreate(newCounterParties);
                    } else if (allowGroups) {
                      onClickCreate(newCounterParties);
                    }
                  }}
                  submitButtonLabel={submitButtonLabel}
                  onSelectionChanged={(newCounterParties) => {
                    setCounterParties(newCounterParties);
                  }}
                />
              </div>
            )}
          </DefaultModalContent>
          {showAddUsersModal && conversationId && (
            <ManageGroupAddUsersModal
              conversationId={conversationId}
              onClose={goToGroupChat}
              secondaryButtonLabel="Skip"
            />
          )}
        </DefaultModalContainer>
      </Modal>
    );
  });

interface SetGroupChatDetailsProps {
  conversationImageURL: string | undefined;
  groupName: string;
  groupDescription: string;
  setGroupName: (name: string) => void;
  setGroupDescription: (description: string) => void;
  setConversationImageURL: (url: string | undefined) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const SetGroupChatDetails: React.FC<SetGroupChatDetailsProps> = ({
  onClose,
  conversationImageURL,
  groupName,
  groupDescription,
  setGroupName,
  setGroupDescription,
  setConversationImageURL,
  onSubmit,
}) => {
  const [buttonEnabled, setButtonEnabled] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [submittingPhoto, setSubmittingPhoto] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setButtonEnabled(groupName.length > 0 && !submittingPhoto);
  }, [groupName, submittingPhoto]);

  return (
    <>
      <div className="flex flex-row items-center border-t border-default">
        <GroupImageSelector
          conversationImageURL={conversationImageURL}
          setConversationImageURL={setConversationImageURL}
          onSubmittingPhotoStateChange={setSubmittingPhoto}
        />
      </div>
      <div className="mx-[16px] mb-[16px] flex h-full flex-col">
        <div className="mb-2 pl-1 text-sm leading-none text-muted">
          Group Name
        </div>
        <TextInput
          className="mb-2"
          ref={nameInputRef}
          value={groupName}
          maxLength={32}
          placeholder="Add a group name..."
          withCharCounter
          onChange={(e) => {
            setGroupName(e.target.value);
            setButtonEnabled(e.target.value.length > 0);
          }}
        />
        <div className="my-2 pl-1 text-sm leading-none text-muted">
          Description
        </div>
        <Textarea
          value={groupDescription}
          maxLength={250}
          rows={defaultTextareaRows}
          withCharCounter
          placeholder="Add a description for your group..."
          onChange={(e) => {
            setGroupDescription(e.target.value);
          }}
        />
      </div>
      <div className="border-t p-[16px] border-default">
        <DefaultModalActionButtons
          isLoading={isLoading}
          secondaryButtonLabel="Cancel"
          onSecondaryButtonClick={onClose}
          isPrimaryButtonDisabled={!buttonEnabled}
          onPrimaryButtonClick={() => {
            setIsLoading(true);
            onSubmit();
          }}
          primaryButtonLabel={buttonEnabled ? 'Create group' : 'Enter fields'}
        />
      </div>
    </>
  );
};

NewDirectCastConversationModal.displayName = 'NewDirectCastConversationModal';

export { NewDirectCastConversationModal };
