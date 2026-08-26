import { ClockIcon, KebabHorizontalIcon } from '@primer/octicons-react';
import cn from 'classnames';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastConversationMessageTTLDays,
} from 'farcaster-client-data';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { DirectCastConversationAutoDeleteMenu } from '~/components/directCasts/DirectCastConversationAutoDeleteMenu';
import { DirectCastConversationDropdownMenu } from '~/components/directCasts/DirectCastConversationDropdownMenu';
import { ChangeMessageTLLModal } from '~/components/modals/ChangeMessageTLLModal';
import { ManageGroupAddUsersModal } from '~/components/modals/ManageGroupAddUsersModal';
import { ManageGroupModal } from '~/components/modals/ManageGroupModal';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';

type DirectCastsConversationActionsProps = {
  conversation: ApiDirectCastConversationInfoV3;
  archived: boolean;
  showManageUsersModal: boolean;
  setShowManageUsersModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const DirectCastsConversationActions: FC<DirectCastsConversationActionsProps> =
  memo(({ conversation, showManageUsersModal, setShowManageUsersModal }) => {
    const [showManageGroupModal, setShowManageGroupModal] = useState(false);
    const [autoDeleteMenuOpen, setAutoDeleteMenuOpen] = useState(false);
    const [showChangeTTLModal, setShowChangeTTLModal] = useState(false);
    const [newMessageTTL, setNewMessageTTL] = useState<
      ApiDirectCastConversationMessageTTLDays | undefined
    >(undefined);
    const isProUser = useCurrentUserLevel() === 'pro';

    const showNeverOption = useMemo(() => {
      if (conversation.messageTTLDays === 'Infinity') {
        return true;
      }
      return isProUser && !conversation.isGroup;
    }, [conversation.isGroup, conversation.messageTTLDays, isProUser]);

    const isConversationAdmin = useMemo(
      () => conversation.viewerContext.access === 'admin',
      [conversation.viewerContext.access],
    );

    const shouldShowAutoDeleteMenu = useMemo(() => {
      if (conversation.isGroup) {
        return isConversationAdmin;
      }
      return true;
    }, [conversation.isGroup, isConversationAdmin]);

    const openManageGroupModal = useCallback(
      (e: React.SyntheticEvent<HTMLDivElement>) => {
        e.stopPropagation();

        // We are going to route all users to the new group modal instead of the popover
        if (conversation.isGroup) {
          setShowManageGroupModal(true);
        }
      },
      [conversation.isGroup],
    );

    const autoDeleteLabel = useMemo(() => {
      if (conversation.messageTTLDays === 365) {
        return '1y';
      }
      if (conversation.messageTTLDays === 'Infinity') {
        return 'Never';
      }
      return `${conversation.messageTTLDays}d`;
    }, [conversation.messageTTLDays]);

    const autoDeleteIcon = (
      <div
        className={cn(
          'group flex flex-row items-center justify-center gap-1 rounded-xl border-2 border-dotted p-1 hover:bg-overlay-faint hover:text-action-purple',
          autoDeleteMenuOpen
            ? 'border-black dark:border-white'
            : 'light:border-zinc-300 dark:border-zinc-600',
        )}
      >
        <ClockIcon
          size={14}
          className="text-default group-hover:text-action-purple"
        />
        <div className="font-['Inter'] text-xs font-normal leading-none text-default group-hover:text-action-purple">
          {autoDeleteLabel}
        </div>
      </div>
    );

    const autoDeleteMenu = (
      <DirectCastConversationAutoDeleteMenu
        selection={conversation.messageTTLDays}
        open={autoDeleteMenuOpen}
        onOpenChange={setAutoDeleteMenuOpen}
        onSelect={(ttl) => {
          if (ttl === conversation.messageTTLDays) {
            setNewMessageTTL(undefined);
          } else {
            setNewMessageTTL(ttl);
            setShowChangeTTLModal(true);
          }
        }}
        showHeader={true}
        side="bottom"
        align="end"
        trigger={autoDeleteIcon}
        showNeverOption={showNeverOption}
      />
    );

    return (
      <>
        <div className="flex flex-row space-x-2">
          {shouldShowAutoDeleteMenu ? autoDeleteMenu : autoDeleteIcon}
          {conversation.isGroup ? (
            <div
              className="relative flex size-8 cursor-pointer flex-col items-center justify-center rounded-full text-muted hover:bg-overlay-faint hover:text-action-purple"
              onClick={openManageGroupModal}
            >
              <KebabHorizontalIcon />
            </div>
          ) : (
            <DirectCastConversationDropdownMenu
              trigger={
                <div
                  className="relative flex size-8 cursor-pointer flex-col items-center justify-center rounded-full text-muted hover:bg-overlay-faint hover:text-action-purple"
                  onClick={openManageGroupModal}
                >
                  <KebabHorizontalIcon />
                </div>
              }
            />
          )}
        </div>
        {showManageGroupModal && (
          <ManageGroupModal
            onClose={() => {
              setShowManageGroupModal(false);
            }}
          />
        )}
        {showManageUsersModal && (
          <ManageGroupAddUsersModal
            conversation={conversation}
            onClose={() => {
              setShowManageUsersModal(false);
            }}
          />
        )}
        {showChangeTTLModal && (
          <ChangeMessageTLLModal
            conversation={conversation as ApiDirectCastConversationInfoV3}
            newMessageTTL={
              newMessageTTL as ApiDirectCastConversationMessageTTLDays
            }
            onClose={() => {
              setShowChangeTTLModal(false);
              setNewMessageTTL(undefined);
            }}
          />
        )}
      </>
    );
  });

DirectCastsConversationActions.displayName = 'DirectCastsConversationActions';

export { DirectCastsConversationActions };
