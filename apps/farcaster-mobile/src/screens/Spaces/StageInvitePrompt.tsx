import { Octicons } from '@expo/vector-icons';
import { ApiAudioRoomPromoteRole, ApiUser } from 'farcaster-client-data';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { Avatar } from '~/components/Avatar';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';

const ACTION_PRIMARY = '#7c65c1';
const BACKDROP_COLOR = 'rgba(0,0,0,0.5)';
const PRIMARY_TEXT_COLOR = '#ffffff';

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

const StageInvitePrompt: React.FC<{
  pendingInvite: { role: ApiAudioRoomPromoteRole; inviterFid: number } | null;
  inviterUser?: ApiUser;
  isSubmitting?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ pendingInvite, inviterUser, isSubmitting, onAccept, onDecline }) => {
  const c = useColors();
  const handleDecline = React.useCallback(() => {
    if (isSubmitting) return;
    onDecline();
  }, [isSubmitting, onDecline]);
  if (!pendingInvite) return null;

  const isCohostInvite = pendingInvite.role === 'cohost';

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleDecline}
          disabled={isSubmitting}
        />
        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
          <View style={styles.grabberWrap}>
            <View style={[styles.grabber, { backgroundColor: c.border }]} />
          </View>

          <View style={[styles.header, { borderColor: c.border }]}>
            <View style={styles.headerLeft}>
              <Octicons
                name={isCohostInvite ? 'shield-check' : 'unmute'}
                size={15}
                color={c.fg}
              />
              <Text style={[styles.headerTitle, { color: c.fg }]}>
                {isCohostInvite ? 'Invite to co-host' : 'Invite to speak'}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.userRow}>
              {inviterUser ? (
                <Avatar pfpUrl={inviterUser.pfp?.url} diameter={48} />
              ) : (
                <View
                  style={[
                    styles.fallbackAvatar,
                    { backgroundColor: c.bgSecondary, borderColor: c.border },
                  ]}
                />
              )}
              <View style={{ marginLeft: 12 }}>
                <SpaceUserDisplayNameWithProBadge
                  user={inviterUser}
                  fallbackName="Space host"
                  badgeSize={14}
                  textStyle={[styles.userName, { color: c.fg }]}
                />
                <Text style={[styles.userHandle, { color: c.fgFaint }]}>
                  {inviterUser?.username
                    ? `@${inviterUser.username}`
                    : `fid:${pendingInvite.inviterFid}`}
                </Text>
              </View>
            </View>

            <View
              style={[styles.explainer, { backgroundColor: c.bgSecondary }]}
            >
              <Text style={[styles.explainerText, { color: c.fgFaint }]}>
                {isCohostInvite
                  ? 'Accept to join the stage with co-host controls.'
                  : 'Accept to join the stage and start speaking.'}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleDecline}
                disabled={isSubmitting}
                style={[
                  styles.cancelButton,
                  { borderColor: c.border, opacity: isSubmitting ? 0.5 : 1 },
                ]}
              >
                <Text style={[styles.cancelText, { color: c.fg }]}>
                  Decline
                </Text>
              </Pressable>
              <Pressable
                onPress={onAccept}
                disabled={isSubmitting}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: c.actionPrimary,
                    opacity: isSubmitting ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP_COLOR,
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
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fallbackAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  userName: { fontSize: 15, fontWeight: '600' },
  userHandle: { fontSize: 12, marginTop: 2 },
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryText: { color: PRIMARY_TEXT_COLOR, fontWeight: '700', fontSize: 14 },
});

export { StageInvitePrompt };
