import { AnalyticsEvent } from 'farcaster-analytics';
import {
  usePrefetchDirectCastConversationHistoricalMessages,
  useUnpinDirectCastMessage,
} from 'farcaster-client-hooks';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  HISTORICAL_MESSAGE_FETCH_LIMIT,
  useDirectCastsConversationMessages,
} from '~/contexts/DirectCastsConversationMessagesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import {
  InboxPinnedIcon,
  InboxPinnedSlashIcon,
} from '~/screens/PlaintextDirectCasts/PlaintextLastDirectCast';

type ConversationPinnedMessagesProps = {
  currentUserFid: number;
  onPinnedMessagePress: ({ messageId }: { messageId: string }) => void;
};

const ConversationPinnedMessages: React.FC<ConversationPinnedMessagesProps> =
  React.memo(({ currentUserFid, onPinnedMessagePress }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();

    const { conversationRef: conversation } =
      useDirectCastsConversationMessages();

    const unpinDirectCastMessage = useUnpinDirectCastMessage();

    const prefetch = usePrefetchDirectCastConversationHistoricalMessages();

    const conversationPinnedMessage = React.useMemo(() => {
      if (conversation.pinnedMessages.length === 0) {
        return undefined;
      }

      return conversation.pinnedMessages[0];
    }, [conversation.pinnedMessages]);

    const { triggerImpactAsync } = useHaptics();

    const onPinnedMessagePressInternal = React.useCallback(async () => {
      if (typeof conversationPinnedMessage === 'undefined') {
        return;
      }

      triggerImpactAsync();

      onPinnedMessagePress({
        messageId: conversationPinnedMessage.messageId,
      });
    }, [conversationPinnedMessage, onPinnedMessagePress, triggerImpactAsync]);

    const canUnpinMessagesInConversation = React.useMemo(() => {
      return (
        conversation.isGroup && conversation.viewerContext.access === 'admin'
      );
    }, [conversation.isGroup, conversation.viewerContext.access]);

    const onUnpinPress = React.useCallback(() => {
      if (typeof conversationPinnedMessage === 'undefined') {
        return;
      }

      trackEvent(AnalyticsEvent.UnpinDirectCastMessageFromHeader, {});

      unpinDirectCastMessage({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        message: conversationPinnedMessage,
      });
    }, [
      conversation.conversationId,
      conversationPinnedMessage,
      currentUserFid,
      trackEvent,
      unpinDirectCastMessage,
    ]);

    const alreadyPrefetchedMessageId = React.useRef<string | undefined>(
      undefined,
    );

    React.useEffect(() => {
      if (
        conversation.hasPinnedMessages &&
        typeof conversationPinnedMessage !== 'undefined' &&
        alreadyPrefetchedMessageId.current !==
          conversationPinnedMessage.messageId
      ) {
        prefetch({
          conversationId: conversation.conversationId,
          messageId: conversationPinnedMessage.messageId,
          limit: HISTORICAL_MESSAGE_FETCH_LIMIT,
        });
        alreadyPrefetchedMessageId.current =
          conversationPinnedMessage.messageId;
      }
    }, [
      conversation.conversationId,
      conversation.hasPinnedMessages,
      conversationPinnedMessage,
      prefetch,
    ]);

    if (
      typeof conversationPinnedMessage === 'undefined' ||
      !conversation.hasPinnedMessages
    ) {
      return null;
    }

    // TODO: Update once we support multi-pinned messages with an updated design
    const { message, senderFid, senderContext } = conversationPinnedMessage;

    const pinnedDirectCastDisplayName =
      senderFid === currentUserFid ? 'You' : senderContext.displayName;

    return (
      <View style={[t.top0, t.wFull, t.bgDefault]}>
        <TouchableOpacity
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.pX5,
            t.pY2,
            t.borderBHairline,
            t.borderDefault,
            { gap: 8 },
          ]}
          onPress={onPinnedMessagePressInternal}
          activeOpacity={0.75}
        >
          <View
            style={[
              t.flex,
              t.flexCol,
              { backgroundColor: t.colors.venusViolet },
              t.w1,
              t.hFull,
              { borderRadius: 4 },
            ]}
          />
          <View
            style={[t.flex1, t.flex, t.flexCol, t.flexGrow, t.justifyCenter]}
          >
            <Text
              style={[t.textXs, t.fontSemibold, t.directCasts.textUsername]}
            >
              {pinnedDirectCastDisplayName}
            </Text>
            <Text
              style={[t.textSm, t.texts.primary, { paddingTop: 2 }]}
              numberOfLines={2}
            >
              {message}
            </Text>
          </View>
          {canUnpinMessagesInConversation ? (
            <TouchableOpacity
              style={[t.relative, t.flexShrink, t.pL2, t.pT2, t.selfStart]}
              onPress={onUnpinPress}
            >
              <InboxPinnedSlashIcon />
            </TouchableOpacity>
          ) : (
            <View style={[t.relative, t.flexShrink, t.pL2, t.pT2, t.selfStart]}>
              <InboxPinnedIcon />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  });

export { ConversationPinnedMessages };
