import { Dialog } from '@headlessui/react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastConversationViewCategory,
  ApiDirectCastInboxConversationInfoV3,
  ApiUser,
} from 'farcaster-client-data';
import {
  useAcceptGroupInvite,
  useAlterPlaintextDirectCastConversationCategory,
  useChangeNotificationsInPlaintextDirectCastConversation,
  useDeclineGroupInvite,
  useDirectCastConversation,
  useGloballyCachedDirectCastInboxConversation,
  useManuallyMarkConversationUnread,
  useMarkConversationRead,
  usePinDirectCastConversation,
  usePrefetchDirectCastConversation,
  usePrefetchDirectCastConversationMessages,
  usePrefetchDirectCastConversationRecentMessages,
  useTrackEvent,
  useUnpinDirectCastConversation,
  useUnseen,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

export type DirectCastConversationContextValue = {
  conversation:
    | ApiDirectCastConversationInfoV3
    | ApiDirectCastInboxConversationInfoV3;
  counterParties: ApiUser[];
  deleteConversation: () => Promise<{ deleted: boolean }>;
  markUnread: () => Promise<{ success: boolean }>;
  markRead: () => Promise<{ success: boolean }>;
  endSnooze: () => Promise<{ success: boolean }>;
  snooze: () => Promise<{ success: boolean }>;
  archive: () => Promise<{ success: boolean }>;
  unarchive: () => Promise<{ success: boolean }>;
  pin: () => Promise<{ success: boolean }>;
  unpin: () => Promise<{ success: boolean }>;
  prefetch: () => Promise<void>;
  acceptGroupInvite: () => Promise<{ success: boolean }>;
  declineGroupInvite: () => Promise<{ success: boolean }>;
};

const DirectCastConversationContext =
  React.createContext<DirectCastConversationContextValue>(null!);

export const useDirectCastConversationContext = () =>
  React.useContext(DirectCastConversationContext);

type DirectCastConversationProviderProps = {
  conversation:
    | ApiDirectCastConversationInfoV3
    | ApiDirectCastInboxConversationInfoV3;
  children: React.ReactNode;
};

export const DirectCastConversationProvider: React.FC<DirectCastConversationProviderProps> =
  React.memo(({ children, conversation: fallbackConversation }) => {
    const conversation = useGloballyCachedConversation(fallbackConversation);
    return (
      <CacheIgnoringDirectCastConversationProvider conversation={conversation}>
        {children}
      </CacheIgnoringDirectCastConversationProvider>
    );
  });

export const CacheIgnoringDirectCastConversationProvider: React.FC<DirectCastConversationProviderProps> =
  React.memo(({ children, conversation }) => {
    const { incrementInboxCount, decreaseInboxCount } = useUnseen();

    const prefetchConversation = usePrefetchDirectCastConversation();
    const prefetchMessages = usePrefetchDirectCastConversationMessages();
    const prefetchRecentMessages =
      usePrefetchDirectCastConversationRecentMessages();

    const alterPlaintextDirectCastConversationCategory =
      useAlterPlaintextDirectCastConversationCategory();
    const changeNotificationsInDirectCastConversation =
      useChangeNotificationsInPlaintextDirectCastConversation();
    const markConversationUnread = useManuallyMarkConversationUnread();
    const markConversationRead = useMarkConversationRead();
    const pinConversation = usePinDirectCastConversation();
    const unpinConversation = useUnpinDirectCastConversation();
    const acceptGroupInvite = useAcceptGroupInvite();
    const declineGroupInvite = useDeclineGroupInvite();

    const { conversationId } = conversation;

    const { fid } = useCurrentUser();
    const [deleting, setDeleting] = useState(false);
    const deleteResolveRef =
      useRef<(value: { deleted: boolean }) => void>(undefined);

    const deleteConversation = useCallback(async () => {
      setDeleting(true);
      return new Promise<{ deleted: boolean }>((resolve) => {
        deleteResolveRef.current = resolve;
      });
    }, []);

    const handleDelete = () => {
      if (deleteResolveRef.current) {
        deleteResolveRef.current({ deleted: true });
        deleteResolveRef.current = undefined;
      }

      setDeleting(false);
    };

    const handleCancelDelete = () => {
      if (deleteResolveRef.current) {
        deleteResolveRef.current({ deleted: false });
        deleteResolveRef.current = undefined;
      }

      setDeleting(false);
    };

    const counterParties = useMemo(() => {
      return 'participants' in conversation
        ? conversation.participants.filter((p) => p.fid !== fid)
        : conversation.viewerContext.counterParty
          ? [conversation.viewerContext.counterParty]
          : [];
    }, [conversation, fid]);

    const prefetch = useCallback(async () => {
      await Promise.all([
        prefetchConversation({
          conversationId: conversationId,
        }),
        prefetchMessages({
          conversationId: conversationId,
          messageId: undefined,
          // This should match to the DirectCastsConversationMessagesProvider fetching limit target
          // so users are prefetching the same thing they are going to see on load. Mis-match on counts
          // likely to cause other headaches.
          limit: 50,
        }),
        prefetchRecentMessages({
          conversationId: conversationId,
        }),
      ]);
    }, [
      conversationId,
      prefetchConversation,
      prefetchMessages,
      prefetchRecentMessages,
    ]);

    const archive = useCallback(async () => {
      try {
        await alterPlaintextDirectCastConversationCategory({
          fid,
          conversationId: conversationId,
          fromCategory: conversation.viewerContext.category,
          toCategory: 'archived',
        });

        return { success: true };
      } catch (error) {
        trackError(error);
        toast({ message: 'Failed to archive conversation', type: 'error' });
        return { success: false };
      }
    }, [
      conversation,
      conversationId,
      fid,
      alterPlaintextDirectCastConversationCategory,
    ]);

    const unarchive = useCallback(async () => {
      try {
        await alterPlaintextDirectCastConversationCategory({
          fid,
          conversationId: conversationId,
          fromCategory: conversation.viewerContext.category,
          toCategory: 'default',
        });
        return { success: true };
      } catch (error) {
        trackError(error);
        toast({ message: 'Failed to unarchive conversation', type: 'error' });
        return { success: false };
      }
    }, [
      conversation,
      conversationId,
      fid,
      alterPlaintextDirectCastConversationCategory,
    ]);

    const snooze = useCallback(async () => {
      try {
        await changeNotificationsInDirectCastConversation({
          fid,
          conversationId,
          muted: true,
        });

        return { success: true };
      } catch (e) {
        trackError(e);
        toast({ message: 'Failed to snooze conversation', type: 'error' });
        return { success: false };
      }
    }, [conversationId, fid, changeNotificationsInDirectCastConversation]);

    const endSnooze = useCallback(async () => {
      try {
        await changeNotificationsInDirectCastConversation({
          fid,
          conversationId,
          muted: false,
        });
        return { success: true };
      } catch (e) {
        trackError(e);
        toast({
          message: 'Failed to end snooze for conversation',
          type: 'error',
        });
        return { success: false };
      }
    }, [conversationId, fid, changeNotificationsInDirectCastConversation]);

    const markUnread = useCallback(async () => {
      try {
        await markConversationUnread({
          fid,
          conversationId,
        });

        incrementInboxCount();
        return { success: true };
      } catch (e) {
        trackError(e);
        return { success: false };
      }
    }, [conversationId, fid, incrementInboxCount, markConversationUnread]);

    const markRead = useCallback(async () => {
      if (!conversation) {
        return { success: false };
      }

      try {
        await markConversationRead({
          conversationId: conversation.conversationId,
          fid: fid,
        });

        if (!conversation.viewerContext.muted) {
          decreaseInboxCount();
        }

        return { success: true };
      } catch (e) {
        trackError(e);
        return { success: false };
      }
    }, [fid, markConversationRead, conversation, decreaseInboxCount]);

    const pin = useCallback(async () => {
      try {
        void pinConversation({
          fid: fid,
          conversationId,
        });

        return { success: true };
      } catch (e) {
        trackError(e);
        return { success: false };
      }
    }, [fid, conversationId, pinConversation]);

    const unpin = useCallback(async () => {
      try {
        void unpinConversation({
          fid,
          conversationId,
        });

        return { success: true };
      } catch (e) {
        trackError(e);
        return { success: false };
      }
    }, [fid, conversationId, unpinConversation]);

    const acceptGroupInviteWrapper = useCallback(async () => {
      try {
        await acceptGroupInvite.mutateAsync({
          fid: fid,
          conversationId,
        });

        return { success: true };
      } catch (e) {
        trackError(e);
        toast({ message: 'Failed to accept group invite', type: 'error' });
        return { success: false };
      }
    }, [fid, conversationId, acceptGroupInvite]);

    const declineGroupInviteWrapper = useCallback(async () => {
      try {
        await declineGroupInvite.mutateAsync({
          fid: fid,
          conversationId,
        });

        return { success: true };
      } catch (e) {
        trackError(e);
        toast({ message: 'Failed to decline group invite', type: 'error' });
        return { success: false };
      }
    }, [fid, conversationId, declineGroupInvite]);

    const contextValue = useMemo(
      () => ({
        conversation,
        counterParties,
        markUnread,
        endSnooze,
        snooze,
        archive,
        unarchive,
        markRead,
        deleteConversation,
        prefetch,
        pin,
        unpin,
        acceptGroupInvite: acceptGroupInviteWrapper,
        declineGroupInvite: declineGroupInviteWrapper,
      }),
      [
        conversation,
        counterParties,
        markUnread,
        endSnooze,
        snooze,
        archive,
        unarchive,
        markRead,
        deleteConversation,
        prefetch,
        pin,
        unpin,
        acceptGroupInviteWrapper,
        declineGroupInviteWrapper,
      ],
    );

    return (
      <DirectCastConversationContext.Provider value={contextValue}>
        {children}
        {deleting && (
          <DeleteDirectCastConversationDialog
            category={conversation.viewerContext.category}
            conversationId={conversationId}
            onDelete={handleDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </DirectCastConversationContext.Provider>
    );
  });

function useGloballyCachedConversation(
  conversation:
    | ApiDirectCastConversationInfoV3
    | ApiDirectCastInboxConversationInfoV3,
): ApiDirectCastConversationInfoV3 | ApiDirectCastInboxConversationInfoV3 {
  const isInboxConversation = !('participants' in conversation);

  const inboxConversation = useGloballyCachedDirectCastInboxConversation({
    fallback: conversation as ApiDirectCastInboxConversationInfoV3,
  });

  const { data: regularConversation } = useDirectCastConversation({
    conversationId: conversation.conversationId,
    enabled: !isInboxConversation,
  });

  return isInboxConversation
    ? inboxConversation
    : regularConversation || conversation;
}

function DeleteDirectCastConversationDialog({
  category,
  conversationId,
  onDelete,
  onCancel,
}: {
  category: ApiDirectCastConversationViewCategory;
  conversationId: string;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const user = useCurrentUser();
  const [submitting, setSubmitting] = useState(false);
  const { trackEvent } = useTrackEvent();

  const alterPlaintextDirectCastConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await alterPlaintextDirectCastConversationCategory({
        fid: user.fid,
        conversationId,
        fromCategory: category,
        toCategory: 'deleted',
      });
      trackEvent(AnalyticsEvent.DeleteDirectCastConversation, {
        conversationCategory: category,
      });
      onDelete();
    } catch (e) {
      trackError(e);
      toast({ message: `Failed to delete conversation`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} className="relative z-50" static>
      <DialogBackdrop />
      <DialogPanelContainer>
        <Dialog.Panel className="w-full max-w-[387px] rounded-lg border p-4 bg-app border-default">
          <Dialog.Title className="mb-4 flex items-center text-xl font-medium text-default">
            Delete conversation?
          </Dialog.Title>
          <Dialog.Description>
            This will be removed from your inbox. The other person will still
            see it in theirs.
          </Dialog.Description>
          <div className="mt-4 grid grid-cols-2 gap-[11px]">
            <DefaultButton
              onClick={onCancel}
              variant="secondary"
              disabled={submitting}
            >
              Cancel
            </DefaultButton>
            <DefaultButton
              onClick={handleDelete}
              variant="danger"
              disabled={submitting}
            >
              Delete
            </DefaultButton>
          </div>
        </Dialog.Panel>
      </DialogPanelContainer>
    </Dialog>
  );
}
