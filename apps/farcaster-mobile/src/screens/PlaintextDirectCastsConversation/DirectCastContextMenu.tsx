import { Octicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import {
  useDeleteDirectCastMessage,
  useDirectCastConversation,
  usePinDirectCastMessage,
  useUnpinDirectCastMessage,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  InboxPinnedIconEmpty,
  InboxPinnedSlashIcon,
} from '~/screens/PlaintextDirectCasts/PlaintextLastDirectCast';

import { SetReplyTo } from './PlaintextDirectCastsConversationScreen';

type DirectCastContextMenuProps = {
  currentUserFid: number;
  directCast: ApiDirectCastMessageV3;
  directCastDisplayName: string;
  conversationId: string;
  conversationHasPinnedMessages: boolean;
  viewerCanPinMessages: boolean;
  viewerCanDeleteMessage: boolean;
  setReplyTo: SetReplyTo;
  onMenuItemClick: () => void;
  hideUrlPreviewForViewer?: () => void;
};

const DirectCastContextMenu: React.FC<DirectCastContextMenuProps> = React.memo(
  ({
    currentUserFid,
    directCast,
    directCastDisplayName,
    conversationHasPinnedMessages,
    conversationId,
    viewerCanPinMessages,
    viewerCanDeleteMessage,
    setReplyTo,
    onMenuItemClick,
    hideUrlPreviewForViewer,
  }) => {
    const t = useTheme();

    const toast = useRootToast();

    const { trackEvent } = useAnalytics();

    const pinDirectCastMessage = usePinDirectCastMessage();
    const unpinDirectCastMessage = useUnpinDirectCastMessage();
    const deleteDirectCastMessage = useDeleteDirectCastMessage();
    const { data: conversation } = useDirectCastConversation({
      conversationId,
    });

    const onPinMessage = React.useCallback(
      async ({ message }: { message: ApiDirectCastMessageV3 }) => {
        trackEvent(AnalyticsEvent.PinDirectCastMessage, {});

        if (conversationHasPinnedMessages) {
          Alert.alert('Replace last pinned message?', '', [
            { text: 'Cancel' },
            {
              text: 'Continue',
              isPreferred: true,
              onPress: async () => {
                void pinDirectCastMessage({
                  conversationId: conversationId,
                  message,
                });
              },
            },
          ]);
        } else {
          void pinDirectCastMessage({
            conversationId: conversationId,
            message,
          });
        }
      },
      [
        conversationHasPinnedMessages,
        conversationId,
        pinDirectCastMessage,
        trackEvent,
      ],
    );

    const onUnpinMessage = React.useCallback(
      async ({ message }: { message: ApiDirectCastMessageV3 }) => {
        trackEvent(AnalyticsEvent.UnpinDirectCastMessage, {});

        void unpinDirectCastMessage({
          fid: currentUserFid,
          conversationId: conversationId,
          message,
        });
      },
      [conversationId, currentUserFid, trackEvent, unpinDirectCastMessage],
    );

    const deleteMessage = React.useCallback(
      async ({ message }: { message: ApiDirectCastMessageV3 }) => {
        if (
          conversation?.isGroup &&
          conversation?.viewerContext.access !== 'admin' &&
          message.senderFid !== currentUserFid
        ) {
          return;
        }

        if (!conversation?.isGroup && message.senderFid !== currentUserFid) {
          return;
        }

        void deleteDirectCastMessage({
          conversationId: conversationId,
          messageId: message.messageId,
        });
      },
      [
        conversation?.isGroup,
        conversation?.viewerContext.access,
        conversationId,
        currentUserFid,
        deleteDirectCastMessage,
      ],
    );

    const showUserMessage = React.useCallback(
      ({
        message,
        type,
      }: {
        message: string;
        type: 'normal' | 'success' | 'danger' | 'warning';
      }) => {
        toast.show(message, { placement: 'top', type: type });
      },
      [toast],
    );

    return (
      <View style={[t.p1, t.pX2, t.flex, t.flexCol]}>
        <TouchableOpacity
          style={[
            t.p2,
            t.borderB,
            t.borderBHairline,
            t.borderDefault,
            t.flex,
            t.flexRowReverse,
            t.justifyBetween,
            t.wFull,
          ]}
          onPress={() => {
            Clipboard.setStringAsync(directCast.message);
            showUserMessage({
              message: 'Copied message to clipboard',
              type: 'success',
            });
            onMenuItemClick();
          }}
        >
          <View style={[t.flex, t.flexCol, t.justifyCenter, t.pL1, t.pR2]}>
            <Octicons name="copy" style={[t.texts.primary]} size={16} />
          </View>
          <Text style={[t.textLg, t.texts.primary]}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            (viewerCanPinMessages || viewerCanDeleteMessage) && [
              t.borderB,
              t.borderBHairline,
              t.borderDefault,
            ],
            t.p2,
            t.flex,
            t.flexRowReverse,
            t.justifyBetween,
            t.wFull,
          ]}
          onPress={() => {
            setReplyTo({
              directCast,
              replyToSenderDisplayName: directCastDisplayName,
            });

            onMenuItemClick();
          }}
        >
          <View style={[t.flex, t.flexCol, t.justifyCenter, t.pL1, t.pR2]}>
            <Octicons name="reply" style={[t.texts.primary]} size={16} />
          </View>
          <Text style={[t.textLg, t.texts.primary]}>Reply</Text>
        </TouchableOpacity>
        {typeof hideUrlPreviewForViewer !== 'undefined' && (
          <TouchableOpacity
            style={[
              t.p2,
              t.flex,
              t.flexRowReverse,
              t.justifyBetween,
              t.wFull,
              (viewerCanPinMessages || viewerCanDeleteMessage) && [
                t.borderB,
                t.borderBHairline,
                t.borderDefault,
              ],
            ]}
            onPress={() => {
              hideUrlPreviewForViewer();
              onMenuItemClick();
              showUserMessage({
                message: 'Link preview hidden for you',
                type: 'success',
              });
            }}
          >
            <View style={[t.flex, t.flexCol, t.justifyCenter, t.pL1, t.pR2]}>
              <Octicons name="eye-closed" style={[t.texts.primary]} size={16} />
            </View>
            <Text style={[t.textLg, t.texts.primary]}>Hide link preview</Text>
          </TouchableOpacity>
        )}
        {viewerCanPinMessages && (
          <TouchableOpacity
            style={[
              viewerCanDeleteMessage && [
                t.borderB,
                t.borderBHairline,
                t.borderDefault,
              ],
              t.p2,
              t.flex,
              t.flexRowReverse,
              t.wFull,
              t.justifyBetween,
            ]}
            onPress={() => {
              if (directCast.isPinned) {
                onUnpinMessage({ message: directCast });
              } else {
                onPinMessage({ message: directCast });
              }

              onMenuItemClick();
            }}
          >
            <View
              style={[
                t.relative,
                t.flex,
                t.flexCol,
                t.justifyCenter,
                t.pL1,
                t.pR2,
              ]}
            >
              {directCast.isPinned ? (
                <>
                  <InboxPinnedSlashIcon fill={t.colors.text.primary} />
                </>
              ) : (
                <InboxPinnedIconEmpty fill={t.colors.text.primary} />
              )}
            </View>
            <Text style={[t.textLg, t.texts.primary]}>
              {directCast.isPinned ? 'Unpin' : 'Pin'}
            </Text>
          </TouchableOpacity>
        )}
        {viewerCanDeleteMessage && (
          <TouchableOpacity
            style={[t.p2, t.flex, t.flexRowReverse, t.wFull, t.justifyBetween]}
            onPress={() => {
              Alert.alert('Delete message for everyone?', '', [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes',
                  style: 'default',
                  onPress: async () => {
                    deleteMessage({ message: directCast });

                    onMenuItemClick();
                  },
                },
              ]);
            }}
          >
            <View
              style={[
                t.relative,
                t.flex,
                t.flexCol,
                t.justifyCenter,
                t.pL1,
                t.pR2,
              ]}
            >
              <Octicons name="trash" size={16} style={[t.texts.danger]} />
            </View>
            <Text style={[t.textLg, t.texts.danger]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

export { DirectCastContextMenu };
