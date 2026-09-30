import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import {
  getSpecificallySizedImageUrl,
  isVerifiedSender,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';

import { INBOX_AVATAR_DIAMETER } from '~/components/DirectCasts/DirectCastConversationAvatar';
import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { VerifiedSenderBadge } from '~/components/DirectCasts/VerifiedSenderBadge';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { Text } from '~/components/Text';
import { UserUsername } from '~/components/users/UserUsername';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

type PlaintextDirectCastsConversationHeaderProps = {
  conversationId: string;
  conversationCounterParty: ApiUser | undefined;
  conversationIsGroup: boolean;
  conversationName: string | undefined;
  conversationActiveParticipantsCount: number;
  conversationPhotoUrl: string | undefined;
  conversationIsMuted: boolean;
};

const PlaintextDirectCastsConversationHeader: FC<PlaintextDirectCastsConversationHeaderProps> =
  memo(
    ({
      conversationId,
      conversationCounterParty,
      conversationIsGroup,
      conversationName,
      conversationActiveParticipantsCount,
      conversationPhotoUrl,
      conversationIsMuted,
    }) => {
      const t = useTheme();
      const push = usePush();
      const pushToUserProfile = usePushToUserProfile();

      const groupConversationName = React.useMemo(() => {
        return conversationName || 'Group';
      }, [conversationName]);

      const counterPartyAvatar = React.useMemo(() => {
        if (!conversationCounterParty) {
          return null;
        }

        const optimizedImageUrl = conversationCounterParty.pfp
          ? getSpecificallySizedImageUrl({
              staticRaster: conversationCounterParty.pfp.url,
              h: INBOX_AVATAR_DIAMETER,
              w: INBOX_AVATAR_DIAMETER,
            })
          : defaultAvatarUrl;

        return (
          <Pressable
            key={conversationCounterParty.fid}
            style={[t.flexRow, t.justifyCenter, t.itemsCenter]}
            onPress={() => {
              pushToUserProfile({ fid: conversationCounterParty.fid });
            }}
          >
            <SimplerRemoteImage
              uri={optimizedImageUrl}
              height={36}
              width={36}
              style={[
                t.borderDefault,
                t.borderHairline,
                t.roundedFull,
                t.flexShrink,
              ]}
            />
          </Pressable>
        );
      }, [
        conversationCounterParty,
        pushToUserProfile,
        t.borderDefault,
        t.borderHairline,
        t.flexRow,
        t.flexShrink,
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
      ]);

      const headerImage = React.useMemo(() => {
        if (conversationIsGroup) {
          return (
            <View style={[t.flexRow, t.justifyCenter, t.itemsCenter]}>
              <GroupConversationImage
                imageURL={conversationPhotoUrl}
                diameter={INBOX_AVATAR_DIAMETER}
                width={36}
                height={36}
              />
            </View>
          );
        }

        return counterPartyAvatar;
      }, [
        conversationIsGroup,
        conversationPhotoUrl,
        counterPartyAvatar,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
      ]);

      const headerTitle = React.useMemo(() => {
        if (conversationIsGroup) {
          return (
            <Text
              style={[
                [
                  t.texts.primary,
                  t.fontSemibold,
                  t.textBase,
                  { fontSize: 16, lineHeight: 22 },
                  { maxWidth: '75%' },
                ],
              ]}
              numberOfLines={1}
            >
              {groupConversationName}
              {conversationIsMuted && (
                <>
                  {' '}
                  <Octicons
                    name="bell-slash"
                    size={14}
                    style={[t.texts.secondary]}
                  />
                </>
              )}
            </Text>
          );
        }

        if (conversationCounterParty) {
          const isVerifiedMessageSender = isVerifiedSender({
            conversationCounterPartyFid: conversationCounterParty.fid,
          });

          if (isVerifiedMessageSender) {
            return (
              <View style={[t.flex, t.flexCol]}>
                <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  <UserUsername
                    user={conversationCounterParty}
                    variant="header"
                  />
                  <VerifiedSenderBadge />
                </View>
              </View>
            );
          } else {
            return (
              <View style={[{ maxWidth: '75%' }]}>
                <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  <UserUsername
                    user={conversationCounterParty}
                    variant="header"
                  />
                </View>
              </View>
            );
          }
        }
      }, [
        conversationCounterParty,
        conversationIsGroup,
        conversationIsMuted,
        groupConversationName,
        t.flex,
        t.flexCol,
        t.flexRow,
        t.fontSemibold,
        t.itemsCenter,
        t.textBase,
        t.texts.primary,
        t.texts.secondary,
      ]);

      const headerSubTitle = React.useMemo(() => {
        if (conversationIsGroup) {
          const numParticipants = conversationActiveParticipantsCount;

          return (
            <Text
              style={[t.texts.tertiary, t.textSm, { maxWidth: '60%' }]}
              numberOfLines={1}
            >
              {`${numParticipants} member${numParticipants > 1 ? 's' : ''}`}
            </Text>
          );
        }

        return null;
      }, [
        conversationActiveParticipantsCount,
        conversationIsGroup,
        t.texts.tertiary,
        t.textSm,
      ]);

      return (
        <TouchableOpacity
          style={[t.wFull, t.flex, t.flexRow, t.flex1, t.itemsCenter]}
          activeOpacity={0.75}
          onPress={() => {
            if (conversationIsGroup) {
              push('DirectCastsConversationDetailsScreen', {
                conversationId: conversationId,
              });
            } else if (typeof conversationCounterParty !== 'undefined') {
              pushToUserProfile({ fid: conversationCounterParty.fid });
            }
          }}
        >
          <View style={{ justifyContent: 'center' }}>{headerImage}</View>
          <View
            style={[
              t.flex,
              t.flexCol,
              t.mL2,
              t.flexGrow,
              { maxWidth: '70%', alignSelf: 'center' },
            ]}
          >
            {headerTitle}
            {headerSubTitle}
          </View>
        </TouchableOpacity>
      );
    },
  );

PlaintextDirectCastsConversationHeader.displayName =
  'PlaintextDirectCastsConversationHeader';

export { PlaintextDirectCastsConversationHeader };
