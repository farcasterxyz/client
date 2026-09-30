import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { ApiDirectCastInboxConversationInfoV3 } from 'farcaster-client-data';
import { useGloballyCachedDirectCastInboxConversation } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { DirectCastConversationAvatar } from '~/components/DirectCasts/DirectCastConversationAvatar';
import { FollowersYouKnowContent } from '~/components/headers/FollowersYouKnowContent';
import { Text } from '~/components/Text';
import { useManageDirectCastConversation } from '~/contexts/ManageDirectCastConversationProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

import { PlaintextLastDirectCast } from './PlaintextLastDirectCast';

type PlaintextDirectCastConversationListItemProps = {
  currentUserFid: number;
  conversation: ApiDirectCastInboxConversationInfoV3;
  borderStyle: 'top' | 'bottom' | 'none';
  shouldShowConversationTag: boolean;
  onPress?: () => void;
  parseMatchedSearchTermsFromLastMessage?: boolean;
};

const PlaintextDirectCastConversationListItem: FC<PlaintextDirectCastConversationListItemProps> =
  memo((props) => {
    const conversation = useGloballyCachedDirectCastInboxConversation({
      fallback: props.conversation,
    });
    return (
      <CacheIgnoringPlaintextDirectCastConversationListItem
        {...props}
        conversation={conversation}
      />
    );
  });

