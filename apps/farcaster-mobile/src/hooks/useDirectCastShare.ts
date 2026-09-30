import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiDirectCastMessageMetadata,
  ApiShareCastTarget,
} from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  useSendDirectCast,
} from 'farcaster-client-hooks';
import { generateMessageId } from 'farcaster-cryptography';
import React from 'react';
import { useToast } from 'react-native-toast-notifications';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useHaptics } from '~/hooks/useHaptics';

interface UseDirectCastShareProps {
  cast: ApiCast;
  castURL: string;
  targets: ApiShareCastTarget[];
  onComplete: () => void;
}

export function useDirectCastShare({
  cast,
  castURL,
  targets,
  onComplete,
}: UseDirectCastShareProps) {
  const currentUser = useCurrentUser_UNSAFE();
  const toast = useToast();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const sendDirectCast = useSendDirectCast();

  const optimisticDirectCastMetadata = React.useMemo(() => {
    const optimisticMetadata: ApiDirectCastMessageMetadata = {
      casts: [
        {
          author: cast.author,
          hash: cast.hash,
          text: cast.text,
          threadHash: cast.threadHash,
          timestamp: cast.timestamp,
          deleted: cast.deleted,
          embeds: cast.embeds,
          parentAuthor: cast.parentAuthor,
          parentHash: cast.parentHash,
          parentSource: cast.parentSource,
          channel: cast.channel,
        },
      ],
    };

    return optimisticMetadata;
  }, [
    cast.author,
    cast.channel,
    cast.deleted,
    cast.embeds,
    cast.hash,
    cast.parentAuthor,
    cast.parentHash,
    cast.parentSource,
    cast.text,
    cast.threadHash,
    cast.timestamp,
  ]);

  const sendToTargets = React.useCallback(
    (selectedTargets: (string | number)[], directCastMessage?: string) => {
      if (selectedTargets.length === 0) {
        return;
      }

      triggerImpactAsync();

      trackEvent(AnalyticsEvent.ShareCastDirectCast, {
        targets: selectedTargets.length,
      });

      // Also capping the possible targets users can blast a message here.
      const cappedSelectedTargets = selectedTargets.slice(0, 12);

      const message =
        typeof directCastMessage !== 'undefined' && directCastMessage !== ''
          ? `${castURL} ${directCastMessage.trim()}`
          : castURL;

      const messageSenderContext = {
        displayName: currentUser.displayName,
        fid: currentUser.fid,
        pfp: currentUser.pfp,
        username: currentUser.username,
      };

      for (const target of cappedSelectedTargets) {
        if (typeof target === 'number') {
          const messageId = generateMessageId();
          const conversationId = buildNonGroupConversationId({
            participantFids: [target, currentUser.fid],
          });

          void sendDirectCast({
            data: {
              conversationId: conversationId,
              fid: currentUser.fid,
              recipientFids: [target],
              message: message,
              messageId: messageId,
              type: 'text',
              senderContext: messageSenderContext,
              optimisticMetadata: optimisticDirectCastMetadata,
            },
          });
        } else {
          const groupConversationTarget = targets.find(
            (o) =>
              o.type === 'group-conversation' &&
              o.content.conversation.conversationId === target,
          );

          if (
            typeof groupConversationTarget === 'undefined' ||
            groupConversationTarget.type !== 'group-conversation'
          ) {
            continue;
          }

          const { conversation } = groupConversationTarget.content;
          const messageId = generateMessageId();

          void sendDirectCast({
            data: {
              conversationId: conversation.conversationId,
              fid: currentUser.fid,
              recipientFids: conversation.participants
                .map(({ fid }) => fid)
                .filter((participantFid) => participantFid !== currentUser.fid),
              message: message,
              messageId: messageId,
              type: 'text',
              optimisticMetadata: optimisticDirectCastMetadata,
              senderContext: messageSenderContext,
              conversationCategory: conversation.viewerContext.category,
            },
          });
        }
      }

      onComplete();

      const toastMessage =
        selectedTargets.length === 1
          ? 'Message sent'
          : 'Messages sent separately';

      toast.show(toastMessage, {
        type: 'shareSheetDirectCasts',
        duration: 5000,
        placement: 'bottom',
      });
    },
    [
      castURL,
      currentUser.displayName,
      currentUser.fid,
      currentUser.pfp,
      currentUser.username,
      onComplete,
      optimisticDirectCastMetadata,
      sendDirectCast,
      targets,
      toast,
      trackEvent,
      triggerImpactAsync,
    ],
  );

  return {
    sendToTargets,
  };
}
