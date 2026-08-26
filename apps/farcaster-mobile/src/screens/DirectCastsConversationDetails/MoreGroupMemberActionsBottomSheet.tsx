import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationInfoV3,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';
import { useChangeMemberInPlaintextDirectCastGroup } from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';
import { Alert, View } from 'react-native';

import { BottomSheetContentContainer } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { CastAvatar } from '~/components/casts/CastAvatar';
import { Heading } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

interface MoreGroupMemberActionsBottomSheetProps {
  user: ApiUser | ApiUserMinimal;
  conversation: ApiDirectCastConversationInfoV3;
  onDismiss: () => void;
}

const MoreGroupMemberActionsBottomSheet = ({
  user,
  conversation,
  onDismiss,
}: MoreGroupMemberActionsBottomSheetProps) => {
  const t = useTheme();
  const currentUser = useCurrentUser_UNSAFE();
  const { trackEvent } = useAnalytics();
  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();
  const isAdmin = conversation?.adminFids.indexOf(user.fid) !== -1;

  const onDemotePress = useCallback(() => {
    Alert.alert(
      `Are you sure you want to demote ${user.username} from admin?`,
      '',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            if (typeof conversation === 'undefined') {
              return;
            }

            trackEvent(AnalyticsEvent.RemoveMemberDirectCastsGroup, {});

            try {
              await changeMembershipInPlaintextDirectCastGroup({
                senderContext: {
                  fid: currentUser.fid,
                  displayName: currentUser.displayName,
                  username: currentUser.username,
                },
                conversationId: conversation.conversationId,
                action: 'demote',
                participants: [user as ApiUser],
              });
            } catch (e) {
              Alert.alert(
                'Failed to demote',
                `We failed to demote ${user.username}.`,
              );
            } finally {
              onDismiss();
            }
          },
        },
      ],
    );
  }, [
    changeMembershipInPlaintextDirectCastGroup,
    conversation,
    currentUser.fid,
    currentUser.displayName,
    currentUser.username,
    trackEvent,
    user,
    onDismiss,
  ]);

  const onPromotePress = useCallback(() => {
    Alert.alert(
      `Are you sure you want to promote ${user.username} to admin?`,
      '',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Promote',
          style: 'default',
          onPress: async () => {
            if (typeof conversation === 'undefined') {
              return;
            }

            trackEvent(AnalyticsEvent.PromoteMemberDirectCastsGroup, {});

            try {
              await changeMembershipInPlaintextDirectCastGroup({
                senderContext: {
                  fid: currentUser.fid,
                  displayName: currentUser.displayName,
                  username: currentUser.username,
                },
                conversationId: conversation.conversationId,
                action: 'promote',
                participants: [user as ApiUser],
              });
            } catch (e) {
              Alert.alert(
                'Failed to promote to admin',
                `We failed to promote ${user.username} to an admin, ` +
                  'potentially because their DC settings require them to ' +
                  'follow you.',
              );
            } finally {
              onDismiss();
            }
          },
        },
      ],
    );
  }, [
    changeMembershipInPlaintextDirectCastGroup,
    conversation,
    currentUser.fid,
    currentUser.displayName,
    currentUser.username,
    trackEvent,
    user,
    onDismiss,
  ]);

  const onRemovePress = useCallback(() => {
    Alert.alert(`Are you sure you want to remove ${user.username}?`, '', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (typeof conversation === 'undefined') {
            return;
          }

          trackEvent(AnalyticsEvent.RemoveMemberDirectCastsGroup, {});

          try {
            await changeMembershipInPlaintextDirectCastGroup({
              senderContext: {
                fid: currentUser.fid,
                displayName: currentUser.displayName,
                username: currentUser.username,
              },
              conversationId: conversation.conversationId,
              action: 'remove',
              participants: [user as ApiUser],
            });
          } catch (e) {
            Alert.alert(
              'Failed to remove',
              `We failed to remove ${user.username}.`,
            );
          } finally {
            onDismiss();
          }
        },
      },
    ]);
  }, [
    changeMembershipInPlaintextDirectCastGroup,
    conversation,
    currentUser.fid,
    currentUser.displayName,
    currentUser.username,
    trackEvent,
    user,
    onDismiss,
  ]);

  const options = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    opts.push({
      label: isAdmin ? 'Dismiss as Admin' : 'Make Group Admin',
      icon: ({ size }) => {
        const name = isAdmin ? 'arrow-down' : 'arrow-up';
        return <Ionicons name={name} size={size} />;
      },
      onPress: () => {
        if (isAdmin) {
          onDemotePress();
        } else {
          onPromotePress();
        }
      },
      enableHaptics: true,
    });

    opts.push({
      label: 'Remove from Group',
      icon: ({ size }) => (
        <Ionicons name="person-remove" size={size} style={[t.texts.danger]} />
      ),
      onPress: onRemovePress,
      enableHaptics: true,
      destructive: true,
    });

    return opts;
  }, [isAdmin, onDemotePress, onPromotePress, onRemovePress, t.texts.danger]);

  return (
    <AutoDisplayingBottomSheetModal
      onDismiss={onDismiss}
      name="MoreGroupMemberActionsBottomSheet"
    >
      <BottomSheetContentContainer>
        <View
          style={[
            t.pY2,
            t.flex,
            t.flexCol,
            t.itemsCenter,
            t.justifyCenter,
            { gap: 12 },
          ]}
        >
          <CastAvatar avatarDiameter={80} user={user as ApiUser} disabled />
          <Heading style={[{ fontSize: 24 }]}>{user.username}</Heading>
        </View>
        <View style={[t.pT4]}>
          <ButtonGroup options={options} />
        </View>
      </BottomSheetContentContainer>
    </AutoDisplayingBottomSheetModal>
  );
};

export { MoreGroupMemberActionsBottomSheet };
