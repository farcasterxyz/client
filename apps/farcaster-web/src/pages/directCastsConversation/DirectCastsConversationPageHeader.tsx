import { ArrowLeftIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useDirectCastConversation,
  useUnpinDirectCastMessage,
} from 'farcaster-client-hooks';
import React, { useState } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { DirectCastAvatar } from '~/components/directCasts/DirectCastAvatar';
import {
  InboxMutedIcon,
  InboxPinnedIcon,
  InboxPinnedSlashIcon,
} from '~/components/directCasts/DirectCastListConversation';
import { GroupConversationImage } from '~/components/directCasts/GroupConversationImage';
import { VerifiedSenderBadge } from '~/components/directCasts/VerifiedSenderBadge';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { ManageGroupModal } from '~/components/modals/ManageGroupModal';
import { PageHeader } from '~/components/page/PageHeader';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';

import { DirectCastsConversationActions } from './DirectCastsConversationActions';

type DirectCastsConversationPageHeaderProps = {
  conversationId: string;
  counterParties: ApiUser[];
  archived: boolean;
  verifiedSender: boolean;
  onPinnedMessageClick: ({ messageId }: { messageId: string }) => void;
};

const DirectCastsConversationPageHeader: React.FC<
  DirectCastsConversationPageHeaderProps
