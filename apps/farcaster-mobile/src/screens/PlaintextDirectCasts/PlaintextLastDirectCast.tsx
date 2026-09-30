import { Ionicons, Octicons } from '@expo/vector-icons';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageUserContext,
  ApiUser,
} from 'farcaster-client-data';
import {
  assertDirectCastMessageTypeOrThrow,
  isVerifiedSender,
  resolveUsernameShort,
} from 'farcaster-client-hooks';
import React, { ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { VerifiedSenderBadge } from '~/components/DirectCasts/VerifiedSenderBadge';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  useV3DirectCastCheckmarks,
  useV3DirectCastFormattedTimestamp,
} from '~/hooks/data/directCasts';
import { useUserLevel } from '~/hooks/data/useUserLevel';

export const InboxMutedIcon: React.FC = React.memo(() => {
  return (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.626 15.166C18.3022 15.4244 6.37669 2.99403 6.11836 2.67024C5.86002 2.34646 5.91308 1.87456 6.23686 1.61622C6.2538 1.60271 6.27081 1.58926 6.2879 1.5759C7.54645 0.591226 9.21083 0 11.0001 0C14.6816 0 18 2.56545 18 6V10.5389C18 11.1805 18.19 11.8078 18.5459 12.3417L19.8741 14.334C20.1039 14.6786 20.0107 15.1443 19.6661 15.374C19.3214 15.6038 18.8558 15.5107 18.626 15.166Z"
        fill={'#9FA3AF'}
      />
      <Path
        d="M0.21967 0.21967C0.512563 -0.0732233 0.987437 -0.0732233 1.28033 0.21967L21.7803 20.7197C22.0732 21.0126 22.0732 21.4874 21.7803 21.7803C21.4874 22.0732 21.0126 22.0732 20.7197 21.7803L16.9393 18H14.5H7.5H2.51759C1.67945 18 1 17.3206 1 16.4824C1 16.1828 1.08869 15.8899 1.25488 15.6406L3.45416 12.3417C3.81008 11.8078 4 11.1805 4 10.5389V6C4 5.70608 4.02504 5.41688 4.07334 5.134L0.21967 1.28033C-0.0732233 0.987437 -0.0732233 0.512563 0.21967 0.21967Z"
        fill={'#9FA3AF'}
      />
      <Path
        d="M12.0001 22.5C10.4146 22.5 9.07529 21.4457 8.64502 20H15.3551C14.9249 21.4457 13.5856 22.5 12.0001 22.5Z"
        fill={'#9FA3AF'}
      />
    </Svg>
  );
});

export const InboxPinnedIcon: React.FC = React.memo(() => {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.0745 0.762993C4.19659 0.762993 3.60804 1.66495 3.96161 2.46851L4.45083 3.58038C4.50409 3.7397 4.54493 3.90333 4.57553 4.06899C4.94066 6.0457 3.92176 8.01526 2.90503 9.74932V9.74932C2.45481 10.5597 3.04081 11.5556 3.96788 11.5556L7.67007 11.5556L7.66451 14.8662C7.66451 15.154 7.89781 15.3464 8.18559 15.3464C8.47337 15.3464 8.70667 15.154 8.70667 14.8662L8.71222 11.5556L12.4144 11.5556C13.3415 11.5556 13.9275 10.5597 13.4773 9.74932V9.74932C12.5098 8.013 11.5533 6.07768 11.8143 4.10725C11.8379 3.92852 11.8724 3.75195 11.9204 3.58038L12.4096 2.46851C12.7632 1.66495 12.1746 0.762993 11.2967 0.762994L5.0745 0.762993Z"
        fill={'#9FA3AF'}
      />
    </Svg>
  );
});

