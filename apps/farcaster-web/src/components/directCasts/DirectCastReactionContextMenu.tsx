import {
  CopyIcon,
  EyeClosedIcon,
  ReplyIcon,
  SmileyIcon,
  TrashIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import type {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import {
  useAddReactionToPlaintextDirectCast,
  useDeleteDirectCastMessage,
  usePinDirectCastMessage,
  useRemoveReactionFromPlaintextDirectCast,
  useUnpinDirectCastMessage,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { DirectCastReactionsModal } from '~/components/modals/DirectCastReactionsModal';
import { EmojiPickerPopover } from '~/components/popovers/EmojiPickerPopover';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDirectCastToTakeAction } from '~/contexts/DirectCastToTakeActionProvider';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

import {
  InboxPinnedIconEmpty,
  InboxPinnedSlashIcon,
} from './DirectCastListConversation';
import { ReactionEmoji } from './ReactionEmoji';

interface DirectCastReactionContextMenuProps {
  open: boolean;
  children: React.ReactNode;
  directCast: ApiDirectCastMessageV3;
  conversation: ApiDirectCastConversationInfoV3;
  setReplyTo: (replyTo: ApiDirectCastMessageV3) => void;
  onClose: () => void;
  mode: 'emoji-reactions-only' | 'default';
  /** When set, shows “Hide link preview” to collapse the URL card for this viewer only. */
  hideUrlPreviewForViewer?: () => void;
}

const DirectCastReactionContextMenu: React.FC<
  DirectCastReactionContextMenuProps
> = ({
  open,
  children,
  directCast,
  conversation,
  setReplyTo,
  onClose,
  mode,
  hideUrlPreviewForViewer,
}) => {
  const [hidden, setHidden] = useState(false);
  const [dropdownMenuIsOpen, setDropdownMenuIsOpen] = useState(false);
  const root = document.getElementById('root');

  useEffect(() => {
    setDropdownMenuIsOpen(open);
    setHidden(!open);
  }, [open]);

  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showReplaceExistingPinModal, setShowReplaceExistingPinModal] =
    React.useState(false);

  const currentUserFid = useCachedCurrentUser()?.fid;
  const { addToRecentReactions } = useDirectCastToTakeAction();
  const addReactionToDirectCast = useAddReactionToPlaintextDirectCast();
  const removeDirectCastReaction = useRemoveReactionFromPlaintextDirectCast();
  const pinDirectCastMessage = usePinDirectCastMessage();
  const unpinDirectCastMessage = useUnpinDirectCastMessage();
  const deleteDirectCastMessage = useDeleteDirectCastMessage();

  const { trackEvent } = useAnalytics();

  const pinMessage = React.useCallback(
    async ({ message }: { message: ApiDirectCastMessageV3 }) => {
      trackEvent(AnalyticsEvent.PinDirectCastMessage, {});

      void pinDirectCastMessage({
        conversationId: conversation.conversationId,
        message,
      });
    },
    [conversation.conversationId, pinDirectCastMessage, trackEvent],
  );

  const unpinMessage = React.useCallback(
    async ({ message }: { message: ApiDirectCastMessageV3 }) => {
      trackEvent(AnalyticsEvent.UnpinDirectCastMessage, {});

      void unpinDirectCastMessage({
        fid: currentUserFid || 0,
        conversationId: conversation.conversationId,
        message,
      });
    },
    [
      conversation.conversationId,
      currentUserFid,
      trackEvent,
      unpinDirectCastMessage,
    ],
  );

  const canPinMessagesInConversation = React.useMemo(() => {
    return (
      conversation.isGroup &&
      conversation.viewerContext.access === 'admin' &&
      !directCast.isDeleted
    );
  }, [
    conversation.isGroup,
    conversation.viewerContext.access,
    directCast.isDeleted,
  ]);

  const deleteMessage = React.useCallback(
    async ({ message }: { message: ApiDirectCastMessageV3 }) => {
      if (
        conversation.isGroup &&
        conversation.viewerContext.access !== 'admin' &&
        message.senderFid !== currentUserFid
      ) {
        return;
      }

      if (!conversation.isGroup && message.senderFid !== currentUserFid) {
        return;
      }

      setShowConfirmDeleteModal(true);
    },
    [conversation.isGroup, conversation.viewerContext.access, currentUserFid],
  );

  const canDeleteMessage = React.useMemo(() => {
    if (conversation.isGroup) {
      return (
        (conversation.viewerContext.access === 'admin' ||
          directCast.senderFid === currentUserFid) &&
        !directCast.isDeleted
      );
    }
    return directCast.senderFid === currentUserFid && !directCast.isDeleted;
  }, [
    conversation.isGroup,
    conversation.viewerContext.access,
    currentUserFid,
    directCast.isDeleted,
    directCast.senderFid,
  ]);

  const usedEmojiSet = useMemo(() => {
    return new Set(directCast.viewerContext?.reactions);
  }, [directCast.viewerContext?.reactions]);

  const selection = window.getSelection();
  const selectedText = selection?.toString();
  const textToCopy = selectedText ? selectedText : directCast.message;
  const copyToClipboard = React.useCallback(() => {
    navigator.clipboard.writeText(textToCopy);
  }, [textToCopy]);

  const handleEmojiPick = (emoji: string) => {
    if (usedEmojiSet.has(emoji)) {
      removeDirectCastReaction({
        fid: currentUserFid || 0,
        conversationId: directCast.conversationId,
        messageId: directCast.messageId,
        reaction: emoji,
      });
    } else {
      addReactionToDirectCast({
        fid: currentUserFid || 0,
        conversationId: directCast.conversationId,
        messageId: directCast.messageId,
        reaction: emoji,
      });
      addToRecentReactions(emoji);
    }
  };

  const selfDirectCast = React.useMemo(() => {
    return currentUserFid === directCast.senderFid;
  }, [currentUserFid, directCast.senderFid]);

  return (
    <>
      <DropdownMenu.Root
        open={dropdownMenuIsOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DropdownMenu.Trigger
          asChild
          className={classNames(
            'flex',
            selfDirectCast ? 'justify-end' : 'justify-start',
          )}
        >
          <div>{children}</div>
        </DropdownMenu.Trigger>
        {mode === 'emoji-reactions-only' && (
          <DropdownMenu.Portal container={root}>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              className={classNames(
                hidden ? 'opacity-0' : '',
                'outline-hidden z-20 rounded-md border shadow-lg bg-app border-default',
              )}
            >
              <Popover.Root open={dropdownMenuIsOpen}>
                <Popover.Trigger asChild>
                  <div />
                </Popover.Trigger>
                {root &&
                  ReactDOM.createPortal(
                    <Popover.Content
                      style={{
                        marginTop: '-71px',
                        pointerEvents: 'auto',
                        outline: 'none',
                        zIndex: 1,
                      }}
                    >
                      <EmojiPickerBar
                        usedEmojiSet={usedEmojiSet}
                        onEmojiPick={(emoji, source) => {
                          handleEmojiPick(emoji);
                          if (source === 'quick-react') {
                            onClose();
                          }
                        }}
                        onEmojiPickerOpenChange={(open) => {
                          setHidden(open);
                        }}
                      />
                    </Popover.Content>,
                    root,
                  )}
              </Popover.Root>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
        {mode === 'default' && (
          <DropdownMenu.Portal container={root}>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              className={classNames(
                hidden ? 'opacity-0' : '',
                'outline-hidden z-20 min-w-[196px] rounded-md border shadow-lg bg-app border-default',
              )}
            >
              <Popover.Root open={dropdownMenuIsOpen}>
                <Popover.Trigger asChild>
                  <div />
                </Popover.Trigger>
                {root &&
                  ReactDOM.createPortal(
                    <Popover.Content
                      style={{
                        marginTop: '-71px',
                        pointerEvents: 'auto',
                        outline: 'none',
                      }}
                    >
                      <EmojiPickerBar
                        usedEmojiSet={usedEmojiSet}
                        onEmojiPick={(emoji, source) => {
                          handleEmojiPick(emoji);
                          if (source === 'quick-react') {
                            onClose();
                          }
                        }}
                        onEmojiPickerOpenChange={(open) => {
                          setHidden(open);
                        }}
                      />
                    </Popover.Content>,
                    root,
                  )}
              </Popover.Root>
              <DropdownMenuItem
                name="Reply"
                icon={<ReplyIcon size="small" />}
                onSelect={() => setReplyTo(directCast)}
              />
              <DropdownMenuItem
                name={selectedText ? 'Copy selected' : 'Copy'}
                icon={<CopyIcon size="small" />}
                onSelect={copyToClipboard}
              />
              {typeof hideUrlPreviewForViewer !== 'undefined' && (
                <DropdownMenuItem
                  name="Hide link preview"
                  icon={<EyeClosedIcon size="small" />}
                  onSelect={() => {
                    hideUrlPreviewForViewer();
                    onClose();
                  }}
                />
              )}
              {directCast.reactions.length !== 0 && (
                <DropdownMenuItem
                  name="Reactions"
                  icon={<SmileyIcon size="small" />}
                  onSelect={() => setShowReactionsModal(true)}
                />
              )}
              {canPinMessagesInConversation && (
                <DropdownMenuItem
                  name={directCast.isPinned ? 'Unpin' : 'Pin'}
                  icon={
                    directCast.isPinned ? (
                      <InboxPinnedSlashIcon className="!fill-[#24292e] dark:!fill-white" />
                    ) : (
                      <InboxPinnedIconEmpty className="!fill-[#24292e] dark:!fill-white" />
                    )
                  }
                  onSelect={() => {
                    if (directCast.isPinned) {
                      unpinMessage({ message: directCast });
                    } else if (conversation.pinnedMessages.length !== 0) {
                      setShowReplaceExistingPinModal(true);
                    } else {
                      pinMessage({ message: directCast });
                    }
                  }}
                />
              )}
              {canDeleteMessage && (
                <DropdownMenuItem
                  name="Delete"
                  icon={<TrashIcon size="small" />}
                  destructive
                  onSelect={() => deleteMessage({ message: directCast })}
                />
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </DropdownMenu.Root>
      {showReactionsModal && (
        <React.Suspense fallback={<></>}>
          <DirectCastReactionsModal
            onClose={() => setShowReactionsModal(false)}
            directCast={directCast}
            conversation={conversation}
          />
        </React.Suspense>
      )}
      {showReplaceExistingPinModal && (
        <ConfirmationModal
          onCancel={() => {
            setShowReplaceExistingPinModal(false);
          }}
          onConfirm={() => {
            pinMessage({ message: directCast });
          }}
          title="Replace pinned message"
          confirmText="Replace"
        />
      )}
      {showConfirmDeleteModal && (
        <ConfirmationModal
          onCancel={() => {
            setShowConfirmDeleteModal(false);
          }}
          onConfirm={() => {
            void deleteDirectCastMessage({
              conversationId: conversation.conversationId,
              messageId: directCast.messageId,
            });

            setShowConfirmDeleteModal(false);
          }}
          title="Delete message for everyone"
          body="Are you sure you want to permanently delete this message? This action cannot be undone."
          confirmText="Delete"
          icon={({ size }) => <TrashIcon size={size} />}
          destructive
          hideAreYouSure
        />
      )}
    </>
  );
};

interface EmojiPickerBarProps {
  usedEmojiSet: Set<string>;
  hiddenProp?: boolean;
  className?: string;
  onEmojiPickerOpenChange?: (open: boolean) => void;
  onEmojiPick: (
    emoji: string,
    source: 'quick-react' | 'reactions-modal',
  ) => void;
}

const EmojiPickerBar: React.FC<EmojiPickerBarProps> = ({
  usedEmojiSet,
  onEmojiPick,
  hiddenProp,
  className,
  onEmojiPickerOpenChange,
}) => {
  const [hidden, setHidden] = useState(hiddenProp);
  const { recentReactions } = useDirectCastToTakeAction();

  useEffect(() => {
    setHidden(hiddenProp);
  }, [hiddenProp]);

  return (
    <div
      className={classNames(
        hidden ? 'opacity-0' : '',
        'z-[1000] flex flex-row items-center rounded-full p-1 bg-app border-default',
        'shadow-[0_20px_60px_15px_rgba(0,0,0,.08)] dark:shadow-[0_20px_60px_15px_rgba(255,255,255,.08)]',
        className,
      )}
    >
      {recentReactions.map((r) => {
        return (
          <div
            key={`quick-react-${r}`}
            onClick={(e) => {
              e.stopPropagation();
              onEmojiPick(r, 'quick-react');
            }}
            className={classNames(
              'z-[1001] flex h-[32px] w-[32px] cursor-pointer flex-row items-center justify-center rounded-full text-[16px] text-muted',
              usedEmojiSet.has(r)
                ? 'bg-overlay-medium'
                : 'hover:bg-overlay-medium',
            )}
          >
            <ReactionEmoji reaction={r} />
          </div>
        );
      })}
      <EmojiPickerPopover
        onOpenChange={(open) => {
          onEmojiPickerOpenChange?.(open);
          setHidden(open);
        }}
        includeCustomEmojis
        onEmojiPick={({ emoji }) => {
          onEmojiPick(emoji, 'reactions-modal');
        }}
        trigger={
          <div className="inline-block w-9 items-center justify-start rounded-full p-1 text-center align-middle text-xl text-muted hover:cursor-pointer hover:bg-overlay-medium">
            +
          </div>
        }
      />
    </div>
  );
};

export { DirectCastReactionContextMenu };
