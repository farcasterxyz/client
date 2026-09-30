import { KebabHorizontalIcon, MentionIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { ApiDirectCastInboxConversationInfoV3 } from 'farcaster-client-data';
import {
  isVerifiedSender,
  resolveUsernameShort,
  useMarkConversationRead,
  useUnseen,
} from 'farcaster-client-hooks';
import React, { FC } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { VerifiedSenderBadge } from '~/components/directCasts/VerifiedSenderBadge';
import { FollowersYouKnowContent } from '~/components/profiles/headerSections/FollowersYouKnow';
import {
  CacheIgnoringDirectCastConversationProvider,
  DirectCastConversationProvider,
  useDirectCastConversationContext,
} from '~/contexts/ManageDirectCastConversationProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useDirectCastCheckmarks } from '~/hooks/directCasts/useDirectCastCheckmarks';
import { useDirectCastFormattedTimestamp } from '~/hooks/directCasts/useDirectCastFormattedTimestamp';
import { useDirectCastText } from '~/hooks/directCasts/useDirectCastText';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';

import { DirectCastConversationDropdownMenu } from './DirectCastConversationDropdownMenu';
import { GroupConversationImage } from './GroupConversationImage';

type DirectCastListConversationProps = {
  active: boolean;
  conversation: ApiDirectCastInboxConversationInfoV3;
  viewingArchived?: boolean;
  borderStyle?: 'top' | 'bottom' | 'none';
};

export const InboxMutedIcon: React.FC = React.memo(() => {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M18.626 15.166C18.3022 15.4244 6.37669 2.99403 6.11836 2.67024C5.86002 2.34646 5.91308 1.87456 6.23686 1.61622C6.2538 1.60271 6.27081 1.58926 6.2879 1.5759C7.54645 0.591226 9.21083 0 11.0001 0C14.6816 0 18 2.56545 18 6V10.5389C18 11.1805 18.19 11.8078 18.5459 12.3417L19.8741 14.334C20.1039 14.6786 20.0107 15.1443 19.6661 15.374C19.3214 15.6038 18.8558 15.5107 18.626 15.166Z"
        className="fill-tertiary"
      />
      <path
        d="M0.21967 0.21967C0.512563 -0.0732233 0.987437 -0.0732233 1.28033 0.21967L21.7803 20.7197C22.0732 21.0126 22.0732 21.4874 21.7803 21.7803C21.4874 22.0732 21.0126 22.0732 20.7197 21.7803L16.9393 18H14.5H7.5H2.51759C1.67945 18 1 17.3206 1 16.4824C1 16.1828 1.08869 15.8899 1.25488 15.6406L3.45416 12.3417C3.81008 11.8078 4 11.1805 4 10.5389V6C4 5.70608 4.02504 5.41688 4.07334 5.134L0.21967 1.28033C-0.0732233 0.987437 -0.0732233 0.512563 0.21967 0.21967Z"
        className="fill-tertiary"
      />
      <path
        d="M12.0001 22.5C10.4146 22.5 9.07529 21.4457 8.64502 20H15.3551C14.9249 21.4457 13.5856 22.5 12.0001 22.5Z"
        className="fill-tertiary"
      />
    </svg>
  );
});

export const InboxPinnedIcon: React.FC = React.memo(() => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.0745 0.762993C4.19659 0.762993 3.60804 1.66495 3.96161 2.46851L4.45083 3.58038C4.50409 3.7397 4.54493 3.90333 4.57553 4.06899C4.94066 6.0457 3.92176 8.01526 2.90503 9.74932V9.74932C2.45481 10.5597 3.04081 11.5556 3.96788 11.5556L7.67007 11.5556L7.66451 14.8662C7.66451 15.154 7.89781 15.3464 8.18559 15.3464C8.47337 15.3464 8.70667 15.154 8.70667 14.8662L8.71222 11.5556L12.4144 11.5556C13.3415 11.5556 13.9275 10.5597 13.4773 9.74932V9.74932C12.5098 8.013 11.5533 6.07768 11.8143 4.10725C11.8379 3.92852 11.8724 3.75195 11.9204 3.58038L12.4096 2.46851C12.7632 1.66495 12.1746 0.762993 11.2967 0.762994L5.0745 0.762993Z"
        className="fill-tertiary"
      />
    </svg>
  );
});