export const InboxPinnedSlashIcon: React.FC<{ fill?: string }> = React.memo(
  ({ fill }) => {
    return (
      <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.35355 0.646447C1.15829 0.451184 0.841709 0.451184 0.646447 0.646447C0.451184 0.841709 0.451184 1.15829 0.646447 1.35355L4.6345 5.34161C4.50406 6.88238 3.70472 8.38848 2.90671 9.74951C2.45649 10.5599 3.04248 11.5558 3.96955 11.5558L7.67174 11.5558L7.66619 14.8664C7.66619 15.1542 7.89948 15.3466 8.18727 15.3466C8.47505 15.3466 8.70834 15.1542 8.70834 14.8664L8.7139 11.5558L10.8487 11.5558L14.6464 15.3536C14.8417 15.5488 15.1583 15.5488 15.3536 15.3536C15.5488 15.1583 15.5488 14.8417 15.3536 14.6464L1.35355 0.646447ZM13.4789 9.74951C13.7302 10.2018 13.6587 10.7119 13.3852 11.0744L3.91796 1.60714C4.07229 1.13152 4.51514 0.763184 5.07617 0.763184H11.2984C12.1763 0.763184 12.7648 1.66514 12.4113 2.4687L11.922 3.58057C11.8741 3.75214 11.8396 3.92871 11.8159 4.10744C11.5549 6.07787 12.5115 8.01319 13.4789 9.74951Z"
          fill={fill || '#9FA3AF'}
        />
      </Svg>
    );
  },
);

export const InboxPinnedIconEmpty: React.FC<{ fill?: string }> = React.memo(
  ({ fill }) => {
    return (
      <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.63607 3.18402C5.62392 3.1477 5.61012 3.11196 5.5947 3.07691L5.12655 2.01294L11.2441 2.01294L10.7759 3.07691C10.7521 3.13112 10.7321 3.18695 10.7162 3.244C10.4711 4.12129 10.5008 5.03138 10.5688 5.72472C10.6036 6.07997 10.6519 6.40714 10.6903 6.66483C10.733 6.95127 10.7542 7.09887 10.7593 7.18458C10.7703 7.37237 10.8236 7.55525 10.9152 7.71958L12.356 10.3056H10V10.305H7V10.3056L4.02759 10.3056L5.52986 7.74342C5.6297 7.57314 5.6878 7.38163 5.69939 7.18458C5.70439 7.09956 5.72287 6.96656 5.75747 6.71746L5.75747 6.71742L5.7665 6.65244C5.80282 6.39063 5.84703 6.06009 5.87504 5.69963C5.92972 4.99604 5.93316 4.07275 5.63607 3.18402ZM12.4141 11.5556C13.3412 11.5556 13.9272 10.5597 13.477 9.74926L12.0071 7.11117C11.9983 6.96137 11.9675 6.75507 11.931 6.50992C11.8156 5.73571 11.6425 4.574 11.9201 3.58033L12.4093 2.46846C12.7629 1.66489 12.1743 0.762939 11.2964 0.762939H5.07422C4.19631 0.762939 3.60776 1.66489 3.96133 2.46846L4.45055 3.58033C4.79097 4.59865 4.62426 5.79345 4.51636 6.56681L4.51635 6.56683C4.48563 6.78706 4.45967 6.97311 4.45155 7.11118L2.90475 9.74926C2.45453 10.5597 3.04053 11.5556 3.9676 11.5556L6.41979 11.5556H7.46194H7.66979L7.66769 12.8056L7.66512 14.3372L7.66424 14.8644L7.66423 14.8661C7.66423 15.1539 7.89753 15.3463 8.18531 15.3463C8.47251 15.3463 8.70544 15.1547 8.70639 14.8679L8.70639 14.8661L8.70727 14.3392L8.71194 11.5573V11.5556H8.91979L12.4141 11.5556Z"
          fill={fill || '#9FA3AF'}
        />
      </Svg>
    );
  },
);

interface PlaintextLastDirectCastProps {
  skipLastMessagePreviewRender: boolean;
  currentUserFid: number;
  conversationName: ApiDirectCastConversationInfoV3['name'];
  conversationIsGroup: boolean;
  conversationIsPinned: boolean;
  conversationIsMuted: boolean;
  conversationHasMentions: boolean;
  conversationUnreadCount: number;
  conversationManuallyMarkedUnread: boolean;
  conversationUnreadReactionMessage: ApiDirectCastConversationInfoV3['viewerContext']['unreadReactionMessage'];
  conversationOtherPartyLastReadTime: ApiDirectCastConversationInfoV3['lastReadTime'];
  conversationSelfLastReadTime: ApiDirectCastConversationInfoV3['viewerContext']['lastReadAt'];
  conversationCounterParty: ApiUser | undefined;
  messageAffected: ApiDirectCastMessageUserContext | undefined;
  conversationLastMessageSenderFid: number | undefined;
  conversationLastMessageServerTimestamp: number | undefined;
  conversationLastMessageMessage: string | undefined;
  conversationLastMessageType: string | undefined;
  conversationLastMessageSenderUsername: string | undefined;
  parseMatchedSearchTermsFromLastMessage?: boolean;
}