> = ({
  counterParties,
  conversationId,
  archived,
  verifiedSender,
  onPinnedMessageClick,
}) => {
  const { fid: currentUserFid } = useCurrentUser();

  const { data: conversation } = useDirectCastConversation({
    conversationId,
  });

  const { trackEvent } = useAnalytics();

  const unpinDirectCastMessage = useUnpinDirectCastMessage();

  const navigateToInbox = useNavigateToDirectCastsInbox();

  const [showManageUsersModal, setShowManageUsersModal] = useState(false);

  const participantsLookup = React.useMemo(() => {
    const lookup: { [fid: number]: ApiUser } = {};
    for (const participant of conversation?.participants ?? []) {
      lookup[participant.fid] = participant;
    }
    return lookup;
  }, [conversation?.participants]);

  const groupConversation = React.useMemo(() => {
    return conversation?.isGroup;
  }, [conversation?.isGroup]);

  const conversationPinnedMessage = React.useMemo(() => {
    if (conversation?.pinnedMessages.length === 0) {
      return undefined;
    }

    return conversation?.pinnedMessages[0];
  }, [conversation?.pinnedMessages]);

  const replyDirectCastDisplayName = React.useMemo(() => {
    if (typeof conversationPinnedMessage === 'undefined') {
      return '';
    }

    const { senderFid } = conversationPinnedMessage;

    return senderFid === currentUserFid
      ? 'You'
      : typeof participantsLookup[senderFid] !== 'undefined'
        ? participantsLookup[senderFid].displayName
        : '';
  }, [conversationPinnedMessage, currentUserFid, participantsLookup]);

  const [showManageGroupModal, setShowManageGroupModal] = useState(false);

  const toggleExpandedPinnedMessage = React.useCallback(() => {
    if (typeof conversationPinnedMessage === 'undefined') {
      return;
    }

    onPinnedMessageClick({ messageId: conversationPinnedMessage.messageId });
  }, [conversationPinnedMessage, onPinnedMessageClick]);

  const onUnpinClick = React.useCallback(() => {
    if (typeof conversationPinnedMessage === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.UnpinDirectCastMessage, {});

    unpinDirectCastMessage({
      conversationId,
      message: conversationPinnedMessage,
      fid: currentUserFid,
    });
  }, [
    conversationId,
    conversationPinnedMessage,
    currentUserFid,
    trackEvent,
    unpinDirectCastMessage,
  ]);

  const shouldDisplayPinnedMessages = React.useMemo(() => {
    return (
      typeof conversationPinnedMessage !== 'undefined' &&
      conversation?.hasPinnedMessages
    );
  }, [conversation?.hasPinnedMessages, conversationPinnedMessage]);

  const canUnpinMessagesInConversation = React.useMemo(() => {
    return (
      conversation?.isGroup && conversation?.viewerContext.access === 'admin'
    );
  }, [conversation?.isGroup, conversation?.viewerContext.access]);

  const numMembers = React.useMemo(() => {
    return (
      (conversation?.participants?.length ?? 0) -
      (conversation?.removedFids?.length ?? 0)
    );
  }, [conversation?.participants, conversation?.removedFids]);

  const counterPartyIsProUser =
    useUserLevel(counterParties[0]) === 'pro' && !groupConversation;

  return (
    <div className="flex w-full flex-col justify-center border-b bg-app border-default">
      <PageHeader
        hideCastButton={true}
        hideBorderBottom={true}
        visibleOnMobile={true}
      >
        <div className="w-full">
          <div className="flex w-full flex-row">
            <div
              className="mr-1 flex cursor-pointer flex-col items-center justify-center rounded-full p-2 hover:bg-overlay-faint lg:hidden"
              onClick={navigateToInbox}
            >
              <ArrowLeftIcon size={24} />
            </div>
            <div className="flex flex-col justify-center space-x-2">
              {!groupConversation ? (
                <DirectCastAvatar
                  user={counterParties[0]}
                  className=""
                  size={'sm'}
                />
              ) : (
                <GroupConversationImage
                  size={'sm'}
                  imageURL={conversation?.photoUrl}
                />
              )}
            </div>
            <div className="flex grow flex-col justify-around pl-2">
              {conversation?.name === undefined &&
                counterParties.length === 1 && (
                  <LinkToProfileWithSummaryTooltip
                    title={resolveUsernameShort(counterParties[0])}
                    user={counterParties[0]}
                    className="items-left flex flex-col justify-center"
                  >
                    {verifiedSender ? (
                      <span className="flex flex-row items-center gap-2">
                        <span className="block min-w-0 truncate break-words text-lg font-bold leading-5 text-default">
                          {resolveUsernameShort(counterParties[0])}
                        </span>
                        <div className="mt-[-2px]">
                          <VerifiedSenderBadge />
                        </div>
                      </span>
                    ) : (
                      <span className="flex flex-row items-center gap-1">
                        <span className="block min-w-0 truncate break-words text-lg font-bold leading-5 text-default">
                          {resolveUsernameShort(counterParties[0])}
                        </span>
                        {counterPartyIsProUser && (
                          <FarcasterProBadge size={20} />
                        )}
                      </span>
                    )}
                    {counterParties[0].username && (
                      <div className="text-xs text-faint">
                        {verifiedSender && 'Official Farcaster account'}
                      </div>
                    )}
                  </LinkToProfileWithSummaryTooltip>
                )}
              {(conversation?.name !== undefined ||
                counterParties.length > 1) && (
                <div className="flex grow flex-col justify-around">
                  <span className="flex flex-row items-center truncate break-words text-base font-bold text-default">
                    {conversation?.name ?? 'Group '}{' '}
                    {conversation?.viewerContext.muted && (
                      <span className="ml-2">
                        <InboxMutedIcon />
                      </span>
                    )}
                  </span>
                  <span
                    className="mr-1 line-clamp-1 cursor-pointer text-xs break-gracefully text-faint hover:underline"
                    onClick={() => setShowManageGroupModal(true)}
                  >
                    {typeof conversation?.description !== 'undefined' &&
                    conversation?.description !== ''
                      ? conversation?.description
                      : `${numMembers} members`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-around">
              <div className="right flex flex-col">
                {conversation?.viewerContext.category !== 'request' && (
                  <DirectCastsConversationActions
                    archived={archived}
                    setShowManageUsersModal={setShowManageUsersModal}
                    showManageUsersModal={showManageUsersModal}
                    conversation={conversation!}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </PageHeader>
      {showManageGroupModal && (
        <ManageGroupModal
          onClose={() => {
            setShowManageGroupModal(false);
          }}
        />
      )}
      {shouldDisplayPinnedMessages &&
        typeof conversationPinnedMessage !== 'undefined' && (
          <div className="flex flex-row border-t bg-[#f3f3f3] px-4 py-2 border-default dark:bg-[#302636]">
            <div className="flex grow flex-col">
              <div className="text-sm font-semibold text-direct-casts-username">
                {replyDirectCastDisplayName}
              </div>
              <div
                className={classNames(
                  'line-clamp-2 cursor-pointer text-sm break-gracefully text-default',
                )}
                onClick={toggleExpandedPinnedMessage}
              >
                {conversationPinnedMessage.message}
              </div>
            </div>
            {canUnpinMessagesInConversation ? (
              <div
                className="group ml-4 mt-1 cursor-pointer items-center self-start rounded"
                onClick={onUnpinClick}
              >
                <InboxPinnedSlashIcon />
              </div>
            ) : (
              <div className="group ml-4 mt-1 cursor-pointer items-center self-start rounded">
                <InboxPinnedIcon />
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export { DirectCastsConversationPageHeader };