const CacheIgnoringPlaintextDirectCastConversationListItem: FC<PlaintextDirectCastConversationListItemProps> =
  memo(
    ({
      currentUserFid,
      conversation,
      borderStyle,
      shouldShowConversationTag,
      onPress,
      parseMatchedSearchTermsFromLastMessage,
    }) => {
      const t = useTheme();
      const push = usePush();
      const { manageConversation } = useManageDirectCastConversation();

      const { counterParty } = conversation.viewerContext;

      const messageSender = conversation.lastMessage?.senderContext;

      const messageAffected = React.useMemo(() => {
        if (
          typeof conversation.lastMessage === 'undefined' ||
          (conversation.lastMessage?.type !== 'group_membership_addition' &&
            conversation.lastMessage?.type !== 'group_membership_removal')
        ) {
          return undefined;
        }

        return conversation.lastMessage.actionTargetUserContext;
      }, [conversation.lastMessage]);

      const { triggerImpactAsync } = useHaptics();

      const navigateToConversation = useCallback(() => {
        DdRum.addAction(RumActionType.TAP, 'warpcast_custom_press_convo', {
          info: '[Direct Casts] Press conversation in default inbox to load',
          conversation_id: conversation.conversationId,
          conversation_is_group: conversation.isGroup,
          conversation_unread_count: conversation.viewerContext.unreadCount,
        });

        triggerImpactAsync();
        if (onPress) {
          onPress();
          return;
        }
        push('PlaintextDirectCastsConversation', {
          conversationId: conversation.conversationId,
          counterParty: counterParty,
          create: false,
          intentText: undefined,
        });
      }, [
        onPress,
        conversation.conversationId,
        conversation.isGroup,
        conversation.viewerContext.unreadCount,
        counterParty,
        push,
        triggerImpactAsync,
      ]);

      const manageConversationPress = React.useCallback(() => {
        triggerImpactAsync();

        manageConversation({ conversationId: conversation.conversationId });
      }, [conversation, manageConversation, triggerImpactAsync]);

      const followersYouKnowFooter = useMemo(() => {
        if (
          conversation.viewerContext.category === 'request' &&
          counterParty &&
          counterParty.viewerContext?.followersYouKnow
        ) {
          return (
            <View
              style={[
                t.wFull,
                t.flex,
                t.flexRow,
                t.itemsCenter,
                counterParty.viewerContext.followersYouKnow.totalCount !== 0
                  ? t.justifyBetween
                  : t.justifyEnd,
                { marginTop: -sizes.s9 },
              ]}
            >
              <FollowersYouKnowContent
                users={counterParty.viewerContext.followersYouKnow.users}
                totalCount={
                  counterParty.viewerContext.followersYouKnow.totalCount
                }
                condensed={true}
              />
              {typeof conversation.viewerContext.tag !== 'undefined' && (
                <View
                  style={[
                    t.borderDefault,
                    t.borderHairline,
                    t.flex,
                    t.flexRow,
                    t.itemsCenter,
                    t.pX2,
                    t.backgrounds.secondary,
                    { height: 24, borderRadius: 40 },
                  ]}
                >
                  {conversation.viewerContext.tag === 'automated' && (
                    <Text style={[t.texts.primary, { fontSize: 12 }]}>
                      Automated
                    </Text>
                  )}
                  {conversation.viewerContext.tag === 'new-user' && (
                    <Text style={[t.texts.primary, { fontSize: 12 }]}>
                      New user
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }

        return null;
      }, [
        conversation.viewerContext.category,
        conversation.viewerContext.tag,
        counterParty,
        t.borderDefault,
        t.borderHairline,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.justifyEnd,
        t.pX2,
        t.texts.primary,
        t.wFull,
        t.backgrounds.secondary,
      ]);

      // We want to avoid passing conversation in directly to
      // DirectCastConversationAvatar in favor of teasing apart individual
      // properties. I'm not sure why and when we started doing this, but it
      // seems intentional, and likely indicates that the larger object changes
      // more frequently than its individual properties
      const conversationForAvatar = React.useMemo(
        () => ({
          isGroup: conversation.isGroup,
          photoUrl: conversation.photoUrl,
          viewerContext: {
            counterParty: conversation.viewerContext.counterParty,
          },
        }),
        [
          conversation.isGroup,
          conversation.photoUrl,
          conversation.viewerContext.counterParty,
        ],
      );

      const render = useMemo(() => {
        let innerConverastionView: React.ReactNode | undefined = undefined;

        if (
          conversation.viewerContext.category === 'request' &&
          shouldShowConversationTag
        ) {
          innerConverastionView = (
            <View style={[t.pX3, t.wFull, t.flex, t.flexRow, t.overflowHidden]}>
              <View style={[t.flexNone, t.pY2, { height: 80 }, t.mR2]}>
                <DirectCastConversationAvatar
                  conversation={conversationForAvatar}
                />
              </View>
              <View
                style={[
                  borderStyle !== 'none' && [
                    t.borderDefault,
                    borderStyle === 'top'
                      ? t.borderTHairline
                      : t.borderBHairline,
                  ],
                  t.flex1,
                  t.hFull,
                  t.pY2,
                  t.relative,
                  { height: 80 },
                ]}
              >
                <View style={[t.flex, t.flexRow, t.hFull]}>
                  <PlaintextLastDirectCast
                    skipLastMessagePreviewRender={false}
                    currentUserFid={currentUserFid}
                    conversationName={conversation.name}
                    conversationCounterParty={counterParty}
                    conversationIsGroup={conversation.isGroup}
                    conversationHasMentions={
                      conversation.viewerContext.unreadMentionsCount !== 0
                    }
                    conversationIsMuted={conversation.viewerContext.muted}
                    conversationIsPinned={conversation.viewerContext.pinned}
                    conversationManuallyMarkedUnread={
                      conversation.viewerContext.manuallyMarkedUnread
                    }
                    conversationOtherPartyLastReadTime={
                      conversation.lastReadTime
                    }
                    conversationSelfLastReadTime={
                      conversation.viewerContext.lastReadAt
                    }
                    conversationUnreadCount={
                      conversation.viewerContext.unreadCount
                    }
                    conversationUnreadReactionMessage={
                      conversation.viewerContext.unreadReactionMessage
                    }
                    messageAffected={messageAffected}
                    conversationLastMessageMessage={
                      conversation.lastMessage?.message
                    }
                    conversationLastMessageSenderFid={
                      conversation.lastMessage?.senderFid
                    }
                    conversationLastMessageSenderUsername={
                      messageSender?.username
                    }
                    conversationLastMessageServerTimestamp={
                      conversation.lastMessage?.serverTimestamp ||
                      conversation.createdAt
                    }
                    conversationLastMessageType={conversation.lastMessage?.type}
                    parseMatchedSearchTermsFromLastMessage={
                      parseMatchedSearchTermsFromLastMessage
                    }
                  />
                </View>
                {followersYouKnowFooter}
              </View>
            </View>
          );
        } else {
          innerConverastionView = (
            <View style={[t.pX3, t.wFull, t.flex, t.flexRow, t.overflowHidden]}>
              <View style={[t.flexNone, t.pY2, { height: 80 }, t.mR2]}>
                <DirectCastConversationAvatar
                  conversation={conversationForAvatar}
                />
              </View>
              <View
                style={[
                  borderStyle !== 'none' && [
                    t.borderDefault,
                    borderStyle === 'top'
                      ? t.borderTHairline
                      : t.borderBHairline,
                  ],
                  t.flex1,
                  t.hFull,
                  t.pY2,
                  t.relative,
                  { height: 80 },
                ]}
              >
                <View style={[t.flex, t.flexRow, t.hFull]}>
                  <PlaintextLastDirectCast
                    skipLastMessagePreviewRender={false}
                    currentUserFid={currentUserFid}
                    conversationName={conversation.name}
                    conversationCounterParty={counterParty}
                    conversationIsGroup={conversation.isGroup}
                    conversationHasMentions={
                      conversation.viewerContext.unreadMentionsCount !== 0
                    }
                    conversationIsMuted={conversation.viewerContext.muted}
                    conversationIsPinned={conversation.viewerContext.pinned}
                    conversationManuallyMarkedUnread={
                      conversation.viewerContext.manuallyMarkedUnread
                    }
                    conversationOtherPartyLastReadTime={
                      conversation.lastReadTime
                    }
                    conversationSelfLastReadTime={
                      conversation.viewerContext.lastReadAt
                    }
                    conversationUnreadCount={
                      conversation.viewerContext.unreadCount
                    }
                    conversationUnreadReactionMessage={
                      conversation.viewerContext.unreadReactionMessage
                    }
                    messageAffected={messageAffected}
                    conversationLastMessageMessage={
                      conversation.lastMessage?.message
                    }
                    conversationLastMessageSenderFid={
                      conversation.lastMessage?.senderFid
                    }
                    conversationLastMessageSenderUsername={
                      messageSender?.username
                    }
                    conversationLastMessageServerTimestamp={
                      conversation.lastMessage?.serverTimestamp ||
                      conversation.createdAt
                    }
                    conversationLastMessageType={conversation.lastMessage?.type}
                    parseMatchedSearchTermsFromLastMessage={
                      parseMatchedSearchTermsFromLastMessage
                    }
                  />
                </View>
              </View>
            </View>
          );
        }

        return (
          <Pressable
            onPress={navigateToConversation}
            onLongPress={manageConversationPress}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? t.colors.bgHover : undefined,
                opacity: pressed ? 0.75 : 1,
              },
              pressed
                ? {
                    transform: [{ scale: 0.98 }],
                  }
                : {},
            ]}
          >
            {innerConverastionView}
          </Pressable>
        );
      }, [
        conversation.viewerContext.category,
        conversation.viewerContext.unreadMentionsCount,
        conversation.viewerContext.muted,
        conversation.viewerContext.pinned,
        conversation.viewerContext.manuallyMarkedUnread,
        conversation.viewerContext.lastReadAt,
        conversation.viewerContext.unreadCount,
        conversation.viewerContext.unreadReactionMessage,
        conversation.name,
        conversation.isGroup,
        conversation.lastReadTime,
        conversation.lastMessage?.message,
        conversation.lastMessage?.senderFid,
        conversation.lastMessage?.serverTimestamp,
        conversation.lastMessage?.type,
        conversation.createdAt,
        shouldShowConversationTag,
        navigateToConversation,
        manageConversationPress,
        t.colors.bgHover,
        t.pX3,
        t.wFull,
        t.flex,
        t.flexRow,
        t.overflowHidden,
        t.flexNone,
        t.pY2,
        t.mR2,
        t.borderDefault,
        t.borderTHairline,
        t.borderBHairline,
        t.flex1,
        t.hFull,
        t.relative,
        borderStyle,
        currentUserFid,
        counterParty,
        messageAffected,
        messageSender?.username,
        followersYouKnowFooter,
        parseMatchedSearchTermsFromLastMessage,
        conversationForAvatar,
      ]);

      return render;
    },
  );

PlaintextDirectCastConversationListItem.displayName =
  'PlaintextDirectCastConversationListItem';

export {
  CacheIgnoringPlaintextDirectCastConversationListItem,
  PlaintextDirectCastConversationListItem,
};
