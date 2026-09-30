import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import {
  useAlterPlaintextDirectCastConversationCategory,
  useChangeMemberInPlaintextDirectCastGroup,
  useChangeNotificationsInPlaintextDirectCastConversation,
} from 'farcaster-client-hooks';
import * as React from 'react';
import { Alert, View } from 'react-native';
import { G, Path, Svg } from 'react-native-svg';

import { AddMembersIcon } from '~/components/DirectCasts/AddMembersIcon';
import { ScreenActionPressable } from '~/components/DirectCasts/ScreenActionPressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePayUser } from '~/contexts/PayUserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';

const directCastsConversationDetailsGroupActionsRowHeight = 92;

const DirectCastsConversationDetailsGroupActionsRow: React.FC<{
  conversation: ApiDirectCastConversationInfoV3;
}> = React.memo(({ conversation }) => {
  const t = useTheme();

  const currentUser = useCurrentUser_UNSAFE();
  const currentUserFid = currentUser.fid;

  const userCanAddMembers = (() => {
    if (!conversation) {
      return false;
    }
    return (
      conversation.viewerContext.access === 'admin' ||
      (typeof conversation.groupPreferences !== 'undefined' &&
        conversation.groupPreferences.membersCanInvite)
    );
  })();

  const push = usePush();
  const back = useGoBack();
  const navigate = useNavigate();

  const onAddMembersPress = React.useCallback(() => {
    push('PlaintextDirectCastsCreateConversationAddMembers', {
      conversationId: conversation.conversationId,
      excludeFids: conversation.participants
        .filter((p) => !conversation.removedFids.includes(p.fid))
        .map((p) => p.fid),
    });
  }, [conversation, push]);

  const conversationCounterParty = conversation.viewerContext.counterParty;
  const showPayUserButton = !conversation.isGroup && conversationCounterParty;
  const { launchPayUser } = usePayUser();

  const { trackEvent } = useAnalytics();

  const canLeaveConversation = !!conversation;
  const [leavingGroup, setLeavingGroup] = React.useState<boolean>(false);
  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();
  const onLeaveConversationPress = React.useCallback(async () => {
    if (!conversation || !canLeaveConversation) {
      return;
    }

    setLeavingGroup(true);

    trackEvent(AnalyticsEvent.LeaveDirectCastsGroup, {
      participant_count: conversation.participants.length,
    });

    try {
      await changeMembershipInPlaintextDirectCastGroup({
        senderContext: {
          fid: currentUserFid,
          displayName: currentUser.displayName,
          username: currentUser.username,
        },
        conversationId: conversation.conversationId,
        action: 'remove',
        participants: [currentUser],
      });

      navigate('PlaintextDirectCasts', {});
    } finally {
      setLeavingGroup(false);
    }
  }, [
    canLeaveConversation,
    changeMembershipInPlaintextDirectCastGroup,
    conversation,
    currentUser,
    currentUserFid,
    navigate,
    trackEvent,
  ]);
  const handleLeaveGroupPress = React.useCallback(async () => {
    if (
      conversation.viewerContext.access === 'admin' &&
      conversation.adminFids.length === 1 &&
      conversation.participants.length - conversation.removedFids.length > 1
    ) {
      Alert.alert(
        "You're the only group admin, please add another admin before leaving.",
        '',
        [{ style: 'default', text: 'OK' }],
      );
      return;
    }

    const warningMessage = conversation.isGroup
      ? 'Are you sure you want to leave this group?'
      : 'Are you sure you want to delete this conversation?';

    Alert.alert(warningMessage, '', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: conversation.isGroup ? 'Leave' : 'Delete',
        onPress: onLeaveConversationPress,
      },
    ]);
  }, [
    conversation.adminFids,
    conversation.participants.length,
    conversation.removedFids.length,
    conversation.viewerContext.access,
    onLeaveConversationPress,
    conversation.isGroup,
  ]);

  const [mutingGroup, setMutingGroup] = React.useState<boolean>(false);
  const changeNotificationsInDirectCastConversation =
    useChangeNotificationsInPlaintextDirectCastConversation();
  const onMuteConversationPress = React.useCallback(async () => {
    if (!conversation) {
      return;
    }

    if (!conversation.viewerContext.muted) {
      trackEvent(AnalyticsEvent.MuteDirectCastsGroup, {
        participant_count: conversation.participants.length,
      });
    }

    setMutingGroup(true);

    try {
      await changeNotificationsInDirectCastConversation({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        muted: !conversation.viewerContext.muted,
      });

      back();
    } finally {
      setMutingGroup(false);
    }
  }, [
    back,
    changeNotificationsInDirectCastConversation,
    conversation,
    currentUserFid,
    trackEvent,
  ]);

  const [archivingGroup, setArchivingGroup] = React.useState<boolean>(false);
  const alterPlaintextDirectCastConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();
  const onArchiveConversationPress = React.useCallback(async () => {
    if (!conversation) {
      return;
    }

    if (conversation.viewerContext.category === 'archived') {
      trackEvent(AnalyticsEvent.UnarchiveDirectCastsGroup, {
        participant_count: conversation.participants.length,
      });
    } else {
      trackEvent(AnalyticsEvent.ArchiveDirectCastsGroup, {
        participant_count: conversation.participants.length,
      });
    }

    setArchivingGroup(true);

    try {
      await alterPlaintextDirectCastConversationCategory({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        fromCategory: conversation.viewerContext.category,
        toCategory:
          conversation.viewerContext.category === 'archived'
            ? 'default'
            : 'archived',
      });

      navigate('PlaintextDirectCasts', {});
    } finally {
      setArchivingGroup(false);
    }
  }, [
    conversation,
    currentUserFid,
    trackEvent,
    navigate,
    alterPlaintextDirectCastConversationCategory,
  ]);

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.pT4,
        { height: directCastsConversationDetailsGroupActionsRowHeight },
      ]}
    >
      {userCanAddMembers && (
        <ScreenActionPressable
          loading={false}
          onPress={onAddMembersPress}
          title="Add user"
          variant="default"
          iconElement={
            <View
              style={[
                t.relative,
                t.roundedLg,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                {
                  width: 18,
                  height: 18,
                },
              ]}
              hitSlop={{ bottom: 12, top: 12, right: 12, left: 8 }}
            >
              <AddMembersIcon size={24} />
            </View>
          }
        />
      )}
      {showPayUserButton && (
        <ScreenActionPressable
          title="Pay"
          loading={false}
          onPress={() => {
            launchPayUser({
              user: conversationCounterParty,
              via: 'direct-cast-conversation',
            });
          }}
          variant="default"
          iconElement={
            <View
              style={[
                t.relative,
                t.roundedLg,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                {
                  width: 18,
                  height: 18,
                },
              ]}
              hitSlop={{ bottom: 12, top: 12, right: 12, left: 8 }}
            >
              <PayUserIcon />
            </View>
          }
        />
      )}
      {conversation.viewerContext.muted ? (
        <ScreenActionPressable
          title="Unmute"
          loading={mutingGroup}
          onPress={onMuteConversationPress}
          variant="default"
          iconName="bell"
        />
      ) : (
        <ScreenActionPressable
          title="Mute"
          loading={mutingGroup}
          onPress={() => {
            Alert.alert(
              'Are you sure you want to mute this conversation?',
              '',
              [
                { style: 'cancel', text: 'Cancel' },
                {
                  style: 'destructive',
                  text: 'Mute chat',
                  onPress: onMuteConversationPress,
                },
              ],
            );
          }}
          variant="default"
          iconName="bell-slash"
        />
      )}
      {conversation.viewerContext.category === 'archived' ? (
        <ScreenActionPressable
          title="Unarchive"
          loading={archivingGroup}
          onPress={onArchiveConversationPress}
          variant="default"
          iconName="archive"
        />
      ) : (
        <ScreenActionPressable
          title="Archive"
          loading={archivingGroup}
          onPress={() => {
            Alert.alert('Are you sure you want to archive this group?', '', [
              { style: 'cancel', text: 'Cancel' },
              {
                style: 'destructive',
                text: 'Archive',
                onPress: onArchiveConversationPress,
              },
            ]);
          }}
          variant="default"
          iconName="archive"
        />
      )}
      {canLeaveConversation && (
        <ScreenActionPressable
          title={conversation.isGroup ? 'Leave' : 'Delete'}
          loading={leavingGroup}
          onPress={handleLeaveGroupPress}
          variant="danger"
          iconName={conversation.isGroup ? 'sign-out' : 'trash'}
        />
      )}
    </View>
  );
});

const PayUserIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="32" height="26" viewBox="0 0 32 26" fill="none">
      <Path
        d="M16.0007 5.66682V20.3335M19.6673 9.9446C19.6673 8.25793 18.0259 6.88904 16.0007 6.88904C13.9754 6.88904 12.334 8.25793 12.334 9.9446C12.334 11.6313 13.9754 13.0002 16.0007 13.0002C18.0259 13.0002 19.6673 14.369 19.6673 16.0557C19.6673 17.7424 18.0259 19.1113 16.0007 19.1113C13.9754 19.1113 12.334 17.7424 12.334 16.0557"
        stroke={t.colors.text.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <G filter="url(#filter0_d_9614_17607)">
        <Path
          d="M10.5 3.47181C12.1715 2.5048 14.069 1.99704 16 2.00001C22.0753 2.00001 27 6.92471 27 13C27 19.0753 22.0753 24 16 24C9.9247 24 5 19.0753 5 13C5 10.9969 5.5357 9.11701 6.4718 7.50001"
          stroke={t.colors.text.primary}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
});

export {
  DirectCastsConversationDetailsGroupActionsRow,
  directCastsConversationDetailsGroupActionsRowHeight,
};