const MessageText = (
  username: string,
  text: ReactNode,
  semicolon?: boolean,
) => {
  return (
    <>
      <Text style={[{ fontWeight: '500' }]}>
        {username}
        {semicolon ? ': ' : ' '}
      </Text>
      {text}
    </>
  );
};

const matchedSearchTermsTag = 'fc_highlight';

const PlaintextLastDirectCast: React.FC<PlaintextLastDirectCastProps> = ({
  skipLastMessagePreviewRender,
  currentUserFid,
  conversationName,
  conversationIsGroup,
  conversationIsPinned,
  conversationIsMuted,
  conversationHasMentions,
  conversationUnreadCount,
  conversationManuallyMarkedUnread,
  conversationUnreadReactionMessage,
  conversationOtherPartyLastReadTime,
  conversationSelfLastReadTime,
  conversationCounterParty,
  messageAffected,
  conversationLastMessageSenderFid,
  conversationLastMessageServerTimestamp,
  conversationLastMessageMessage,
  conversationLastMessageType,
  conversationLastMessageSenderUsername,
  parseMatchedSearchTermsFromLastMessage,
}) => {
  const t = useTheme();

  const unreadReactionMessage = useMemo(() => {
    const reactionMessage = conversationUnreadReactionMessage;
    return typeof reactionMessage !== 'undefined' &&
      reactionMessage.timestamp > conversationSelfLastReadTime
      ? reactionMessage
      : undefined;
  }, [conversationSelfLastReadTime, conversationUnreadReactionMessage]);

  const hasUnread = useMemo(
    () =>
      conversationUnreadCount > 0 ||
      typeof unreadReactionMessage !== 'undefined' ||
      conversationManuallyMarkedUnread,
    [
      conversationManuallyMarkedUnread,
      conversationUnreadCount,
      unreadReactionMessage,
    ],
  );

  const formattedUnreadCount = useMemo(
    () => (conversationUnreadCount >= 99 ? '99+' : conversationUnreadCount),
    [conversationUnreadCount],
  );

  const formattedTimestamp = useV3DirectCastFormattedTimestamp({
    selfDirectCast: conversationLastMessageSenderFid === currentUserFid,
    timestamp: conversationLastMessageServerTimestamp,
    hasUnread: hasUnread,
    applyInboxStyles: true,
    applyImageDirectCastStyles: false,
    muted: conversationIsMuted || skipLastMessagePreviewRender,
  });

  const checkmarks = useV3DirectCastCheckmarks({
    selfDirectCast: conversationLastMessageSenderFid === currentUserFid,
    timestamp: conversationLastMessageServerTimestamp,
    conversationOtherPartyLastReadTime: conversationOtherPartyLastReadTime,
    applyInboxStyles: true,
    applyImageDirectCastStyles: false,
  });

  const message = React.useMemo(() => {
    if (typeof unreadReactionMessage !== 'undefined') {
      const reactionMessage = unreadReactionMessage;

      const reactorDisplayName =
        unreadReactionMessage.fid === currentUserFid
          ? 'You'
          : unreadReactionMessage.username;
      const suffix =
        typeof reactionMessage.reactedMessage !== 'undefined'
          ? `to "${reactionMessage.reactedMessage}"`
          : '';
      return `${reactorDisplayName} reacted with ${reactionMessage.reaction} ${suffix}`;
    }

    if (
      typeof conversationLastMessageSenderFid === 'undefined' ||
      typeof conversationLastMessageMessage === 'undefined' ||
      typeof conversationLastMessageType === 'undefined'
    ) {
      return null;
    }

    try {
      assertDirectCastMessageTypeOrThrow({ type: conversationLastMessageType });
    } catch {
      return 'Message is not supported — please update Farcaster';
    }

    const shouldPrefixYou =
      conversationIsGroup &&
      conversationLastMessageSenderFid === currentUserFid;

    const senderUsername = shouldPrefixYou
      ? 'You'
      : conversationLastMessageSenderUsername || '';

    const shouldPrefixGroupParticipant =
      !shouldPrefixYou && conversationIsGroup;

    const isImageDirectCast = conversationLastMessageMessage.startsWith(
      'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw',
    );

    if (isImageDirectCast) {
      return MessageText(senderUsername, 'shared an image');
    }

    if (conversationLastMessageType === 'pin_message') {
      return MessageText(senderUsername, 'pinned a message');
    }
    if (
      conversationLastMessageType === 'group_membership_addition' &&
      conversationLastMessageMessage !== ''
    ) {
      const possiblyAffectedUser = messageAffected;

      if (typeof possiblyAffectedUser === 'undefined') {
        return null;
      }

      if (conversationLastMessageSenderFid !== possiblyAffectedUser.fid) {
        return MessageText(
          senderUsername,
          `added ${possiblyAffectedUser.username}`,
        );
      }

      if (possiblyAffectedUser.username) {
        return MessageText(possiblyAffectedUser.username, 'joined');
      }

      return null;
    }

    if (
      conversationLastMessageType === 'group_membership_removal' &&
      conversationLastMessageMessage !== ''
    ) {
      const possiblyAffectedUser = messageAffected;

      if (typeof possiblyAffectedUser === 'undefined') {
        return null;
      }

      if (conversationLastMessageSenderFid !== possiblyAffectedUser.fid) {
        return MessageText(
          senderUsername,
          `removed ${possiblyAffectedUser.username}`,
        );
      }

      if (possiblyAffectedUser.username) {
        return MessageText(possiblyAffectedUser.username, 'left', false);
      }

      return null;
    }

    if (conversationLastMessageType === 'group_name_change') {
      return MessageText(
        senderUsername,
        `changed group name to ${conversationLastMessageMessage}`,
      );
    }

    if (conversationLastMessageType === 'message_ttl_change') {
      if (conversationLastMessageMessage === 'Infinity') {
        return MessageText(senderUsername, 'set messages to never auto-delete');
      }
      const label = conversationLastMessageMessage === '1' ? 'day' : 'days';
      return MessageText(
        senderUsername,
        `set messages to auto-delete in ${conversationLastMessageMessage} ${label}`,
      );
    }

    // Search results have matched terms surrounded by <fc_highlight> tags
    let messagePreview: ReactNode = conversationLastMessageMessage;
    if (parseMatchedSearchTermsFromLastMessage) {
      const tag = matchedSearchTermsTag;

      // OpenSearch sometimes returns snippets that span multiple lines
      // We want to select the first line with a matched term
      const lines = conversationLastMessageMessage.trim().split('\n');
      const matchedLine = lines.find((line) => line.includes(`<${tag}>`));
      const lineToShow = matchedLine || lines[0] || '';

      // We want to bold the matched terms
      const parts = lineToShow.split(new RegExp(`(<${tag}>.*?</${tag}>)`, 'g'));
      messagePreview = parts.map((part, index) => {
        if (!part.startsWith(`<${tag}>`) || !part.endsWith(`</${tag}>`)) {
          return <Text key={index}>{part}</Text>;
        }
        const content = part.replace(new RegExp(`</?${tag}>`, 'g'), '');
        return (
          <Text key={index} style={[t.texts.primary, t.fontSemibold]}>
            {content}
          </Text>
        );
      });
    }

    if (shouldPrefixYou) {
      return MessageText('You', messagePreview, true);
    }

    if (shouldPrefixGroupParticipant) {
      return MessageText(senderUsername, messagePreview, true);
    }

    return messagePreview;
  }, [
    unreadReactionMessage,
    conversationLastMessageSenderFid,
    conversationLastMessageMessage,
    conversationLastMessageType,
    currentUserFid,
    conversationLastMessageSenderUsername,
    conversationIsGroup,
    messageAffected,
    parseMatchedSearchTermsFromLastMessage,
    t.texts.primary,
    t.fontSemibold,
  ]);

  const messageNumberOfLines = React.useMemo(() => {
    return message ? 2 : 1;
  }, [message]);

  const counterPartyIsProUser =
    useUserLevel(conversationCounterParty) === 'pro';

  const officialWarpcastAccountBadge = React.useMemo(() => {
    if (
      typeof conversationCounterParty !== 'undefined' &&
      !counterPartyIsProUser &&
      isVerifiedSender({
        conversationCounterPartyFid: conversationCounterParty.fid,
      })
    ) {
      return <VerifiedSenderBadge />;
    }

    return null;
  }, [conversationCounterParty, counterPartyIsProUser]);

  return (
    <>
      <View
        style={[t.flex, t.flexCol, t.itemsCenter, t.flexGrow, t.flexShrink]}
      >
        <View
          style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween, t.wFull]}
        >
          <View style={[t.flexRow, t.itemsCenter, t.flex1, t.mR2]}>
            {!conversationIsGroup && conversationCounterParty ? (
              <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                <Text
                  numberOfLines={1}
                  style={[
                    t.texts.primary,
                    t.fontSemibold,
                    t.flexShrink,
                    t.textBase,
                    { fontSize: 16, lineHeight: 22 },
                  ]}
                >
                  {resolveUsernameShort(conversationCounterParty)}
                </Text>
                {officialWarpcastAccountBadge}
                {counterPartyIsProUser && <FarcasterProBadge size={18} />}
              </View>
            ) : (
              <View
                style={[
                  t.flexRow,
                  t.flexShrink,
                  t.itemsCenter,
                  t.mR1,
                  { gap: 4 },
                ]}
              >
                <Ionicons name="people" size={14} style={[t.texts.primary]} />
                <Text
                  numberOfLines={1}
                  style={[
                    t.texts.primary,
                    t.fontSemibold,
                    t.flexShrink,
                    t.textBase,
                    { fontSize: 16, lineHeight: 22 },
                  ]}
                >
                  {conversationName ?? 'Group'}
                </Text>
              </View>
            )}
          </View>
          <View style={[t.itemsCenter, t.flex, t.flexRow]}>
            {formattedTimestamp}
          </View>
        </View>
        {!skipLastMessagePreviewRender && (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsStart,
              t.justifyBetween,
              t.wFull,
              { height: 36 },
            ]}
          >
            <Text
              numberOfLines={messageNumberOfLines}
              style={[
                t.flexShrink,
                t.texts.secondary,
                t.notItalic,
                { fontSize: 15, lineHeight: 18 },
                !message && [t.italic],
              ]}
            >
              {message ? message : 'No messages'}
            </Text>
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.selfEnd,
                { marginBottom: 3.125, gap: 8 },
              ]}
            >
              {
                <>
                  {(typeof unreadReactionMessage !== 'undefined' ||
                    conversationManuallyMarkedUnread) &&
                  formattedUnreadCount === 0 ? (
                    <View
                      style={[
                        {
                          backgroundColor: conversationIsMuted
                            ? t.dark
                              ? '#8B99A4'
                              : '#546473'
                            : '#7C65C1',
                        },
                        t.roundedFull,
                        t.itemsCenter,
                        t.justifyCenter,
                        t.flex,
                        t.flexRow,
                        t.pL1,
                        { height: 16, minWidth: 16, marginRight: 3 },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        t.pL1,
                        t.itemsCenter,
                        t.flex,
                        t.flexRow,
                        { gap: 8 },
                      ]}
                    >
                      {conversationIsPinned && <InboxPinnedIcon />}
                      {conversationIsMuted && <InboxMutedIcon />}
                      {!conversationIsPinned && !conversationIsMuted && (
                        <View style={[]}>{checkmarks}</View>
                      )}
                    </View>
                  )}
                  {conversationHasMentions && (
                    <View
                      style={[
                        conversationIsMuted
                          ? [t.opacity75, { backgroundColor: '#a0aec0' }]
                          : { backgroundColor: '#7C65C1' },
                        t.roundedFull,
                        t.itemsCenter,
                        t.justifyCenter,
                        t.flex,
                        t.flexRow,
                        { height: 20, minWidth: 20 },
                      ]}
                    >
                      <Text
                        style={[
                          t.texts.light,
                          t.textCenter,
                          { fontSize: 14, lineHeight: 20 },
                        ]}
                      >
                        <Octicons name="mention" size={10} />
                      </Text>
                    </View>
                  )}
                  {formattedUnreadCount !== 0 && (
                    <View
                      style={[
                        {
                          backgroundColor: conversationIsMuted
                            ? t.dark
                              ? '#8B99A4'
                              : '#546473'
                            : '#7C65C1',
                        },
                        t.roundedFull,
                        t.itemsCenter,
                        t.justifyCenter,
                        t.flex,
                        t.flexRow,
                        { height: 22, minWidth: 22 },
                        formattedUnreadCount !== '99+'
                          ? { aspectRatio: 1 }
                          : { paddingLeft: 6.5, paddingRight: 6.5 },
                      ]}
                    >
                      <Text
                        style={[
                          t.texts.light,
                          t.textCenter,
                          { fontSize: 14, lineHeight: 20 },
                        ]}
                      >
                        {formattedUnreadCount}
                      </Text>
                    </View>
                  )}
                </>
              }
            </View>
          </View>
        )}
      </View>
    </>
  );
};

export { PlaintextLastDirectCast };
