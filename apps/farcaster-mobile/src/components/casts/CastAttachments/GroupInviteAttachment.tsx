import { Octicons } from '@expo/vector-icons';
import type { ApiGroupInviteEmbed } from 'farcaster-client-data';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const GroupInviteAttachment: React.FC<{
  groupInvite: ApiGroupInviteEmbed;
  disabled?: boolean;
  slim?: boolean;
  hideButton?: boolean;
}> = React.memo(({ groupInvite, disabled, slim, hideButton }) => {
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
        t.borderHairline,
        t.bgDefault,
        t.borderDefault,
        t.mY1,
        t.flex1,
        { height: slim ? 60 : 94, maxWidth: '100%' },
      ]}
    >
      <View
        style={[t.justifyCenter, t.roundedLg, slim ? [t.mL1] : [t.mY2, t.mL2]]}
      >
        <GroupConversationImage
          imageURL={groupInvite.imageUrl}
          diameter={slim ? 50 : 80}
          roundedSize="lg"
        />
      </View>
      <View style={[t.flexRow, t.justifyStart, t.itemsCenter, t.flex1]}>
        <View style={[t.mX3, t.flexCol, t.flexShrink, t.flexGrow]}>
          <View style={[t.flexRow, t.itemsCenter]}>
            <Text
              style={[
                slim ? t.textSm : t.textLg,
                t.fontSemibold,
                t.mR1,
                t.mB1,
                t.texts.primary,
              ]}
              numberOfLines={1}
            >
              {groupInvite.name}
            </Text>
          </View>
          {!slim && groupInvite.description && (
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
                <Octicons
                  style={[t.mR1, t.texts.secondary]}
                  name="people"
                  size={slim ? 12 : 14}
                />
                <Text
                  style={[
                    slim ? t.textXs : t.textSm,
                    t.texts.secondary,
                    t.mR1,
                    t.fontSemibold,
                  ]}
                >
                  {formatShorthandNumber(groupInvite.numParticipants)}
                </Text>
                <Text style={[t.texts.secondary, slim ? t.textXs : t.textSm]}>
                  members
                </Text>
              </View>
            )}
        </View>
        {!hideButton && (
          <View style={[slim ? [t.mR2] : [t.mR3]]}>
            <Button
              variant="normal"
              size={slim ? 'xs' : 'sm'}
              onPress={onPressJoin}
              title="Join"
              octiconName="comment"
              disabled={disabled}
            />
          </View>
        )}
      </View>
    </View>
  );
});

GroupInviteAttachment.displayName = 'GroupInviteAttachment';

export { GroupInviteAttachment };
