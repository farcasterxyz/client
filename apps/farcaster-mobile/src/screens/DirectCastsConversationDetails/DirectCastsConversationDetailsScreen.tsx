import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastGroupInvitee,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';
import {
  useDirectCastConversation,
  useGetDirectCastGroupInvites,
  usePlaintextDirectCastGroupInvite,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { useState } from 'react';
import { FlatList, View } from 'react-native';

import { Empty } from '~/components/Empty';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import type { PlaintextDirectCastsStackParamList } from '~/types';

import {
  DirectCastsConversationDetailsGroupActionsRow,
  directCastsConversationDetailsGroupActionsRowHeight,
} from './DirectCastsConversationDetailsGroupActionsRow';
import {
  DirectCastsConversationDetailsInfoRow,
  directCastsConversationDetailsInfoRowHeight,
} from './DirectCastsConversationDetailsInfoRow';
import {
  DirectCastsConversationDetailsInviteLinkRow,
  directCastsConversationDetailsInviteLinkRowHeight,
} from './DirectCastsConversationDetailsInviteLinkRow';
import {
  DirectCastsConversationDetailsMemberListHeaderRow,
  directCastsConversationDetailsMemberListHeaderRowHeight,
} from './DirectCastsConversationDetailsMemberListHeaderRow';
import {
  DirectCastsConversationDetailsMemberRow,
  directCastsConversationDetailsMemberRowHeight,
} from './DirectCastsConversationDetailsMemberRow';
import { MoreGroupMemberActionsBottomSheet } from './MoreGroupMemberActionsBottomSheet';

type DirectCastsConversationDetailsScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsConversationDetailsScreen'
>;

const DirectCastsConversationDetailsScreen =
  buildScreen<DirectCastsConversationDetailsScreenProps>(
    { name: 'DirectCastsConversationDetailsScreen' },
    ({
      route: {
        params: { conversationId },
      },
    }) => {
      return (
        <React.Suspense>
          <DirectCastsConversationDetails conversationId={conversationId} />
        </React.Suspense>
      );
    },
  );

DirectCastsConversationDetailsScreen.displayName = 'DirectCasts';

type DirectCastsConversationDetailsProps = {
  conversationId: string;
};

const DirectCastsConversationDetails: React.FC<
  DirectCastsConversationDetailsProps
> = ({ conversationId }) => {
  const t = useTheme();

  const { data: conversation } = useDirectCastConversation({
    conversationId,
  });

  if (typeof conversation === 'undefined') {
    return (
      <View style={[t.hFull]}>
        <Empty message="No group info found." />
      </View>
    );
  }

  return <DirectCastsConversationDetailsContent conversation={conversation} />;
};

type DirectCastsConversationDetailsRow =
  | {
      itemType: 'info';
      conversation: ApiDirectCastConversationInfoV3;
    }
  | {
      itemType: 'group_actions';
      conversation: ApiDirectCastConversationInfoV3;
    }
  | {
      itemType: 'invite_link';
      conversation: ApiDirectCastConversationInfoV3;
    }
  | {
      itemType: 'member_list_header_row';
      memberCount: number;
    }
  | {
      itemType: 'member';
      user: ApiUser | ApiUserMinimal;
      conversation: ApiDirectCastConversationInfoV3;
      groupInvites?: ApiDirectCastGroupInvitee[];
      onPressMember: (user: ApiUser | ApiUserMinimal) => void;
    };

function renderItem({ item }: { item: DirectCastsConversationDetailsRow }) {
  if (item.itemType === 'info') {
    return (
      <DirectCastsConversationDetailsInfoRow conversation={item.conversation} />
    );
  } else if (item.itemType === 'group_actions') {
    return (
      <DirectCastsConversationDetailsGroupActionsRow
        conversation={item.conversation}
      />
    );
  } else if (item.itemType === 'invite_link') {
    return (
      <DirectCastsConversationDetailsInviteLinkRow
        conversation={item.conversation}
      />
    );
  } else if (item.itemType === 'member_list_header_row') {
    return (
      <DirectCastsConversationDetailsMemberListHeaderRow
        memberCount={item.memberCount}
      />
    );
  } else if (item.itemType === 'member') {
    return (
      <DirectCastsConversationDetailsMemberRow
        user={item.user}
        conversation={item.conversation}
        groupInvites={item.groupInvites}
        onPressMember={item.onPressMember}
      />
    );
  }
  throw new Error('unrecognized itemType');
}

function keyExtractor(item: DirectCastsConversationDetailsRow) {
  if (item.itemType === 'member') {
    return userKeyExtractor(item.user);
  } else {
    return item.itemType;
  }
}

function getItemHeight(item: DirectCastsConversationDetailsRow) {
  if (item.itemType === 'info') {
    return directCastsConversationDetailsInfoRowHeight;
  } else if (item.itemType === 'group_actions') {
    return directCastsConversationDetailsGroupActionsRowHeight;
  } else if (item.itemType === 'invite_link') {
    return directCastsConversationDetailsInviteLinkRowHeight;
  } else if (item.itemType === 'member_list_header_row') {
    return directCastsConversationDetailsMemberListHeaderRowHeight;
  } else if (item.itemType === 'member') {
    return directCastsConversationDetailsMemberRowHeight;
  }
  throw new Error('unrecognized itemType');
}

function getItemLayout(
  data: ArrayLike<DirectCastsConversationDetailsRow> | null | undefined,
  index: number,
) {
  if (!data) {
    return { length: 0, offset: 0, index };
  }
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += getItemHeight(data[i]);
  }
  return {
    offset,
    length: getItemHeight(data[index]),
    index,
  };
}

