import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useDirectCastConversation,
  useMarkConversationRead,
  useUnseen,
} from 'farcaster-client-hooks';
import React from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';

import { GroupInviteRequestDisclaimer } from './GroupInviteRequestDisclaimer';
import { MessageRequestDisclaimers } from './MessageRequestDisclaimers';
import {
  MessagesListInterface,
  PlaintextDirectCastsConversationContent,
} from './PlaintextDirectCastsConversationContent';
import { SetReplyTo } from './PlaintextDirectCastsConversationScreen';

export interface PlaintextDirectCastsConversationProps {
  currentUserFid: number;
  conversationId: string;
  setReplyTo: SetReplyTo;
  onNewMessageLoad?: () => void;
  messagesListRef: React.Ref<MessagesListInterface>;
  isOptimistic?: boolean;
  focusOnMessageId?: string | undefined;
}

const PlaintextDirectCastsConversation: React.FC<PlaintextDirectCastsConversationProps> =
  React.memo(
    ({
      currentUserFid,
      conversationId,
      setReplyTo,
      messagesListRef,
      onNewMessageLoad,
      isOptimistic,
      focusOnMessageId,
    }) => {
      const { trackEvent } = useAnalytics();

      const { data: conversation } = useDirectCastConversation({
        conversationId,
      });

      const conversationIsTokenGated = React.useMemo(() => {
        return (
          typeof conversation !== 'undefined' &&
          conversation?.isCollectionTokenGated
        );
      }, [conversation]);

      React.useEffect(() => {
        trackEvent(AnalyticsEvent.ViewDirectCastsConversation, {
          conversationId: conversation?.conversationId,
          conversationCategory: conversation?.viewerContext.category,
          is_token_gated: conversationIsTokenGated,
        });
      }, [
        conversation?.conversationId,
        conversation?.viewerContext.category,
        conversationIsTokenGated,
        trackEvent,
      ]);

      let isUnread = true;
      if (conversation) {
        const { manuallyMarkedUnread, unreadCount } =
          conversation.viewerContext;
        isUnread = unreadCount > 0 || manuallyMarkedUnread;
      }

      const isPendingMessageRequest =
        conversation?.viewerContext.category === 'request' ||
        conversation?.viewerContext.category === 'void';

      const markConversationRead = useMarkConversationRead();
      const { decreaseInboxCount } = useUnseen();
      const markReadThroughAPI = React.useCallback(async () => {
        await markConversationRead({
          conversationId,
          fid: currentUserFid,
        });
        if (!conversation?.viewerContext.muted && isUnread) {
          decreaseInboxCount();
        }
      }, [
        conversationId,
        currentUserFid,
        markConversationRead,
        decreaseInboxCount,
        conversation?.viewerContext.muted,
        isUnread,
      ]);

      const triggerMarkConversationRead = React.useCallback(async () => {
        if (!isPendingMessageRequest) {
          await markReadThroughAPI();
        }
      }, [isPendingMessageRequest, markReadThroughAPI]);

      const lastMessageTextContentRef = React.useRef<string>(undefined);

      React.useEffect(() => {
        if (
          typeof conversation !== 'undefined' &&
          typeof conversation?.lastMessage !== 'undefined' &&
          lastMessageTextContentRef.current !==
            conversation?.lastMessage.messageId
        ) {
          triggerMarkConversationRead();
          if (typeof lastMessageTextContentRef.current !== 'undefined') {
            onNewMessageLoad?.();
          }
          lastMessageTextContentRef.current =
            conversation?.lastMessage.messageId;
        }
      }, [conversation, triggerMarkConversationRead, onNewMessageLoad]);

      const ListHeaderComponent = React.useMemo(() => {
        if (!conversation) {
          return undefined;
        }
        const category = conversation.viewerContext.category;
        if (category === 'request' || category === 'void') {
          if (
            category === 'request' &&
            conversation.isGroup &&
            conversation.viewerContext.inviter
          ) {
            return (
              <GroupInviteRequestDisclaimer
                conversationId={conversation.conversationId}
                inviter={conversation.viewerContext.inviter}
              />
            );
          }
          return (
            <MessageRequestDisclaimers
              conversationId={conversation.conversationId}
              counterParty={
                conversation.viewerContext.counterParty ||
                conversation.participants.filter(
                  (participant) => participant.fid !== currentUserFid,
                )[0]
              }
              category={category}
            />
          );
        }

        return undefined;
      }, [conversation, currentUserFid]);

      return (
        <PlaintextDirectCastsConversationContent
          conversationId={conversationId}
          conversationHasPinnedMessages={
            conversation?.pinnedMessages.length !== 0
          }
          conversationIsGroup={conversation?.isGroup ?? false}
          conversationIsMuted={conversation?.viewerContext.muted ?? false}
          conversationOtherPartyLastReadTime={conversation?.lastReadTime ?? 0}
          viewerCanPinMessages={conversation?.viewerContext.access === 'admin'}
          currentUserFid={currentUserFid}
          setReplyTo={setReplyTo}
          messagesListRef={messagesListRef}
          ListHeaderComponent={ListHeaderComponent}
          isOptimistic={isOptimistic}
          focusOnMessageId={focusOnMessageId}
        />
      );
    },
  );

PlaintextDirectCastsConversation.displayName =
  'PlaintextDirectCastsConversation';

export { PlaintextDirectCastsConversation };
