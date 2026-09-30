import { Octicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ApiDirectCastMessageMetadata, ApiUser } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  useNonSuspenseSearchUsers,
  userKeyExtractor,
  useSendDirectCast,
} from 'farcaster-client-hooks';
import { generateMessageId } from 'farcaster-cryptography';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { ShareActionButton } from '~/components/casts/CastActions/ShareActionsBar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useHaptics } from '~/hooks/useHaptics';
import { MAX_DIRECT_CAST_TEXT_LENGTH } from '~/utils/CastUtils';
import { shareUrl } from '~/utils/SharingUtils';

const MAX_NUM_SELECTED_TARGETS = 12;

function getSpaceInviteUrl(roomId: string) {
  return `https://farcaster.xyz/~/spaces/${roomId}`;
}

type SpaceShareSheetProps = {
  open: boolean;
  roomId: string;
  roomTitle?: string;
  onClose: () => void;
  onInviteSent?: (count: number) => void;
  onCopyLink?: () => void;
  onShareLink?: () => void;
};

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    border: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
    inputBg: isDark ? '#2a2a2a' : '#f4f4f4',
    primary: '#7c65c1',
  };
}

export const SpaceShareSheet: React.FC<SpaceShareSheetProps> = React.memo(
  ({
    open,
    roomId,
    roomTitle,
    onClose,
    onInviteSent,
    onCopyLink,
    onShareLink,
  }) => {
    const c = useColors();
    const toast = useToast();
    const currentUser = useCurrentUser();
    const sendDirectCast = useSendDirectCast();
    const { triggerImpactAsync } = useHaptics();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<ApiUser[]>([]);
    const [directCastMessage, setDirectCastMessage] = useState('');
    const [copiedSpaceURL, setCopiedSpaceURL] = useState(false);

    const {
      data: searchedUsersData,
      isFetchingNextPage,
      onEndReached,
    } = useNonSuspenseSearchUsers({
      q: searchQuery,
      excludeSelf: true,
      includeDirectCastAbility: true,
    });

    const users = useMemo(() => {
      const allUsers =
        searchedUsersData?.pages.flatMap((page) => page.result.users) ?? [];
      return allUsers.filter(
        (user, index, arr) =>
          arr.findIndex((o) => o.fid === user.fid) === index,
      );
    }, [searchedUsersData]);

    const selectedFids = useMemo(
      () => selectedUsers.map((user) => user.fid),
      [selectedUsers],
    );
    const spaceUrl = useMemo(() => getSpaceInviteUrl(roomId), [roomId]);
    const messageInputMaxLength = useMemo(() => {
      const urlLength = spaceUrl.length;
      // Outgoing payload is "<spaceUrl> <optionalMessage>".
      return Math.max(0, MAX_DIRECT_CAST_TEXT_LENGTH - urlLength - 1);
    }, [spaceUrl]);

    const toggleUser = useCallback((user: ApiUser) => {
      setSelectedUsers((prev) => {
        if (prev.some((selected) => selected.fid === user.fid)) {
          return prev.filter((selected) => selected.fid !== user.fid);
        }
        if (prev.length >= MAX_NUM_SELECTED_TARGETS) {
          return prev;
        }
        return [...prev, user];
      });
    }, []);

    useEffect(() => {
      if (open) {
        return;
      }
      setSearchQuery('');
      setSelectedUsers([]);
      setDirectCastMessage('');
      setCopiedSpaceURL(false);
    }, [open]);

    const onCopySpaceURL = useCallback(() => {
      triggerImpactAsync();

      void Clipboard.setStringAsync(spaceUrl);
      setCopiedSpaceURL(true);
      onCopyLink?.();

      toast.show('Link copied to clipboard', {
        duration: 3000,
        placement: 'bottom',
      });

      setTimeout(() => {
        setCopiedSpaceURL(false);
      }, 3000);
    }, [onCopyLink, spaceUrl, toast, triggerImpactAsync]);

    const onShareSpaceURL = useCallback(() => {
      triggerImpactAsync();
      onShareLink?.();

      shareUrl({
        title: roomTitle || 'Space',
        url: spaceUrl,
      })
        .catch(() => {})
        .finally(onClose);
    }, [onClose, onShareLink, roomTitle, spaceUrl, triggerImpactAsync]);

    const onSendPress = useCallback(() => {
      if (selectedFids.length === 0) {
        return;
      }

      const viewer = currentUser;
      if (!viewer) {
        toast.show('Failed to send invites', { type: 'danger' });
        return;
      }

      const trimmedMessage = directCastMessage.trim();
      const message =
        trimmedMessage.length > 0 ? `${spaceUrl} ${trimmedMessage}` : spaceUrl;
      const optimisticMetadata: ApiDirectCastMessageMetadata = {
        urls: [
          {
            type: 'url',
            openGraph: {
              url: spaceUrl,
              sourceUrl: spaceUrl,
              domain: 'farcaster.xyz',
              title: roomTitle || 'Farcaster Space',
            },
          },
        ],
      };

      const messageSenderContext = {
        displayName: viewer.displayName,
        fid: viewer.fid,
        pfp: viewer.pfp,
        username: viewer.username,
      };

      const cappedSelectedFids = selectedFids.slice(
        0,
        MAX_NUM_SELECTED_TARGETS,
      );

      onClose();
      setSelectedUsers([]);
      setSearchQuery('');
      setDirectCastMessage('');

      void Promise.allSettled(
        cappedSelectedFids.map(async (targetFid) => {
          const { error } = await sendDirectCast({
            data: {
              conversationId: buildNonGroupConversationId({
                participantFids: [targetFid, viewer.fid],
              }),
              fid: viewer.fid,
              recipientFids: [targetFid],
              messageId: generateMessageId(),
              message,
              type: 'text',
              conversationCategory: 'default',
              optimisticMetadata,
              senderContext: messageSenderContext,
            },
          });
          if (error) {
            throw error;
          }
        }),
      ).then((sendResults) => {
        const sentCount = sendResults.filter(
          (result) => result.status === 'fulfilled',
        ).length;
        const failedCount = sendResults.length - sentCount;

        if (sentCount > 0) {
          onInviteSent?.(sentCount);
          toast.show(
            failedCount === 0
              ? sentCount === 1
                ? 'Direct cast sent'
                : 'Direct casts sent'
              : `Sent ${sentCount} of ${sendResults.length} invites`,
            { type: failedCount === 0 ? 'success' : 'warning' },
          );
        }

        if (failedCount > 0 && sentCount === 0) {
          toast.show('Failed to send invites', { type: 'danger' });
        }
      });
    }, [
      currentUser,
      directCastMessage,
      onClose,
      onInviteSent,
      roomTitle,
      selectedFids,
      sendDirectCast,
      spaceUrl,
      toast,
    ]);

    return (
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: c.bg }]}>
            <View style={styles.grabberWrap}>
              <View style={[styles.grabber, { backgroundColor: c.border }]} />
            </View>

            <View style={[styles.header, { borderBottomColor: c.border }]}>
              <Text style={[styles.headerTitle, { color: c.fg }]}>
                Share Space
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Octicons name="x" size={18} color={c.fgFaint} />
              </Pressable>
            </View>

            <Text style={[styles.subtitle, { color: c.fgFaint }]}>
              Send this Space to specific users.
              {roomTitle ? ` (${roomTitle})` : ''}
            </Text>

            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: c.inputBg,
                  color: c.fg,
                  borderColor: c.border,
                },
              ]}
              placeholder="Search users"
              placeholderTextColor={c.fgFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {selectedUsers.length > 0 ? (
              <View style={styles.selectedSection}>
                <Text style={[styles.selectedTitle, { color: c.fgFaint }]}>
                  Selected
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedScrollContent}
                >
                  {selectedUsers.map((user) => (
                    <Pressable
                      key={`selected-user-${user.fid}`}
                      onPress={() => toggleUser(user)}
                      style={[
                        styles.selectedChip,
                        {
                          backgroundColor: c.inputBg,
                          borderColor: c.border,
                        },
                      ]}
                    >
                      <Avatar pfpUrl={user.pfp?.url} diameter={22} />
                      <SpaceUserDisplayNameWithProBadge
                        user={user}
                        name={`@${user.username}`}
                        badgeSize={10}
                        textStyle={[styles.selectedChipLabel, { color: c.fg }]}
                      />
                      <Octicons name="x" size={12} color={c.fgFaint} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <FlatList
              data={users}
              keyExtractor={userKeyExtractor}
              keyboardShouldPersistTaps="handled"
              style={styles.usersList}
              onEndReached={onEndReached}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: c.fgFaint }]}>
                  {searchQuery.trim().length === 0
                    ? 'Search for users to invite'
                    : 'No users found'}
                </Text>
              }
              renderItem={({ item, index }) => {
                const isSelected = selectedFids.includes(item.fid);
                return (
                  <Pressable
                    onPress={() => toggleUser(item)}
                    style={[
                      styles.userRow,
                      {
                        borderBottomColor: c.border,
                      },
                      {
                        borderBottomWidth:
                          index === users.length - 1
                            ? 0
                            : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Avatar pfpUrl={item.pfp?.url} diameter={36} />
                    <View style={styles.userTextWrap}>
                      <SpaceUserDisplayNameWithProBadge
                        user={item}
                        badgeSize={13}
                        textStyle={[styles.userName, { color: c.fg }]}
                      />
                      <Text style={[styles.userHandle, { color: c.fgFaint }]}>
                        @{item.username}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Octicons
                        name="check-circle-fill"
                        size={18}
                        color={c.primary}
                      />
                    ) : (
                      <Octicons name="circle" size={18} color={c.fgFaint} />
                    )}
                  </Pressable>
                );
              }}
            />

            {isFetchingNextPage ? (
              <Text style={[styles.loadingMore, { color: c.fgFaint }]}>
                Loading more...
              </Text>
            ) : null}

            {selectedFids.length > 0 ? (
              <>
                <TextInput
                  style={[
                    styles.messageInput,
                    {
                      backgroundColor: c.inputBg,
                      color: c.fg,
                      borderColor: c.border,
                    },
                  ]}
                  placeholder="Add a message (optional)"
                  placeholderTextColor={c.fgFaint}
                  value={directCastMessage}
                  onChangeText={setDirectCastMessage}
                  maxLength={messageInputMaxLength}
                  multiline
                />

                <Pressable
                  onPress={onSendPress}
                  style={[styles.sendButton, { backgroundColor: c.primary }]}
                >
                  <Text style={styles.sendButtonText}>
                    {selectedFids.length <= 1
                      ? 'Send direct cast'
                      : 'Send direct casts'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.shareActions}>
                <ShareActionButton
                  iconName={copiedSpaceURL ? 'check' : 'link'}
                  label={copiedSpaceURL ? 'Copied!' : 'Copy link'}
                  onPress={onCopySpaceURL}
                />
                <ShareActionButton
                  iconName="share"
                  label="Share to"
                  onPress={onShareSpaceURL}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

SpaceShareSheet.displayName = 'SpaceShareSheet';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    paddingHorizontal: 16,
    maxHeight: '85%',
  },
  grabberWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  grabber: { width: 42, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, marginBottom: 10 },
  selectedSection: { marginBottom: 10 },
  selectedTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  selectedScrollContent: { paddingRight: 4, gap: 8 },
  selectedChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedChipLabel: { fontSize: 12, fontWeight: '500' },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  usersList: {
    maxHeight: 260,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  userTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  userName: { fontSize: 15, fontWeight: '600' },
  userHandle: { fontSize: 13, marginTop: 2 },
  loadingMore: { textAlign: 'center', fontSize: 12, marginBottom: 6 },
  messageInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 72,
  },
  shareActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  sendButton: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
