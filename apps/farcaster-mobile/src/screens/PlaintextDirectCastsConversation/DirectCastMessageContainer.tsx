import isSameDay from 'date-fns/isSameDay';
import { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { v3DirectCastsAreInSameGroup } from '~/utils/DirectCastUtils';

import { AnnouncementDirectCast } from './AnnouncementDirectCast';
import { DirectCastMessageGesturesHandler } from './DirectCastMessageGesturesHandler';
import { NewMessagesMarker } from './NewMessagesMarker';
import { NotSupportedDirectCast } from './NotSupportedDirectCast';
import {
  type MessageInterface,
  PlaintextDirectCast,
} from './PlaintextDirectCast';
import type { SetReplyTo } from './PlaintextDirectCastsConversationScreen';
import { TimelineDateMarker } from './TimelineDateMarker';

type DirectCastMessageContainerProps = {
  currentUserFid: number;
  conversationId: string;
  conversationHasPinnedMessages: boolean;
  conversationIsGroup: boolean;
  conversationIsMuted: boolean;
  conversationOtherPartyLastReadTime: number;
  viewerCanPinMessages: boolean;
  shouldRenderNewMessageMarker: boolean;
  message: ApiDirectCastMessageV3;
  previousMessage: ApiDirectCastMessageV3 | undefined;
  nextMessage: ApiDirectCastMessageV3 | undefined;
  wrappingListIndex: number;
  setReplyTo: SetReplyTo;
  onScrollToReply: ({ messageId }: { messageId: string }) => void;
};

const DirectCastMessageContainer: React.FC<DirectCastMessageContainerProps> =
  React.memo(
    ({
      conversationHasPinnedMessages,
      conversationIsGroup,
      conversationIsMuted,
      conversationOtherPartyLastReadTime,
      viewerCanPinMessages,
      currentUserFid,
      conversationId,
      message,
      previousMessage,
      nextMessage,
      wrappingListIndex,
      shouldRenderNewMessageMarker,
      setReplyTo,
      onScrollToReply,
    }) => {
      const scrollToReply = React.useCallback(() => {
        if (message.inReplyTo) {
          onScrollToReply({ messageId: message.inReplyTo.messageId });
        }
      }, [message.inReplyTo, onScrollToReply]);

      const t = useTheme();
      const pushToUserProfile = usePushToUserProfile();

      const shouldShowDateMarker = React.useMemo(() => {
        const showDateMarker =
          typeof previousMessage === 'undefined' ||
          !isSameDay(
            new Date(message.serverTimestamp),
            new Date(previousMessage.serverTimestamp),
          );

        return showDateMarker;
      }, [message.serverTimestamp, previousMessage]);

      const shouldCollapseAbove = React.useMemo(
        () =>
          !!(
            previousMessage &&
            v3DirectCastsAreInSameGroup({
              currentDirectCastSenderFid: message.senderFid,
              currentDirectCastServerTimestamp: message.serverTimestamp,
              currentDirectCastType: message.type,
              previousDirectCastSenderFid: previousMessage.senderFid,
              previousDirectCastServerTimestamp:
                previousMessage.serverTimestamp,
              previousDirectCastType: previousMessage.type,
            })
          ),
        [message, previousMessage],
      );

      const shouldCollapseBelow = React.useMemo(
        () =>
          !!(
            nextMessage &&
            v3DirectCastsAreInSameGroup({
              currentDirectCastSenderFid: nextMessage.senderFid,
              currentDirectCastServerTimestamp: nextMessage.serverTimestamp,
              currentDirectCastType: nextMessage.type,
              previousDirectCastSenderFid: message.senderFid,
              previousDirectCastServerTimestamp: message.serverTimestamp,
              previousDirectCastType: message.type,
            })
          ),
        [message, nextMessage],
      );

      const sender = React.useMemo(
        () => message.senderContext,
        [message.senderContext],
      );

      const affectedUser = React.useMemo(
        () => message.actionTargetUserContext,
        [message.actionTargetUserContext],
      );

      const affectedUserUsername = React.useMemo(() => {
        return resolveUsernameShort({
          username: affectedUser?.username,
          fid: affectedUser?.fid,
        });
      }, [affectedUser]);

      const handleUserPress = React.useCallback(() => {
        if (typeof affectedUser !== 'undefined') {
          pushToUserProfile({ fid: affectedUser.fid });
        }
      }, [affectedUser, pushToUserProfile]);

      const senderUsername = React.useMemo(() => {
        if (typeof sender === 'undefined') {
          return undefined;
        }

        return sender.fid === currentUserFid
          ? 'You'
          : resolveUsernameShort({
              username: sender.username,
              fid: sender.fid,
            });
      }, [currentUserFid, sender]);

      const isMostRecentMessage = React.useMemo(() => {
        return wrappingListIndex === 0;
      }, [wrappingListIndex]);

      const textStyle = React.useMemo(() => {
        return [t.textXs, t.textCenter, t.texts.brand];
      }, [t.texts.brand, t.textCenter, t.textXs]);

      const messageRef = React.useRef<MessageInterface>(null);

      const onMessageDoubleTap = React.useCallback(() => {
        messageRef.current?.focus();
      }, []);

      const onMessagePressAndHold = React.useCallback(() => {
        messageRef.current?.focus();
      }, []);

      switch (message.type) {
        case 'rich_announcement':
        case 'text': {
          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <DirectCastMessageGesturesHandler
                onDoubleTap={onMessageDoubleTap}
                onPressAndHold={onMessagePressAndHold}
                disabled={message.type === 'rich_announcement'}
              >
                <PlaintextDirectCast
                  conversationId={conversationId}
                  conversationHasPinnedMessages={conversationHasPinnedMessages}
                  conversationIsGroup={conversationIsGroup}
                  conversationIsMuted={conversationIsMuted}
                  conversationOtherPartyLastReadTime={
                    conversationOtherPartyLastReadTime
                  }
                  viewerCanPinMessages={viewerCanPinMessages}
                  isMostRecent={isMostRecentMessage}
                  directCast={message}
                  shouldCollapseAbove={shouldCollapseAbove}
                  shouldCollapseBelow={shouldCollapseBelow}
                  setReplyTo={setReplyTo}
                  scrollToReply={scrollToReply}
                  currentUserFid={currentUserFid}
                  messageRef={messageRef}
                />
              </DirectCastMessageGesturesHandler>
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
        case 'pin_message': {
          const text = `${senderUsername} pinned a message`;

          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <AnnouncementDirectCast text={text} />
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
        case 'group_membership_addition': {
          if (typeof affectedUser === 'undefined') {
            return null;
          }

          let text: React.ReactNode;
          if (affectedUser.fid === sender.fid) {
            text = (
              <View style={[t.flex, t.flexRow, t.justifyCenter]}>
                <Pressable onPress={handleUserPress}>
                  <Text style={textStyle}>{affectedUserUsername}</Text>
                </Pressable>
                <Text style={[textStyle, t.texts.primary]}>
                  {' joined via a link'}
                </Text>
              </View>
            );
          } else {
            text = (
              <View style={[t.flex, t.flexRow, t.justifyCenter]}>
                <Text
                  style={[textStyle, t.texts.primary]}
                >{`${senderUsername} added`}</Text>
                <Pressable onPress={handleUserPress}>
                  <Text style={textStyle}>{` ${affectedUserUsername}`}</Text>
                </Pressable>
              </View>
            );
          }

          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <AnnouncementDirectCast text={text} />
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
        case 'group_membership_removal': {
          if (typeof affectedUser === 'undefined') {
            return null;
          }

          let text: React.ReactNode;
          if (affectedUser.fid === sender.fid) {
            text = (
              <View style={[t.flex, t.flexRow, t.justifyCenter]}>
                <Pressable onPress={handleUserPress}>
                  <Text style={textStyle}>{affectedUserUsername}</Text>
                </Pressable>
                <Text style={[textStyle, t.texts.primary]}>{' left'}</Text>
              </View>
            );
          } else {
            text = (
              <View style={[t.flex, t.flexRow, t.justifyCenter]}>
                <Text
                  style={[textStyle, t.texts.primary]}
                >{`${senderUsername} removed`}</Text>
                <Pressable onPress={handleUserPress}>
                  <Text style={textStyle}>{` ${affectedUserUsername}`}</Text>
                </Pressable>
              </View>
            );
          }

          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <AnnouncementDirectCast text={text} />
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
        case 'group_name_change': {
          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <AnnouncementDirectCast
                text={`${senderUsername} changed group name to ${message.message}`}
              />
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
        case 'message_ttl_change': {
          const label = message.message === '1' ? 'day' : 'days';
          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <AnnouncementDirectCast
                text={
                  message.message === 'Infinity'
                    ? `${senderUsername} set messages to never auto-delete`
                    : `${senderUsername} set messages to auto-delete in ${message.message} ${label}`
                }
              />
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
        default: {
          return (
            <>
              {shouldRenderNewMessageMarker && (
                <NewMessagesMarker
                  conversationId={conversationId}
                  messageId={message.messageId}
                />
              )}
              <NotSupportedDirectCast />
              {shouldShowDateMarker && (
                <TimelineDateMarker
                  messageServerTimestamp={message.serverTimestamp}
                />
              )}
            </>
          );
        }
      }
    },
  );

export { DirectCastMessageContainer };
