import { Ionicons } from '@expo/vector-icons';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastGroupInvitee,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';
import { resolveUsername, useGloballyCachedUser } from 'farcaster-client-hooks';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text, Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

const directCastsConversationDetailsMemberRowHeight = 64;

const DirectCastsConversationDetailsMemberRow: React.FC<{
  user: ApiUser | ApiUserMinimal;
  conversation: ApiDirectCastConversationInfoV3;
  groupInvites?: ApiDirectCastGroupInvitee[];
  onPressMember: (user: ApiUser | ApiUserMinimal) => void;
}> = React.memo(
  ({ conversation, user: userFallback, groupInvites, onPressMember }) => {
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();

    const user = useGloballyCachedUser({ fallback: userFallback as ApiUser });
    const { fid, pfp } = user;

    const currentUser = useCurrentUser_UNSAFE();
    const currentUserFid = currentUser.fid;

    const viewerIsAdmin = conversation.viewerContext.access === 'admin';

    let youPill;
    if (user.fid === currentUserFid) {
      youPill = (
        <View style={[t.justifyCenter, t.bgMuted, t.p1, t.roundedLg, t.mR2]}>
          <Text style={[t.texts.primary, t.textXs]}>Me</Text>
        </View>
      );
    }

    const userAction = React.useMemo(() => {
      const userIsInvited = groupInvites?.some(
        (invite: ApiDirectCastGroupInvitee) => invite.invitee.fid === user.fid,
      );

      const userIsAdmin = conversation.adminFids.indexOf(user.fid) !== -1;
      if (userIsAdmin && !viewerIsAdmin) {
        return (
          <View style={[t.hFull, t.flex, t.flexCol, t.justifyCenter]}>
            <Text style={[t.texts.secondary, t.textSm, t.selfCenter]}>
              Admin
            </Text>
          </View>
        );
      }

      if (viewerIsAdmin) {
        return (
          <View style={[t.hFull, t.flex, t.flexCol, t.justifyCenter]}>
            <View style={[t.flex, t.flexRow]}>
              {userIsAdmin && (
                <Text style={[t.texts.secondary, t.textSm, t.selfCenter]}>
                  Admin
                </Text>
              )}
              {userIsInvited && (
                <Text style={[t.texts.secondary, t.textSm, t.selfCenter]}>
                  Invited
                </Text>
              )}
              {!userIsInvited && user.fid !== currentUserFid && (
                <Pressable
                  style={[t.pX2]}
                  onPress={() => {
                    onPressMember(user);
                  }}
                >
                  <Ionicons
                    pointerEvents="none"
                    name="ellipsis-horizontal"
                    size={16}
                    style={[t.texts.tertiary]}
                  />
                </Pressable>
              )}
            </View>
          </View>
        );
      }

      return <></>;
    }, [
      user,
      groupInvites,
      conversation,
      currentUserFid,
      viewerIsAdmin,
      onPressMember,
      t.hFull,
      t.flex,
      t.flexCol,
      t.justifyCenter,
      t.texts.secondary,
      t.textSm,
      t.selfCenter,
      t.flexRow,
      t.pX2,
      t.texts.tertiary,
    ]);

    return (
      <Pressable
        style={[
          t.flex,
          t.flexRow,
          t.flexShrink,
          t.pY2,
          { height: directCastsConversationDetailsMemberRowHeight },
        ]}
        onPress={() => {
          pushToUserProfile({ fid });
        }}
      >
        <Avatar pfpUrl={pfp?.url} />
        <View style={[t.flex, t.flexGrow, t.flexRow, t.justifyBetween, t.mL3]}>
          <View style={[t.flexCol]}>
            <Text2
              color="primary"
              weight="semibold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user.displayName}
            </Text2>
            <Text2
              weight="regular"
              size="sm"
              color="secondary"
              style={{ paddingTop: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {resolveUsername(user)}
            </Text2>
          </View>
          <View style={[t.m2, t.flexRow, t.itemsCenter]}>
            {youPill}
            {userAction}
          </View>
        </View>
      </Pressable>
    );
  },
);

export {
  DirectCastsConversationDetailsMemberRow,
  directCastsConversationDetailsMemberRowHeight,
};
