import { Switch } from '@headlessui/react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  SyncIcon,
} from '@primer/octicons-react';
import classNames from 'classnames';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastConversationMessageTTLDays,
} from 'farcaster-client-data';
import {
  directCastConversationMessageTTLDays,
  getNotionLinkTarget,
  useChangePhotoInPlaintextDirectCastGroup,
  useCreatePlaintextDirectCastGroupInvite,
  usePlaintextDirectCastGroupInvite,
  useRenamePlaintextDirectCastGroup,
  useUpdateConversationMessageTTL,
  useUpdateDirectCastGroupPreferences,
} from 'farcaster-client-hooks';
import React from 'react';

import { DirectCastConversationAutoDeleteMenu } from '~/components/directCasts/DirectCastConversationAutoDeleteMenu';
import { FormControl } from '~/components/forms/FormControl';
import { Instructions } from '~/components/forms/Instructions';
import { SelectOne } from '~/components/forms/SelectOne';
import { Textarea } from '~/components/forms/Textarea';
import { TextInput } from '~/components/forms/TextInput';
import { GroupImageSelector } from '~/components/groupChat/GroupImageSelector';
import { ExternalLink } from '~/components/links/ExternalLink';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { defaultTextareaRows } from '~/constants/forms';
import { useDirectCastConversationContext } from '~/contexts/ManageDirectCastConversationProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { ChangeMessageTLLModal } from './ChangeMessageTLLModal';
import { DefaultModalContent } from './DefaultModalContent';
import { DefaultModalHeader } from './DefaultModalHeader';

const CAIP_10_PATTERN = /eip155:(\d+):(0x[a-fA-F0-9]+)(?::(\d+))?/;
const DEFAULT_MESSAGE_TTL = directCastConversationMessageTTLDays.toString();

type EditGroupModalProps = {
  onClose: () => void;
};