export const InboxPinnedSlashIcon: React.FC<{ className?: string }> =
  React.memo(({ className }) => {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.35355 0.646447C1.15829 0.451184 0.841709 0.451184 0.646447 0.646447C0.451184 0.841709 0.451184 1.15829 0.646447 1.35355L4.6345 5.34161C4.50406 6.88238 3.70472 8.38848 2.90671 9.74951C2.45649 10.5599 3.04248 11.5558 3.96955 11.5558L7.67174 11.5558L7.66619 14.8664C7.66619 15.1542 7.89948 15.3466 8.18727 15.3466C8.47505 15.3466 8.70834 15.1542 8.70834 14.8664L8.7139 11.5558L10.8487 11.5558L14.6464 15.3536C14.8417 15.5488 15.1583 15.5488 15.3536 15.3536C15.5488 15.1583 15.5488 14.8417 15.3536 14.6464L1.35355 0.646447ZM13.4789 9.74951C13.7302 10.2018 13.6587 10.7119 13.3852 11.0744L3.91796 1.60714C4.07229 1.13152 4.51514 0.763184 5.07617 0.763184H11.2984C12.1763 0.763184 12.7648 1.66514 12.4113 2.4687L11.922 3.58057C11.8741 3.75214 11.8396 3.92871 11.8159 4.10744C11.5549 6.07787 12.5115 8.01319 13.4789 9.74951Z"
          className={classNames('fill-tertiary', className)}
        />
      </svg>
    );
  });

export const InboxPinnedIconEmpty: React.FC<{ className?: string }> =
  React.memo(({ className }) => {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.63607 3.18402C5.62392 3.1477 5.61012 3.11196 5.5947 3.07691L5.12655 2.01294L11.2441 2.01294L10.7759 3.07691C10.7521 3.13112 10.7321 3.18695 10.7162 3.244C10.4711 4.12129 10.5008 5.03138 10.5688 5.72472C10.6036 6.07997 10.6519 6.40714 10.6903 6.66483C10.733 6.95127 10.7542 7.09887 10.7593 7.18458C10.7703 7.37237 10.8236 7.55525 10.9152 7.71958L12.356 10.3056H10V10.305H7V10.3056L4.02759 10.3056L5.52986 7.74342C5.6297 7.57314 5.6878 7.38163 5.69939 7.18458C5.70439 7.09956 5.72287 6.96656 5.75747 6.71746L5.75747 6.71742L5.7665 6.65244C5.80282 6.39063 5.84703 6.06009 5.87504 5.69963C5.92972 4.99604 5.93316 4.07275 5.63607 3.18402ZM12.4141 11.5556C13.3412 11.5556 13.9272 10.5597 13.477 9.74926L12.0071 7.11117C11.9983 6.96137 11.9675 6.75507 11.931 6.50992C11.8156 5.73571 11.6425 4.574 11.9201 3.58033L12.4093 2.46846C12.7629 1.66489 12.1743 0.762939 11.2964 0.762939H5.07422C4.19631 0.762939 3.60776 1.66489 3.96133 2.46846L4.45055 3.58033C4.79097 4.59865 4.62426 5.79345 4.51636 6.56681L4.51635 6.56683C4.48563 6.78706 4.45967 6.97311 4.45155 7.11118L2.90475 9.74926C2.45453 10.5597 3.04053 11.5556 3.9676 11.5556L6.41979 11.5556H7.46194H7.66979L7.66769 12.8056L7.66512 14.3372L7.66424 14.8644L7.66423 14.8661C7.66423 15.1539 7.89753 15.3463 8.18531 15.3463C8.47251 15.3463 8.70544 15.1547 8.70639 14.8679L8.70639 14.8661L8.70727 14.3392L8.71194 11.5573V11.5556H8.91979L12.4141 11.5556Z"
          className={classNames('fill-tertiary', className)}
        />
      </svg>
    );
  });

