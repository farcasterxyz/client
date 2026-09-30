import { ApiDirectCastMessageMetadata } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  useNonSuspenseSearchUsers,
  useSendDirectCast,
} from 'farcaster-client-hooks';
import { generateMessageId } from 'farcaster-cryptography';
import { CheckIcon, CopyIcon } from 'lucide-react';
import React from 'react';

import {
  type DirectCastTarget,
  SearchForDirectCastTargets,
} from '~/components/directCasts/SearchForDirectCastTargets';
import { TextInput } from '~/components/forms/TextInput';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { MAX_DIRECT_CAST_TEXT_LENGTH } from '~/constants/casts';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { toast } from '~/utils/toast';

const MAX_NUM_SELECTED_TARGETS = 12;

function getSpaceInviteUrl(roomId: string) {
  return `https://farcaster.xyz/~/spaces/${roomId}`;
}

type InviteToSpaceModalProps = {
  roomId: string;
  roomTitle?: string;
  onClose: () => void;
  onInviteSent?: (count: number) => void;
  onCopyLink?: () => void;
};

const InviteToSpaceModal: React.FC<InviteToSpaceModalProps> = React.memo(
  ({ roomId, roomTitle, onClose, onInviteSent, onCopyLink }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent>
            <DefaultModalHeader title="Share Space" onClose={onClose} />
            <React.Suspense
              fallback={
                <span className="flex size-full flex-row items-center justify-center py-8">
                  <LoadingIndicator />
                </span>
              }
            >
              <InviteToSpaceModalContent
                roomId={roomId}
                roomTitle={roomTitle}
                onClose={onClose}
                onInviteSent={onInviteSent}
                onCopyLink={onCopyLink}
              />
            </React.Suspense>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

type InviteToSpaceModalContentProps = {
  roomId: string;
  roomTitle?: string;
  onClose: () => void;
  onInviteSent?: (count: number) => void;
  onCopyLink?: () => void;
};

const InviteToSpaceModalContent: React.FC<InviteToSpaceModalContentProps> = ({
  roomId,
  roomTitle,
  onClose,
  onInviteSent,
  onCopyLink,
}) => {
  const [selectedTargets, setSelectedTargets] = React.useState<
    DirectCastTarget[]
  >([]);
  const [query, setQuery] = React.useState('');
  const [directCastMessage, setDirectCastMessage] = React.useState('');
  const [copiedLink, setCopiedLink] = React.useState(false);

  const sendDirectCast = useSendDirectCast();
  const currentUser = useCurrentUser();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const {
    data: searchedResults,
    onEndReached,
    isFetchingNextPage,
  } = useNonSuspenseSearchUsers({
    q: query,
    excludeSelf: true,
    includeDirectCastAbility: true,
  });

  const combinedResults = React.useMemo<DirectCastTarget[]>(() => {
    const searchedUsers =
      searchedResults?.pages.flatMap(({ result: { users } }) => users) || [];
    const dedupedUsers = searchedUsers.filter(
      (user, index, arr) =>
        arr.findIndex((candidate) => candidate.fid === user.fid) === index,
    );
    return dedupedUsers.map((user) => ({ type: 'user', content: user }));
  }, [searchedResults]);
  const spaceUrl = React.useMemo(() => getSpaceInviteUrl(roomId), [roomId]);
  const messageInputMaxLength = React.useMemo(() => {
    const urlLength = spaceUrl.length;
    // Outgoing payload is "<spaceUrl> <optionalMessage>".
    return Math.max(0, MAX_DIRECT_CAST_TEXT_LENGTH - urlLength - 1);
  }, [spaceUrl]);

  const onCopyLinkClick = React.useCallback(() => {
    const writePromise = navigator.clipboard?.writeText(spaceUrl);
    if (!writePromise) {
      toast({ message: 'Unable to copy link', type: 'error' });
      return;
    }

    writePromise
      .then(() => {
        setCopiedLink(true);
        onCopyLink?.();
        toast({ message: 'Link copied', type: 'success' });
        setTimeout(() => setCopiedLink(false), 3000);
      })
      .catch(() => toast({ message: 'Unable to copy link', type: 'error' }));
  }, [onCopyLink, spaceUrl]);

  const onSendPress = React.useCallback(() => {
    if (selectedTargets.length === 0) {
      return;
    }

    const cappedSelectedTargets = selectedTargets
      .filter(
        (target): target is Extract<DirectCastTarget, { type: 'user' }> =>
          target.type === 'user',
      )
      .slice(0, MAX_NUM_SELECTED_TARGETS);

    const trimmedMessage = directCastMessage.trim();
    const message =
      trimmedMessage.length > 0 ? `${spaceUrl} ${trimmedMessage}` : spaceUrl;
    const optimisticMetadata: ApiDirectCastMessageMetadata = {
      urls: [
        {
          type: 'url',
          openGraph: {
            url: spaceUrl,
            sourceUrl: spaceUrl,
            domain: 'farcaster.xyz',
            title: roomTitle || 'Farcaster Space',
          },
        },
      ],
    };

    const messageSenderContext = {
      displayName: currentUser.displayName,
      fid: currentUser.fid,
      pfp: currentUser.pfp,
      username: currentUser.username,
    };

    onClose();

    void Promise.allSettled(
      cappedSelectedTargets.map(async (target) => {
        const { error } = await sendDirectCast({
          data: {
            conversationId: buildNonGroupConversationId({
              participantFids: [target.content.fid, currentUser.fid],
            }),
            fid: currentUser.fid,
            recipientFids: [target.content.fid],
            messageId: generateMessageId(),
            message,
            type: 'text',
            conversationCategory: 'default',
            optimisticMetadata,
            senderContext: messageSenderContext,
          },
        });
        if (error) {
          throw error;
        }
      }),
    ).then((sendResults) => {
      const sentCount = sendResults.filter(
        (result) => result.status === 'fulfilled',
      ).length;
      const failedCount = sendResults.length - sentCount;

      if (sentCount > 0) {
        onInviteSent?.(sentCount);
        toast({
          message:
            failedCount === 0
              ? sentCount === 1
                ? 'Direct cast sent'
                : 'Direct casts sent'
              : `Sent ${sentCount} of ${sendResults.length} invites`,
          type: failedCount === 0 ? 'success' : 'info',
        });
      }

      if (failedCount > 0 && sentCount === 0) {
        toast({
          message: 'Failed to send invites',
          type: 'error',
        });
      }
    });
  }, [
    currentUser.displayName,
    currentUser.fid,
    currentUser.pfp,
    currentUser.username,
    directCastMessage,
    onClose,
    onInviteSent,
    roomTitle,
    selectedTargets,
    sendDirectCast,
    spaceUrl,
  ]);

  return (
    <div className="flex size-full flex-col justify-between overflow-hidden">
      <div className="px-4 pb-2 text-sm text-faint">
        Send the Space link via direct cast or copy it.
        {roomTitle ? ` (${roomTitle})` : ''}
      </div>
      <SearchForDirectCastTargets
        onSelectionChanged={setSelectedTargets}
        searchInputRef={searchInputRef}
        results={combinedResults}
        showEmptyResultsView={true}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        onQueryStringChange={setQuery}
        maxNumSelectedTargets={MAX_NUM_SELECTED_TARGETS}
      />
      <div className="flex flex-col gap-y-4 rounded-b-md border-t p-[16px] bg-app border-default">
        {selectedTargets.length !== 0 && (
          <TextInput
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              setDirectCastMessage(e.target.value);
            }}
            maxLength={messageInputMaxLength}
            value={directCastMessage}
            autoFocus={true}
            placeholder={'Add a message (optional)...'}
            className="focus:outline-hidden border px-[12px] py-[10px] border-faint"
          />
        )}
        <DefaultModalActionButtons
          isLoading={false}
          isPrimaryButtonDisabled={selectedTargets.length === 0}
          onSecondaryButtonClick={onCopyLinkClick}
          onPrimaryButtonClick={onSendPress}
          secondaryButtonLabel={
            <span className="flex flex-row items-center gap-x-1">
              {copiedLink ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
            </span>
          }
          primaryButtonLabel={
            selectedTargets.length === 0
              ? 'Select users'
              : selectedTargets.length > 1
                ? 'Send direct casts'
                : 'Send direct cast'
          }
        />
      </div>
    </div>
  );
};

InviteToSpaceModal.displayName = 'InviteToSpaceModal';

export { getSpaceInviteUrl, InviteToSpaceModal };
