import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import {
  useGloballyCachedUser,
  useNonSuspenseUserByFid,
} from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { Avatar } from '~/components/Avatar';
import { ButtonV2 } from '~/components/ButtonV2';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import { FollowersYouKnowSection } from '~/components/UserProfile/headerSections/FollowersYouKnowSection';
import { FollowButton } from '~/components/users/FollowButton';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    bgSecondary: isDark ? '#2a2a2a' : '#f2f2f2',
  };
}

const UserProfileSheet: React.FC<{
  user: ApiUser | null;
  onClose: () => void;
}> = React.memo(({ user, onClose }) => {
  return (
    <Modal
      visible={!!user}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {user && (
          <UserProfileSheetContent fallbackUser={user} onClose={onClose} />
        )}
      </View>
    </Modal>
  );
});

const UserProfileSheetContent: React.FC<{
  fallbackUser: ApiUser;
  onClose: () => void;
}> = React.memo(({ fallbackUser, onClose }) => {
  const c = useColors();
  const pushToUserProfile = usePushToUserProfile();
  const cachedUser = useGloballyCachedUser({ fallback: fallbackUser });
  const { data: canonicalUserData } = useNonSuspenseUserByFid({
    fid: fallbackUser.fid,
    enabled: !!fallbackUser.fid,
  });
  const user = canonicalUserData?.result.user ?? cachedUser;

  const handleOpenProfile = useCallback(() => {
    if (!user) return;
    onClose();
    pushToUserProfile({ fid: user.fid });
  }, [onClose, pushToUserProfile, user]);

  return (
    <View style={[styles.sheet, { backgroundColor: c.bg }]}>
      <View style={styles.grabberWrap}>
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
      </View>
      <View style={[styles.header, { borderColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.fg }]}>Profile</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Octicons name="x" size={18} color={c.fg} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.userRow}>
          <Avatar pfpUrl={user.pfp?.url} diameter={64} />
          <View style={styles.userTextWrap}>
            <SpaceUserDisplayNameWithProBadge
              user={user}
              badgeSize={15}
              textStyle={[styles.userName, { color: c.fg }]}
            />
            <Text style={[styles.userHandle, { color: c.fgFaint }]}>
              @{user.username}
            </Text>
          </View>
          <FollowButton
            targetUser={user}
            presentation="standalone"
            size="normal"
          />
        </View>

        {!!user.viewerContext?.followedBy && (
          <View
            style={[
              styles.followContextPill,
              { borderColor: c.border, backgroundColor: c.bgSecondary },
            ]}
          >
            <Text style={[styles.followContextText, { color: c.fgFaint }]}>
              Follows you
            </Text>
          </View>
        )}

        {!!user.profile.bio?.text && (
          <Text style={[styles.bioText, { color: c.fgFaint }]}>
            {user.profile.bio.text}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.fg }]}>
              {user.followingCount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: c.fgFaint }]}>
              Following
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.fg }]}>
              {user.followerCount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: c.fgFaint }]}>
              Followers
            </Text>
          </View>
        </View>

        <FollowersYouKnowSection user={user} />

        <ButtonV2
          title="Open profile"
          variant="secondary"
          onPress={handleOpenProfile}
          height="normal"
          width="full"
        />
      </View>
    </View>
  );
});

UserProfileSheet.displayName = 'UserProfileSheet';

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
  headerTitle: { fontSize: 15, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userTextWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: '700' },
  userHandle: { fontSize: 13, marginTop: 2 },
  followContextPill: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  followContextText: { fontSize: 11, fontWeight: '500' },
  bioText: { fontSize: 13, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statItem: { minWidth: 72 },
  statValue: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
});

export { UserProfileSheet };