const DirectCastListConversation: FC<DirectCastListConversationProps> = ({
  active,
  conversation,
  viewingArchived = false,
  borderStyle = 'bottom',
}) => {
  return (
    <DirectCastConversationProvider conversation={conversation}>
      <DirectCastListConversationInner
        active={active}
        viewingArchived={viewingArchived}
        borderStyle={borderStyle}
      />
    </DirectCastConversationProvider>
  );
};

DirectCastListConversation.displayName = 'DirectCastListConversation';

type CacheIgnoringDirectCastListConversationProps = {
  active: boolean;
  conversation: ApiDirectCastInboxConversationInfoV3;
  viewingArchived?: boolean;
  borderStyle?: 'top' | 'bottom' | 'none';
  onClick?: () => void;
  parseMatchedSearchTermsFromLastMessage?: boolean;
};

const CacheIgnoringDirectCastListConversation: FC<
  CacheIgnoringDirectCastListConversationProps
> = ({
  active,
  conversation,
  viewingArchived = false,
  borderStyle = 'bottom',
  onClick,
  parseMatchedSearchTermsFromLastMessage,
}) => {
  return (
    <CacheIgnoringDirectCastConversationProvider conversation={conversation}>
      <DirectCastListConversationInner
        active={active}
        viewingArchived={viewingArchived}
        borderStyle={borderStyle}
        onClick={onClick}
        parseMatchedSearchTermsFromLastMessage={
          parseMatchedSearchTermsFromLastMessage
        }
      />
    </CacheIgnoringDirectCastConversationProvider>
  );
};

