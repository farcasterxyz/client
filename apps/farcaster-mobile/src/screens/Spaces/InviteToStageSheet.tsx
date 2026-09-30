import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import { useAcceptSpeakerAudioRoom } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

const ACTION_PRIMARY = '#7c65c1';

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    bgSecondary: isDark ? '#2a2a2a' : '#f2f2f2',
    actionPrimary: ACTION_PRIMARY,
  };
}

/**
 * Bottom sheet that host/co-hosts use to invite a listener to the stage,
 * accept a raised hand, or promote directly to co-host. Pass `user` as null
 * to keep the sheet hidden.
 */
const InviteToStageSheet: React.FC<{
  user: ApiUser | null;
  roomId: string;
  /** Whether this user has a raised hand (changes the copy + action) */
  handRaised: boolean;
  /** Show the "Make Co-host instead" button (host only) */
  isHost?: boolean;
  /** Optional remove action for host or fallback co-host controls */
  onRemove?: () => Promise<void> | void;
  onClose: () => void;
}> = React.memo(({ user, roomId, handRaised, isHost, onRemove, onClose }) => {
  const c = useColors();
  const toast = useToast();
  const pushToUserProfile = usePushToUserProfile();
  const acceptSpeaker = useAcceptSpeakerAudioRoom();
  const [isSending, setIsSending] = useState(false);

  const handleViewProfile = useCallback(() => {
    if (!user) return;
    onClose();
    pushToUserProfile({ fid: user.fid });
  }, [onClose, pushToUserProfile, user]);

  const sendInvite = useCallback(async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await acceptSpeaker({ roomId, fid: user.fid });
      toast.show(
        handRaised
          ? `${user.displayName} brought up to speak`
          : `Invite sent — waiting for ${user.displayName} to accept`,
        { type: 'success' },
      );
      onClose();
    } catch {
      toast.show('Failed to invite speaker', { type: 'danger' });
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, handRaised, acceptSpeaker, onClose, toast]);

  const promoteCohost = useCallback(async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await acceptSpeaker({ roomId, fid: user.fid, role: 'cohost' });
      toast.show(`${user.displayName} is now a co-host`, { type: 'success' });
      onClose();
    } catch {
      toast.show('Failed to promote to co-host', { type: 'danger' });
    } finally {
      setIsSending(false);
    }
  }, [user, roomId, acceptSpeaker, onClose, toast]);

  return (
    <Modal
      visible={!!user}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {!!user && (
          <View style={[styles.sheet, { backgroundColor: c.bg }]}>
            <View style={styles.grabberWrap}>
              <View style={[styles.grabber, { backgroundColor: c.border }]} />
            </View>

            <View style={[styles.header, { borderColor: c.border }]}>
              <View style={styles.headerLeft}>
                <Octicons
                  name={handRaised ? 'megaphone' : 'unmute'}
                  size={15}
                  color={c.fg}
                />
                <Text style={[styles.headerTitle, { color: c.fg }]}>
                  {handRaised ? 'Bring up to speak' : 'Invite to the stage'}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <Octicons name="x" size={18} color={c.fg} />
              </Pressable>
            </View>

            <View style={styles.body}>
              <View style={styles.userRow}>
                <Pressable
                  onPress={handleViewProfile}
                  style={styles.userIdentityButton}
                >
                  <Avatar pfpUrl={user.pfp?.url} diameter={48} />
                  <View style={{ marginLeft: 12 }}>
                    <SpaceUserDisplayNameWithProBadge
                      user={user}
                      badgeSize={14}
                      textStyle={[styles.userName, { color: c.fg }]}
                    />
                    <Text style={[styles.userHandle, { color: c.fgFaint }]}>
                      @{user.username}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleViewProfile}
                  style={[
                    styles.viewProfileTopButton,
                    { borderColor: c.border, backgroundColor: c.bgSecondary },
                  ]}
                >
                  <Octicons name="person" size={14} color={c.fg} />
                  <Text
                    style={[styles.viewProfileTopButtonText, { color: c.fg }]}
                  >
                    View profile
                  </Text>
                </Pressable>
              </View>

              <View
                style={[styles.explainer, { backgroundColor: c.bgSecondary }]}
              >
                <Text style={[styles.explainerText, { color: c.fgFaint }]}>
                  {handRaised
                    ? 'They raised a hand to speak. Bringing them up unmutes their mic and adds them to the speaker grid.'
                    : "They'll be asked to accept before joining the stage. You can cancel the invite any time."}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={onClose}
                  style={[styles.cancelButton, { borderColor: c.border }]}
                >
                  <Text style={[styles.cancelText, { color: c.fg }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={sendInvite}
                  disabled={isSending}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: c.actionPrimary,
                      opacity: isSending ? 0.5 : 1,
                    },
                  ]}
                >
                  <Octicons name="unmute" size={13} color="white" />
                  <Text style={styles.primaryText}>
                    {handRaised ? 'Bring up' : 'Send invite'}
                  </Text>
                </Pressable>
              </View>

              {isHost && (
                <Pressable
                  onPress={promoteCohost}
                  disabled={isSending}
                  style={[
                    styles.cohostButton,
                    {
                      borderColor: c.border,
                      opacity: isSending ? 0.5 : 1,
                    },
                  ]}
                >
                  <Octicons name="shield-check" size={14} color={c.fg} />
                  <Text style={[styles.cohostText, { color: c.fg }]}>
                    Make Co-host instead
                  </Text>
                </Pressable>
              )}
              {onRemove && (
                <Pressable
                  onPress={async () => {
                    Alert.alert(
                      'Remove from Space?',
                      `Remove ${user.displayName} from this Space?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: async () => {
                            setIsSending(true);
                            try {
                              await onRemove();
                              toast.show(
                                `${user.displayName} removed from Space`,
                                { type: 'success' },
                              );
                              onClose();
                            } catch {
                              toast.show('Failed to remove participant', {
                                type: 'danger',
                              });
                            } finally {
                              setIsSending(false);
                            }
                          },
                        },
                      ],
                    );
                  }}
                  disabled={isSending}
                  style={[
                    styles.cohostButton,
                    {
                      borderColor: c.border,
                      opacity: isSending ? 0.5 : 1,
                    },
                  ]}
                >
                  <Octicons name="trash" size={14} color="#dc3412" />
                  <Text style={[styles.cohostText, { color: '#dc3412' }]}>
                    Remove from Space
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
});

InviteToStageSheet.displayName = 'InviteToStageSheet';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  grabberWrap: { alignItems: 'center', paddingTop: 8 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingVertical: 16 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  userIdentityButton: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userHandle: { fontSize: 12, marginTop: 2 },
  viewProfileTopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  viewProfileTopButtonText: { fontSize: 12, fontWeight: '600' },
  explainer: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  explainerText: { fontSize: 13, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '500' },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 14 },
  cohostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  cohostText: { fontSize: 14, fontWeight: '500' },
});

export { InviteToStageSheet };
