import type { ApiGroupInviteEmbed } from 'farcaster-client-data';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import { MessageSquareIcon, Users2Icon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const DirectCastGroupInviteEmbeds: React.FC<{
  groupInviteEmbeds: ApiGroupInviteEmbed[];
}> = React.memo(({ groupInviteEmbeds }) => {
  const t = useTheme();

  return (
    <View style={[t.flexCol]}>
      {groupInviteEmbeds.map((groupInvite) => (
        <DirectCastGroupInviteEmbed
          key={groupInvite.inviteCode}
          groupInvite={groupInvite}
        />
      ))}
    </View>
  );
});

DirectCastGroupInviteEmbeds.displayName = 'DirectCastGroupInviteEmbeds';

const DirectCastGroupInviteEmbed: React.FC<{
  groupInvite: ApiGroupInviteEmbed;
}> = React.memo(({ groupInvite }) => {
  const t = useTheme();
  const navigate = useNavigate();

  const onPressJoin = React.useCallback(() => {
    navigate('DirectCastsGroupInvite', {
      inviteCode: groupInvite.inviteCode,
    });
  }, [groupInvite.inviteCode, navigate]);

  return (
    <View
      style={[
        t.flexRow,
        t.justifyStart,
        t.roundedLg,
        t.bgDefault,
        t.mY1,
        { height: 94, maxWidth: '100%' },
      ]}
    >
      <View style={[t.mY2, t.mL2, t.justifyCenter, t.roundedLg]}>
        <GroupConversationImage
          imageURL={groupInvite.imageUrl}
          diameter={80}
          roundedSize="lg"
        />
      </View>
      <View style={[t.flexRow, t.justifyStart, t.itemsCenter, t.flex1]}>
        <View style={[t.mX3, t.flexCol, t.flexShrink, t.flexGrow]}>
          <View style={[t.flexRow, t.itemsCenter]}>
            <Text
              style={[t.textLg, t.fontSemibold, t.mR1, t.mB1, t.texts.primary]}
              numberOfLines={1}
            >
              {groupInvite.name}
            </Text>
          </View>
          {groupInvite.description && (
            <Text
              style={[t.texts.primary, t.textSm, t.mB1, { maxWidth: '95%' }]}
              numberOfLines={2}
            >
              {groupInvite.description}
            </Text>
          )}
          {typeof groupInvite.numParticipants === 'number' &&
            groupInvite.numParticipants > 0 && (
              <View style={[t.flexRow, t.itemsCenter]}>
                <Users2Icon style={[t.mR1, t.texts.secondary]} size={14} />
                <Text
                  numberOfLines={1}
                  style={[
                    t.texts.primary,
                    t.textSm,
                    t.texts.secondary,
                    t.fontSemibold,
                  ]}
                >
                  {formatShorthandNumber(groupInvite.numParticipants)}
                  <Text style={[t.texts.secondary, t.textSm, t.mL1]}>
                    {' '}
                    members
                  </Text>
                </Text>
              </View>
            )}
        </View>
        <View style={[t.mR3]}>
          <AtomsButton
            onPress={onPressJoin}
            size="s"
            hierarchy="primary"
            Icon={({ size, color }) => (
              <MessageSquareIcon size={size} color={color} />
            )}
          >
            Join
          </AtomsButton>
        </View>
      </View>
    </View>
  );
});

DirectCastGroupInviteEmbed.displayName = 'DirectCastGroupInviteEmbed';

export { DirectCastGroupInviteEmbeds };