const DirectCastListConversationInner: FC<{
  active: boolean;
  viewingArchived: boolean;
  borderStyle: 'top' | 'bottom' | 'none';
  onClick?: undefined | (() => void);
  parseMatchedSearchTermsFromLastMessage?: undefined | boolean;
}> = ({
  active,
  viewingArchived,
  borderStyle,
  onClick: onClickParam,
  parseMatchedSearchTermsFromLastMessage,
}) => {
  const { conversation, prefetch: prefetchConversation } =
    useDirectCastConversationContext() as {
      conversation: ApiDirectCastInboxConversationInfoV3;
      prefetch: () => void;
    };

  const navigateToDirectCastsConversation =
    useNavigateToDirectCastsConversation();

  const { fid } = useCurrentUser();
  const markConversationRead = useMarkConversationRead();
  const { decreaseInboxCount } = useUnseen();
  const mostRecentDirectCast = conversation.lastMessage;

  const checkmarks = useDirectCastCheckmarks({
    directCast: mostRecentDirectCast,
    conversation,
    applyInboxStyles: true,
  });

  const verifiedSender = React.useMemo(
    () =>
      typeof conversation.viewerContext.counterParty !== 'undefined' &&
      isVerifiedSender({
        conversationCounterPartyFid:
          conversation.viewerContext.counterParty.fid,
      }),
    [conversation],
  );

  const unreadReactionMessage = React.useMemo(() => {
    const reactionMessage = conversation.viewerContext.unreadReactionMessage;
    return typeof reactionMessage !== 'undefined' &&
      reactionMessage.timestamp > conversation.viewerContext.lastReadAt
      ? reactionMessage
      : undefined;
  }, [
    conversation.viewerContext.lastReadAt,
    conversation.viewerContext.unreadReactionMessage,
  ]);

  const unreadCount = conversation.viewerContext.unreadCount;
  const hasUnread =
    unreadCount > 0 || typeof unreadReactionMessage !== 'undefined';
  const hasUnreadMessages = unreadCount > 0;
  const formattedUnreadCount = unreadCount >= 99 ? '99+' : unreadCount;

  const formattedTimestamp = useDirectCastFormattedTimestamp({
    selfDirectCast: mostRecentDirectCast?.senderFid === fid,
    timestamp: mostRecentDirectCast
      ? mostRecentDirectCast.serverTimestamp
      : conversation.createdAt,
    hasUnread: hasUnread && conversation.viewerContext.category !== 'archived',
    applyInboxStyles: true,
    muted:
      conversation.viewerContext.muted ||
      conversation.viewerContext.category === 'request',
  });

  const { text } = useDirectCastText({
    conversation: conversation,
    directCast: mostRecentDirectCast,
    applyInboxStyles: true,
    parseMatchedSearchTermsFromLastMessage,
  });

  const manuallyMarkedUnread = conversation.viewerContext.manuallyMarkedUnread;
  const skipShowingUnreadMarkers = active && !manuallyMarkedUnread;
  const markAsArchived =
    conversation.viewerContext.category === 'archived' && !viewingArchived;
  const groupConversation = conversation.isGroup;
  const counterPartyUser = !groupConversation
    ? conversation.viewerContext.counterParty
    : undefined;
  const name = conversation.name
    ? conversation.name
    : typeof counterPartyUser !== 'undefined'
      ? resolveUsernameShort(counterPartyUser)
      : '';

  const isUnread = unreadCount > 0 || manuallyMarkedUnread;

  // there is no way to programmatically close a Menu when a user stops
  // hovering on a conversation, use a counter to reset component on leave as a
  // hack
  const [dropdownIsOpen, setDropdownIsOpen] = React.useState(false);

  const onClick = React.useCallback(() => {
    if (onClickParam) {
      onClickParam();
      return;
    }

    // We are not going to call the API since it could have unintended consequences
    // with convo loading to fail etc. But we are going to optimistically the read state.
    markConversationRead({
      conversationId: conversation.conversationId,
      fid,
      enabled: false,
    });

    if (!conversation.viewerContext.muted && isUnread) {
      decreaseInboxCount();
    }

    navigateToDirectCastsConversation({
      conversationId: conversation.conversationId,
    });
  }, [
    onClickParam,
    conversation.conversationId,
    navigateToDirectCastsConversation,
    fid,
    markConversationRead,
    conversation.viewerContext.muted,
    decreaseInboxCount,
    isUnread,
  ]);

  const counterPartyIsProUser =
    useUserLevel(counterPartyUser) === 'pro' && !groupConversation;

  return (
    <div
      className={classNames(
        'group flex cursor-pointer select-none flex-row px-[12px] text-default hover:bg-overlay-faint',
        active && 'bg-unread-direct-cast',
      )}
      onClick={onClick}
      onMouseOver={prefetchConversation}
    >
      <div className="py-[8px] pr-[8px]">
        {!groupConversation ? (
          typeof counterPartyUser !== 'undefined' && (
            <Avatar user={counterPartyUser} size="lg" />
          )
        ) : (
          <GroupConversationImage
            size={'lg'}
            imageURL={conversation.photoUrl}
          />
        )}
      </div>
      <div
        className={classNames(
          borderStyle === 'top' && 'border-t',
          borderStyle === 'bottom' && 'border-b',
          borderStyle === 'none' && 'border-none',
          'relative flex w-full min-w-0 flex-col justify-start py-[8px] border-default',
        )}
      >
        <div className="relative flex flex-row items-center justify-between">
          <div className="mr-1 min-w-0 truncate break-words text-[15px] font-semibold text-default">
            {verifiedSender ? (
              <div className="flex flex-row items-center gap-2">
                <div>{name}</div>
                <div className="mt-[-2px]">
                  <VerifiedSenderBadge />
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-1">
                <div>{name}</div>
                {counterPartyIsProUser && <FarcasterProBadge size={20} />}
              </div>
            )}
          </div>
          <div>
            <div
              className={classNames(
                'mt-[1px] flex min-w-0 flex-shrink-0 text-right text-sm',
                dropdownIsOpen
                  ? 'hidden'
                  : 'group-focus-within:hidden group-hover:opacity-0',
              )}
            >
              {formattedTimestamp}
            </div>
            <div
              className={classNames(
                dropdownIsOpen
                  ? 'block'
                  : 'hidden group-focus-within:block group-hover:block',
              )}
            >
              <div className="absolute right-0 top-0 z-10 mt-[-1.75px] size-6">
                <DirectCastConversationDropdownMenu
                  onOpenChange={setDropdownIsOpen}
                  trigger={
                    <div className="flex items-center justify-center rounded-full border p-1 bg-app border-default">
                      <KebabHorizontalIcon size={16} className="px-0.5" />
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
        {conversation.viewerContext.category !== 'request' && (
          <div className="relative flex min-h-4 flex-row items-center justify-between">
            <div
              className={classNames(
                'line-clamp-2 text-[14px] leading-[18px] text-muted break-gracefully',
              )}
            >
              {text}
            </div>
            <div
              className={classNames(
                'mb-1 ml-2 flex flex-row items-center space-x-[8px] self-end',
                dropdownIsOpen
                  ? 'invisible'
                  : 'group-focus-within:invisible group-hover:invisible',
              )}
            >
              {conversation.viewerContext.pinned && <InboxPinnedIcon />}
              {conversation.viewerContext.muted && <InboxMutedIcon />}
              {conversation.viewerContext.unreadMentionsCount !== 0 && (
                <div
                  className={classNames(
                    'shadow-xs flex h-[16px] w-[16px] flex-col items-center justify-center rounded-full text-xs font-normal text-light',
                    active ? 'opacity-0' : 'opacity-100',
                    conversation.viewerContext.muted ? 'bg-muted' : 'bg-action',
                  )}
                >
                  <MentionIcon size={10} />
                </div>
              )}
              {markAsArchived ? (
                <div className="shadow-xs flex h-4 min-w-4 flex-col items-center justify-center rounded bg-muted px-1 text-xs font-normal text-light">
                  Archived
                </div>
              ) : (
                <>
                  {hasUnreadMessages ? (
                    <div
                      className={classNames(
                        'shadow-xs flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-[12px] font-normal text-light',
                        skipShowingUnreadMarkers ? 'opacity-0' : 'opacity-100',
                        formattedUnreadCount !== '99+'
                          ? 'aspect-square p-3'
                          : 'px-1.5',
                        conversation.viewerContext.muted
                          ? 'bg-muted'
                          : 'bg-action',
                      )}
                    >
                      {formattedUnreadCount}
                    </div>
                  ) : (
                    <>
                      {typeof unreadReactionMessage !== 'undefined' ||
                      manuallyMarkedUnread ? (
                        <div
                          className={classNames(
                            'shadow-xs flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full px-[3.25px] text-sm font-normal text-light',
                            skipShowingUnreadMarkers
                              ? 'opacity-0'
                              : 'opacity-100',
                            conversation.viewerContext.muted
                              ? 'ml-1 bg-muted'
                              : 'bg-action',
                          )}
                        />
                      ) : (
                        !conversation.viewerContext.pinned &&
                        !conversation.viewerContext.muted &&
                        conversation.viewerContext.unreadMentionsCount ===
                          0 && <>{checkmarks}</>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        <div>
          {conversation.viewerContext.category === 'request' && (
            <>
              <div
                className={classNames(
                  'line-clamp-2 text-[14px] leading-[18px] text-muted break-gracefully',
                )}
              >
                {text}
              </div>
              {counterPartyUser &&
                counterPartyUser.viewerContext?.followersYouKnow && (
                  <div
                    className={classNames(
                      'mt-[6px] flex flex-row items-center',
                      counterPartyUser.viewerContext.followersYouKnow
                        .totalCount === 0
                        ? 'justify-end'
                        : 'justify-between',
                    )}
                  >
                    <FollowersYouKnowContent
                      users={
                        counterPartyUser.viewerContext.followersYouKnow.users
                      }
                      totalCount={
                        counterPartyUser.viewerContext.followersYouKnow
                          .totalCount
                      }
                      variant="condensed"
                    />
                    {typeof conversation.viewerContext.tag !== 'undefined' && (
                      <div className="rounded-10 w-max border bg-[#F3F3F3] px-2 py-1 text-xs border-default text-default dark:bg-[#302636]">
                        {conversation.viewerContext.tag === 'automated' &&
                          'Automated'}
                        {conversation.viewerContext.tag === 'new-user' &&
                          'New user'}
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

CacheIgnoringDirectCastListConversation.displayName =
  'CacheIgnoringDirectCastListConversation';

export { CacheIgnoringDirectCastListConversation, DirectCastListConversation };