const DirectCastsConversationDetailsContent: React.FC<{
  conversation: ApiDirectCastConversationInfoV3;
}> = React.memo(({ conversation }) => {
  const t = useTheme();
  const push = usePush();
  const { setOptions } = useNavigation();

  const currentUser = useCurrentUser_UNSAFE();
  const currentUserFid = currentUser.fid;

  const [selectedMember, setSelectedMember] = useState<
    ApiUser | ApiUserMinimal | undefined
  >(undefined);

  const { data: groupInvites } = useGetDirectCastGroupInvites({
    conversationId: conversation.conversationId,
    enabled: conversation.viewerContext.access === 'admin',
  });

  const members = React.useMemo(() => {
    const currentUserFromParticipants =
      conversation?.participants.find(
        ({ fid }) =>
          fid === currentUserFid && !conversation.removedFids.includes(fid),
      ) || undefined;

    const adminsFromParticipants = conversation.participants.filter(
      ({ fid }) =>
        fid !== currentUserFid &&
        conversation.adminFids.includes(fid) &&
        !conversation.removedFids.includes(fid),
    );

    const rest = conversation.participants.filter(
      ({ fid }) =>
        fid !== currentUserFid &&
        !conversation.removedFids.includes(fid) &&
        !conversation.adminFids.includes(fid),
    );

    return [
      ...(currentUserFromParticipants ? [currentUserFromParticipants] : []),
      ...(groupInvites?.map(
        (invite: ApiDirectCastGroupInvitee) => invite.invitee,
      ) || []),
      ...adminsFromParticipants,
      ...rest,
    ];
  }, [conversation, currentUserFid, groupInvites]);

  const isGroupInviteRequest =
    conversation?.viewerContext.category === 'request' && conversation?.isGroup;

  const isAdmin = React.useMemo(() => {
    if (typeof conversation === 'undefined') {
      return false;
    }

    return conversation.viewerContext.access === 'admin';
  }, [conversation]);

  const { data: invite } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    conversationId: conversation.conversationId,
  });
  const inviteCode = invite?.inviteCode;
  const shouldShowInviteLinkRow = isAdmin || inviteCode;

  const [showMoreGroupMemberActions, setShowMoreGroupMemberActions] =
    React.useState(false);

  const onPressMember = React.useCallback((user: ApiUser | ApiUserMinimal) => {
    setSelectedMember(user);
    setShowMoreGroupMemberActions(true);
  }, []);

  const onEditGroupPress = React.useCallback(() => {
    push('DirectCastsGroupEdit', {
      conversationId: conversation.conversationId,
    });
  }, [conversation.conversationId, push]);

  React.useEffect(() => {
    if (isAdmin || !conversation.isGroup) {
      setOptions({
        headerRight: () => (
          <HeaderRightSubmit
            disabled={false}
            onPress={onEditGroupPress}
            actionTextOverload="Edit"
          />
        ),
      });
    }
  }, [conversation.isGroup, isAdmin, onEditGroupPress, setOptions]);

  const memberCount = members.length - (groupInvites?.length || 0);

  const data = React.useMemo(() => {
    const data: DirectCastsConversationDetailsRow[] = [
      {
        itemType: 'info',
        conversation,
      },
    ];
    if (!isGroupInviteRequest) {
      data.push({
        itemType: 'group_actions',
        conversation,
      });
      if (shouldShowInviteLinkRow) {
        data.push({
          itemType: 'invite_link',
          conversation,
        });
      }
    }
    data.push({
      itemType: 'member_list_header_row',
      memberCount,
    });
    for (const user of members) {
      data.push({
        itemType: 'member',
        user,
        conversation,
        groupInvites,
        onPressMember,
      });
    }
    return data;
  }, [
    conversation,
    isGroupInviteRequest,
    shouldShowInviteLinkRow,
    memberCount,
    members,
    groupInvites,
    onPressMember,
  ]);

  const flatListStyle = React.useMemo(
    () => [t.borderTHairline, t.borderDefault],
    [t.borderTHairline, t.borderDefault],
  );

  const flatListContentContainerStyle = React.useMemo(
    () => [t.pT5, t.pB3, t.pX4],
    [t.pT5, t.pB3, t.pX4],
  );

  return (
    <>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={flatListStyle}
        contentContainerStyle={flatListContentContainerStyle}
      />
      {showMoreGroupMemberActions && selectedMember && (
        <MoreGroupMemberActionsBottomSheet
          user={selectedMember}
          conversation={conversation}
          onDismiss={() => setShowMoreGroupMemberActions(false)}
        />
      )}
    </>
  );
});

export { DirectCastsConversationDetailsScreen };
