import { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import {
  useChangePhotoInPlaintextDirectCastGroup,
  useCreatePlaintextDirectCastGroupInvite,
  useInvalidatePlaintextDirectCastGroupInvite,
  usePlaintextDirectCastGroupInvite,
  useRenamePlaintextDirectCastGroup,
} from 'farcaster-client-hooks';
import React, { useEffect } from 'react';

import { GroupConversationImage } from '~/components/directCasts/GroupConversationImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FileInput } from '~/components/forms/FileInput';
import { FormControl } from '~/components/forms/FormControl';
import { Label } from '~/components/forms/Label';
import { TextInput } from '~/components/forms/TextInput';
import { Link } from '~/components/links/Link';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';

type ManageDirectCastsConversationGroupModalProps = {
  conversation: ApiDirectCastConversationInfoV3;
  onClose: () => void;
};

const ManageDirectCastsConversationGroupModal: React.FC<
  ManageDirectCastsConversationGroupModalProps
> = ({ conversation, onClose }) => {
  const { fid: currentUserFid } = useCurrentUser();

  const rename = useRenamePlaintextDirectCastGroup();
  const changePhoto = useChangePhotoInPlaintextDirectCastGroup();
  const invalidatePlaintextDirectCastGroupInvite =
    useInvalidatePlaintextDirectCastGroupInvite();
  const createPlaintextDirectCastGroupInvite =
    useCreatePlaintextDirectCastGroupInvite();
  const {
    data: invite,
    refetch,
    isPending,
  } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    conversationId: conversation.conversationId,
  });
  const uploadCloudflareImage = useUploadCloudflareImage();

  const [submittingPhoto, setSubmittingPhoto] = React.useState<boolean>(false);
  const [conversationImageURL, setConversationImageURL] = React.useState<
    string | undefined
  >(undefined);
  const [groupName, setGroupName] = React.useState<string | undefined>(
    undefined,
  );
  const [updatingGroupMetadata, setUpdatingGroupMetadata] =
    React.useState<boolean>();

  const canUpdateMetadata = React.useMemo(() => {
    return (
      (typeof groupName !== 'undefined' &&
        groupName.trim() !== '' &&
        conversation.name !== groupName) ||
      (!updatingGroupMetadata &&
        !submittingPhoto &&
        conversation.photoUrl !== conversationImageURL)
    );
  }, [
    conversation.name,
    conversation.photoUrl,
    conversationImageURL,
    groupName,
    submittingPhoto,
    updatingGroupMetadata,
  ]);

  const onSaveClick = React.useCallback(async () => {
    setUpdatingGroupMetadata(true);

    try {
      if (
        typeof groupName !== 'undefined' &&
        groupName.trim() !== '' &&
        conversation.name !== groupName
      ) {
        await rename({
          fid: currentUserFid,
          conversationId: conversation.conversationId,
          name: groupName,
        });
      }

      await changePhoto({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        photoUrl: conversationImageURL,
      });
    } finally {
      setUpdatingGroupMetadata(false);

      onClose();
    }
  }, [
    changePhoto,
    conversation.conversationId,
    conversation.name,
    conversationImageURL,
    currentUserFid,
    groupName,
    onClose,
    rename,
  ]);

  useEffect(() => {
    setGroupName(conversation.name);
    setConversationImageURL(conversation.photoUrl);
  }, [conversation.name, conversation.photoUrl]);

  useEffect(() => {
    if (!invite && !isPending) {
      createPlaintextDirectCastGroupInvite({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        criteria: {},
      }).then(async () => {
        await invalidatePlaintextDirectCastGroupInvite({
          fid: currentUserFid,
          conversationId: conversation.conversationId,
        });
        await refetch();
      });
    }
  }, [
    conversation.conversationId,
    createPlaintextDirectCastGroupInvite,
    currentUserFid,
    invalidatePlaintextDirectCastGroupInvite,
    invite,
    isPending,
    refetch,
  ]);

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="mt-20 flex size-full flex-col items-center">
          <div
            className="relative flex h-3/4 w-full max-w-2xl flex-col items-start overflow-y-auto overflow-x-hidden rounded-lg border py-2 bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex w-full px-2">
              <div className="mb-2 mr-2 mt-1 flex w-full flex-row-reverse justify-between">
                <DefaultButton
                  className="flex flex-col place-content-center"
                  onClick={onSaveClick}
                  disabled={!canUpdateMetadata}
                  isLoading={updatingGroupMetadata}
                >
                  Save
                </DefaultButton>
                <DefaultCloseModalButton onClick={onClose} className="p-2" />
              </div>
            </div>
            <div className="w-full px-4">
              <div className="flex flex-row items-center space-x-8">
                <GroupConversationImage
                  size={'xl'}
                  imageURL={conversationImageURL}
                />
                <FileInput
                  id={'conversation-group-img-input'}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];

                    if (!file) {
                      return;
                    }

                    try {
                      setSubmittingPhoto(true);

                      const uploadResult = await uploadCloudflareImage({
                        file,
                      });

                      if (uploadResult?.imageUrl) {
                        setConversationImageURL(uploadResult.imageUrl);
                      }
                    } finally {
                      setSubmittingPhoto(false);
                    }
                  }}
                />
                <span className="flex flex-col space-y-2">
                  <Link
                    title="Upload photo"
                    to="#"
                    params={{}}
                    searchParams={{}}
                    onClick={(e) => {
                      e.preventDefault();

                      const input = document.getElementById(
                        'conversation-group-img-input',
                      );
                      if (input) {
                        input.click();
                      }
                    }}
                    className="text-sm hover:bg-overlay-faint"
                  >
                    {submittingPhoto ? (
                      <LoadingIndicator size="sm" />
                    ) : conversationImageURL ? (
                      'Edit'
                    ) : (
                      'Upload photo'
                    )}
                  </Link>
                  <Link
                    title="Reset photo"
                    to="#"
                    params={{}}
                    searchParams={{}}
                    onClick={(e) => {
                      e.preventDefault();

                      setConversationImageURL(undefined);
                    }}
                    className="w-min text-sm !text-danger hover:bg-overlay-faint"
                  >
                    {'Reset'}
                  </Link>
                </span>
              </div>
              <FormControl
                label={<Label>Group Name</Label>}
                input={
                  <TextInput
                    value={groupName}
                    maxLength={32}
                    withCharCounter
                    onChange={(e) => {
                      setGroupName(e.target.value);
                    }}
                    minLength={1}
                  />
                }
                instructions={undefined}
              />
              <FormControl
                label={<Label>Invite Link</Label>}
                input={
                  <>
                    <TextInput
                      value={
                        invite?.inviteCode
                          ? `https://farcaster.xyz/~/group/${invite.inviteCode}`
                          : 'No invite link generated'
                      }
                      disabled={true}
                    />
                    <DefaultButton
                      className="mt-2"
                      title="Create new invite link"
                      isLoading={isPending}
                      onClick={async () => {
                        await createPlaintextDirectCastGroupInvite({
                          fid: currentUserFid,
                          conversationId: conversation.conversationId,
                          criteria: {},
                        });
                        await invalidatePlaintextDirectCastGroupInvite({
                          fid: currentUserFid,
                          conversationId: conversation.conversationId,
                        });
                        await refetch();
                      }}
                    >
                      Create new invite link
                    </DefaultButton>
                  </>
                }
                instructions={undefined}
              />
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
};

ManageDirectCastsConversationGroupModal.displayName =
  'ManageDirectCastsConversationGroupModal';

export { ManageDirectCastsConversationGroupModal };