const EditGroupModal: React.FC<EditGroupModalProps> = React.memo(
  ({ onClose }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent>
            <DefaultModalHeader title="Edit details" onClose={onClose} />
            <React.Suspense
              fallback={
                <span className="flex size-full flex-row items-center justify-center py-8">
                  <LoadingIndicator />
                </span>
              }
            >
              <EditGroupModalContent onClose={onClose} />
            </React.Suspense>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

type EditGroupModalContentProps = {
  onClose: () => void;
};

export const EditGroupModalContent: React.FC<EditGroupModalContentProps> = ({
  onClose,
}) => {
  const currentUser = useCurrentUser();
  const currentUserFid = currentUser?.fid;

  const conversation = useDirectCastConversationContext()
    .conversation as ApiDirectCastConversationInfoV3;

  const [autoDeleteMenuOpen, setAutoDeleteMenuOpen] = React.useState(false);

  const [saving, setSaving] = React.useState<boolean>(false);
  const [submittingPhoto, setSubmittingPhoto] = React.useState<boolean>(false);

  const [madeChangesToForm, setMadeChangesToForm] =
    React.useState<boolean>(false);
  const [generatingInviteLink, setGeneratingInviteLink] =
    React.useState<boolean>(false);

  const { data: invite } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    conversationId: conversation.conversationId,
  });

  const [
    showChangeMessageTTLConfirmationModal,
    setShowChangeMessageTTLConfirmationModal,
  ] = React.useState<boolean>(false);
  const [newMessageTTL, setNewMessageTTL] =
    React.useState<string>(DEFAULT_MESSAGE_TTL);

  const createDirectCastGroupInvite = useCreatePlaintextDirectCastGroupInvite();
  const rename = useRenamePlaintextDirectCastGroup();
  const changePhoto = useChangePhotoInPlaintextDirectCastGroup();
  const updateDirectCastGroupPreferences =
    useUpdateDirectCastGroupPreferences();
  const updateConversationMessageTTL = useUpdateConversationMessageTTL();

  const nftGatingIsEnabled = React.useMemo(() => {
    return (
      typeof invite !== 'undefined' &&
      typeof invite.criteria !== 'undefined' &&
      typeof invite.criteria.hasCollectionIds !== 'undefined' &&
      invite.criteria.hasCollectionIds.length !== 0
    );
  }, [invite]);

  const [form, setForm] = React.useState<{
    groupPhoto: { value: string | undefined };
    groupName: { value: string | undefined };
    groupDescription: { value: string | undefined };
    groupInviteWhoCanInviteCriteria: { value: 'everyone' | 'admins' };
    groupInviteWhoCanJoinCriteria: { value: 'everyone' | 'follows' };
    groupInviteNFTCriteria: { value: boolean };
    groupInviteNFTCriteriaTarget: { value: string | undefined };
    groupToBeValidatedByWarpcast: { value: boolean };
    messageTTL: { value: string | undefined };
  }>({
    groupPhoto: { value: conversation.photoUrl },
    groupName: { value: conversation.name },
    groupDescription: { value: conversation.description },
    groupInviteWhoCanInviteCriteria: {
      value:
        typeof conversation.groupPreferences !== 'undefined' &&
        conversation.groupPreferences.membersCanInvite
          ? 'everyone'
          : 'admins',
    },
    groupInviteWhoCanJoinCriteria: {
      value:
        typeof invite === 'undefined' ||
        typeof invite.criteria === 'undefined' ||
        typeof invite.criteria.followers === 'undefined' ||
        invite.criteria.followers === 'everyone'
          ? 'everyone'
          : 'follows',
    },
    groupInviteNFTCriteria: {
      value: nftGatingIsEnabled,
    },
    groupInviteNFTCriteriaTarget: {
      value:
        typeof invite !== 'undefined' &&
        typeof invite.criteria !== 'undefined' &&
        typeof invite.criteria.hasCollectionIds !== 'undefined' &&
        invite.criteria.hasCollectionIds.length !== 0
          ? invite.criteria.hasCollectionIds[0]
          : undefined,
    },
    groupToBeValidatedByWarpcast: {
      value:
        typeof conversation.groupPreferences !== 'undefined' &&
        conversation.groupPreferences.periodicallyValidateMemberships,
    },
    messageTTL: {
      value:
        typeof conversation.messageTTLDays !== 'undefined'
          ? conversation.messageTTLDays.toString()
          : DEFAULT_MESSAGE_TTL,
    },
  });

  const updateFormField = React.useCallback(
    <Name extends keyof typeof form>({
      error,
      name,
      value,
    }: {
      error?: string | undefined;
      name: Name;
      value: (typeof form)[Name]['value'];
    }) => {
      setMadeChangesToForm(true);

      return setForm((prevForm) => ({
        ...prevForm,
        [name]: { value, error },
      }));
    },
    [],
  );

  const groupInviteLink = React.useMemo(() => {
    return typeof invite !== 'undefined' &&
      typeof invite.inviteCode !== 'undefined' &&
      !invite.expired
      ? `https://farcaster.xyz/~/group/${invite.inviteCode}`
      : undefined;
  }, [invite]);

  const [copiedGroupInviteLink, setCopiedGroupInviteLink] =
    React.useState<boolean>(false);

  const onCopyGroupLinkClick = React.useCallback(() => {
    if (typeof groupInviteLink === 'undefined') {
      return;
    }

    navigator.clipboard.writeText(groupInviteLink);

    setCopiedGroupInviteLink(true);
    setTimeout(() => {
      setCopiedGroupInviteLink(false);
    }, 2000);
  }, [groupInviteLink]);

  const onGenerateGroupInviteLinkClick = React.useCallback(async () => {
    setGeneratingInviteLink(true);

    try {
      await createDirectCastGroupInvite({
        conversationId: conversation.conversationId,
        fid: currentUserFid,
      });
      setMadeChangesToForm(true);
    } finally {
      setGeneratingInviteLink(false);
    }
  }, [
    conversation.conversationId,
    createDirectCastGroupInvite,
    currentUserFid,
  ]);

  const hasUpdatesToSave = React.useMemo(() => {
    if (form.groupName.value?.trim() === '') {
      return false;
    }
    if (submittingPhoto) {
      return false;
    }
    return madeChangesToForm;
  }, [madeChangesToForm, form.groupName.value, submittingPhoto]);

  const onSaveClick = React.useCallback(async () => {
    if (!hasUpdatesToSave) {
      return;
    }

    setSaving(true);

    try {
      if (
        typeof form.groupName.value !== 'undefined' &&
        form.groupName.value.trim() !== '' &&
        (conversation.name !== form.groupName.value ||
          conversation.description !== form.groupDescription.value)
      ) {
        await rename({
          fid: currentUserFid,
          conversationId: conversation.conversationId,
          name: form.groupName.value,
          description: form.groupDescription.value,
        });
      }

      if (conversation.photoUrl !== form.groupPhoto.value) {
        await changePhoto({
          fid: currentUserFid,
          conversationId: conversation.conversationId,
          photoUrl: form.groupPhoto.value,
        });
      }

      if (conversation.messageTTLDays.toString() !== form.messageTTL.value) {
        const ttl = Number(form.messageTTL.value ?? DEFAULT_MESSAGE_TTL);
        await updateConversationMessageTTL({
          conversationId: conversation.conversationId,
          ttl: (ttl === Infinity
            ? 'Infinity'
            : ttl) as ApiDirectCastConversationMessageTTLDays,
          senderContext: {
            fid: currentUserFid,
            displayName: currentUser?.displayName ?? '',
            username: currentUser?.username ?? '',
          },
        });
      }

      const membersCanInvite =
        form.groupInviteWhoCanInviteCriteria.value === 'everyone';
      const validateMemberships =
        form.groupInviteNFTCriteria &&
        form.groupInviteNFTCriteria.value &&
        form.groupToBeValidatedByWarpcast.value;
      if (
        typeof conversation.groupPreferences !== 'undefined' &&
        (conversation.groupPreferences.membersCanInvite !== membersCanInvite ||
          conversation.groupPreferences.periodicallyValidateMemberships !==
            validateMemberships)
      ) {
        await updateDirectCastGroupPreferences({
          conversationId: conversation.conversationId,
          membersCanInvite: membersCanInvite,
          periodicallyValidateMemberships: validateMemberships,
        });
      }

      if (form.groupInviteNFTCriteria && form.groupInviteNFTCriteria.value) {
        const openSeaMatcher =
          /https:\/\/(www.)?opensea.io\/collection\/([a-z0-9-_]+)/i;

        const openSeaMatched =
          form.groupInviteNFTCriteria &&
          typeof form.groupInviteNFTCriteriaTarget.value !== 'undefined' &&
          form.groupInviteNFTCriteriaTarget.value.trim() !== ''
            ? form.groupInviteNFTCriteriaTarget.value.match(openSeaMatcher)
            : undefined;

        const caipMatched =
          !openSeaMatched &&
          form.groupInviteNFTCriteria &&
          typeof form.groupInviteNFTCriteriaTarget.value !== 'undefined' &&
          form.groupInviteNFTCriteriaTarget.value.trim() !== ''
            ? form.groupInviteNFTCriteriaTarget.value.match(CAIP_10_PATTERN)
            : undefined;

        // FIXME: The logic here is impossible for anyone to follow
        const hasCollectionIds =
          form.groupInviteNFTCriteria &&
          typeof openSeaMatched !== 'undefined' &&
          openSeaMatched !== null &&
          openSeaMatched.length >= 3
            ? [openSeaMatched[2]]
            : typeof form.groupInviteNFTCriteriaTarget.value !== 'undefined' &&
                typeof caipMatched !== 'undefined' &&
                caipMatched !== null
              ? [form.groupInviteNFTCriteriaTarget.value]
              : undefined;

        await createDirectCastGroupInvite({
          fid: currentUserFid,
          conversationId: conversation.conversationId,
          criteria: {
            followers: form.groupInviteWhoCanJoinCriteria.value,
            hasCollectionIds: hasCollectionIds,
          },
        });
      } else if (nftGatingIsEnabled) {
        await createDirectCastGroupInvite({
          fid: currentUserFid,
          conversationId: conversation.conversationId,
          criteria: {
            followers: form.groupInviteWhoCanJoinCriteria.value,
            hasCollectionIds: undefined,
          },
        });
      }
    } finally {
      setSaving(false);

      onClose();
    }
  }, [
    changePhoto,
    conversation.conversationId,
    conversation.description,
    conversation.groupPreferences,
    conversation.messageTTLDays,
    conversation.name,
    conversation.photoUrl,
    createDirectCastGroupInvite,
    currentUserFid,
    currentUser?.displayName,
    currentUser?.username,
    form.groupDescription.value,
    form.groupInviteNFTCriteria,
    form.groupInviteNFTCriteriaTarget.value,
    form.groupInviteWhoCanInviteCriteria.value,
    form.groupInviteWhoCanJoinCriteria.value,
    form.groupName.value,
    form.groupPhoto.value,
    form.groupToBeValidatedByWarpcast.value,
    form.messageTTL.value,
    hasUpdatesToSave,
    onClose,
    rename,
    updateConversationMessageTTL,
    updateDirectCastGroupPreferences,
    nftGatingIsEnabled,
  ]);

  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col justify-between overflow-hidden',
      )}
    >
      <div className="scrollbar-vert h-full overflow-y-auto">
        <GroupImageSelector
          conversationImageURL={form.groupPhoto.value}
          setConversationImageURL={(conversationImageURL) =>
            updateFormField({
              name: 'groupPhoto',
              value: conversationImageURL,
            })
          }
          onSubmittingPhotoStateChange={setSubmittingPhoto}
        />
        <div className="flex flex-col space-y-1 px-3">
          <div className="flex grow flex-col">
            <FormControl
              className="!flex-col !space-y-1 !pb-3"
              label={
                <div className="text-sm font-normal text-faint">Group name</div>
              }
              input={
                <TextInput
                  {...form.groupName}
                  maxLength={32}
                  withCharCounter={true}
                  onChange={(e) => {
                    updateFormField({
                      name: 'groupName',
                      value: e.target.value,
                    });
                  }}
                />
              }
              instructions={undefined}
            />
            <FormControl
              className="!flex-col !space-y-1 !pb-1"
              label={
                <div className="text-sm font-normal text-faint">
                  Description
                </div>
              }
              input={
                <Textarea
                  {...form.groupDescription}
                  maxLength={128}
                  hideResizeHandle={true}
                  withCharCounter={true}
                  rows={defaultTextareaRows}
                  onChange={(e) => {
                    updateFormField({
                      name: 'groupDescription',
                      value: e.target.value,
                    });
                  }}
                />
              }
              instructions={undefined}
            />
          </div>
        </div>
        <div className="flex flex-col space-y-2 px-3 pb-3">
          <div className="text-sm font-normal text-faint">
            Auto-delete after...
          </div>
          <DirectCastConversationAutoDeleteMenu
            className="!w-[398px]"
            selection={
              Number(
                form.messageTTL.value ?? DEFAULT_MESSAGE_TTL,
              ) as ApiDirectCastConversationMessageTTLDays
            }
            open={autoDeleteMenuOpen}
            onOpenChange={setAutoDeleteMenuOpen}
            onSelect={(ttl) => {
              const newValue = ttl.toString();
              if (newValue !== conversation.messageTTLDays.toString()) {
                setNewMessageTTL(newValue);
                setShowChangeMessageTTLConfirmationModal(true);
              } else {
                updateFormField({
                  name: 'messageTTL',
                  value: newValue,
                });
              }
            }}
            side="bottom"
            align="center"
            trigger={
              <div className="flex grow flex-row items-center justify-between rounded-md border px-4 py-3 text-sm border-default">
                <div>
                  {form.messageTTL.value === '365'
                    ? '1 year'
                    : form.messageTTL.value === 'Infinity'
                      ? 'Never'
                      : `${form.messageTTL.value} day${form.messageTTL.value === '1' ? '' : 's'}`}
                </div>
                {autoDeleteMenuOpen ? (
                  <ChevronUpIcon size={16} />
                ) : (
                  <ChevronDownIcon size={16} />
                )}
              </div>
            }
          />
        </div>
        <div className="flex flex-col space-y-2 px-3 pb-3">
          <div className="flex grow flex-row items-center justify-between">
            <div className="flex grow flex-col">
              <div className="text-sm font-normal text-faint">Group link</div>
            </div>
          </div>
          <div className="flex h-[40px] flex-row items-center space-x-2 rounded-md border px-[10px] py-2 border-default">
            <div className="relative flex grow flex-row items-center">
              <span className="line-clamp-1 w-full text-sm break-gracefully text-faint">
                {groupInviteLink?.replace(/(^\w+:|^)\/\//, '')}
              </span>
            </div>
            <div className="relative -ml-px inline-flex flex-row items-center gap-2">
              <div
                className="flex min-w-0 shrink-0 cursor-pointer flex-row items-center justify-center rounded-full border p-[6px] text-sm bg-overlay-light border-default hover:bg-overlay-medium"
                onClick={onGenerateGroupInviteLinkClick}
              >
                {generatingInviteLink ? (
                  <LoadingIndicator containerClassName="!w-4 !h-4" />
                ) : (
                  <SyncIcon size={16} className={'text-default'} />
                )}
              </div>
              <div
                className="flex min-w-0 shrink-0 cursor-pointer flex-row items-center justify-center rounded-full border p-[6px] text-sm bg-overlay-light border-default hover:bg-overlay-medium"
                onClick={onCopyGroupLinkClick}
              >
                {copiedGroupInviteLink ? (
                  <CheckIcon size={16} className={'text-default'} />
                ) : (
                  <CopyIcon size={16} className={'text-default'} />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-2 px-3 pb-3">
          <div className="text-sm font-normal text-faint">Who can invite</div>
          <SelectOne<'everyone' | 'admins'>
            options={[
              { value: 'everyone', title: 'Everyone' },
              { value: 'admins', title: 'Admins' },
            ]}
            value={form.groupInviteWhoCanInviteCriteria.value}
            onChange={(newValue) => {
              updateFormField({
                name: 'groupInviteWhoCanInviteCriteria',
                value: newValue,
              });
            }}
            bordered
          />
        </div>
        <div className="flex flex-col space-y-2 px-3 pb-3">
          <div className="text-sm font-normal text-faint">Who can join</div>
          <SelectOne<'everyone' | 'follows'>
            options={[
              { value: 'everyone', title: 'Everyone' },
              {
                value: 'follows',
                title: 'People I follow',
              },
            ]}
            value={form.groupInviteWhoCanJoinCriteria.value}
            onChange={(newValue) => {
              updateFormField({
                name: 'groupInviteWhoCanJoinCriteria',
                value: newValue,
              });
            }}
            bordered
          />
        </div>
        <div className="mb-4 flex flex-col px-3 pb-3 pt-0">
          <Switch.Group
            as="div"
            className="mt-4 flex w-full items-center justify-between gap-2 rounded border px-2 py-4 bg-app border-default"
          >
            <span className="flex grow flex-col">
              <Switch.Label as="span" className="text-default" passive>
                Must hold NFT
              </Switch.Label>
            </span>
            <Switch
              checked={form.groupInviteNFTCriteria.value}
              onChange={(checked) => {
                updateFormField({
                  name: 'groupInviteNFTCriteria',
                  value: checked,
                });
              }}
              className={classNames(
                form.groupInviteNFTCriteria.value
                  ? 'bg-action-primary'
                  : 'bg-toggle-inactive',
                'focus:outline-hidden relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ring-0 transition-colors duration-200 ease-in-out',
              )}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  form.groupInviteNFTCriteria.value
                    ? 'translate-x-5'
                    : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                )}
              />
            </Switch>
          </Switch.Group>
          {form.groupInviteNFTCriteria.value && (
            <div className="">
              <FormControl
                className="!mb-2 !flex-col !space-y-1 !py-2"
                label={
                  <div className="text-sm font-normal text-faint">
                    Collection
                  </div>
                }
                input={
                  <Textarea
                    {...form.groupInviteNFTCriteriaTarget}
                    placeholder="eip155:7777777:0xc86340bf9b348e83b655b0b4762c11e247eda7b5"
                    autoFocus={
                      typeof form.groupInviteNFTCriteriaTarget.value ===
                        'undefined' ||
                      form.groupInviteNFTCriteriaTarget.value === ''
                    }
                    maxLength={512}
                    hideResizeHandle={true}
                    withCharCounter={false}
                    rows={2}
                    onChange={(e) => {
                      updateFormField({
                        name: 'groupInviteNFTCriteriaTarget',
                        value: e.target.value,
                      });
                    }}
                  />
                }
                instructions={
                  <Instructions className="pl-0.5">
                    Accepts OpenSea URLs or CAIP-10.{' '}
                    <ExternalLink
                      href={getNotionLinkTarget({ to: 'nft-collections' })}
                      title="Learn more"
                      className="inline cursor-pointer text-link hover:underline"
                    >
                      Learn more
                    </ExternalLink>
                  </Instructions>
                }
              />
              <Switch.Group
                as="div"
                className="flex w-full items-center justify-between gap-2 rounded border px-2 py-4 bg-app border-default"
              >
                <span className="flex grow flex-col">
                  <Switch.Label as="span" className="text-default" passive>
                    Check for NFT
                  </Switch.Label>
                </span>
                <Switch
                  checked={form.groupToBeValidatedByWarpcast.value}
                  onChange={(checked) => {
                    updateFormField({
                      name: 'groupToBeValidatedByWarpcast',
                      value: checked,
                    });
                  }}
                  className={classNames(
                    form.groupToBeValidatedByWarpcast.value
                      ? 'bg-action-primary'
                      : 'bg-toggle-inactive',
                    'focus:outline-hidden relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ring-0 transition-colors duration-200 ease-in-out',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={classNames(
                      form.groupToBeValidatedByWarpcast.value
                        ? 'translate-x-5'
                        : 'translate-x-0',
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    )}
                  />
                </Switch>
              </Switch.Group>
              <Instructions className="pl-0.5">
                Remove group members if they no longer hold the NFT. Runs daily.
              </Instructions>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-b-md border-t p-[16px] border-default">
        <DefaultModalActionButtons
          isLoading={saving}
          isPrimaryButtonDisabled={!hasUpdatesToSave}
          onSecondaryButtonClick={onClose}
          onPrimaryButtonClick={onSaveClick}
          secondaryButtonLabel="Cancel"
          primaryButtonLabel="Save group changes"
        />
      </div>
      {showChangeMessageTTLConfirmationModal && (
        <ChangeMessageTLLModal
          conversation={conversation as ApiDirectCastConversationInfoV3}
          newMessageTTL={
            Number(newMessageTTL) as ApiDirectCastConversationMessageTTLDays
          }
          onClose={() => {
            setShowChangeMessageTTLConfirmationModal(false);
          }}
          onCancel={() => {
            updateFormField({
              name: 'messageTTL',
              value: conversation.messageTTLDays.toString(),
            });
          }}
          onConfirm={() => {
            updateFormField({
              name: 'messageTTL',
              value: newMessageTTL,
            });
          }}
        />
      )}
    </div>
  );
};

EditGroupModal.displayName = 'EditGroupModal';

export { EditGroupModal };
