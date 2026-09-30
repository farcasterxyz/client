import type { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import {
  getSpecificallySizedImageUrl,
  resolveUsername,
} from 'farcaster-client-hooks';
import * as React from 'react';
import { View } from 'react-native';

import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { Text } from '~/components/Text';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLinkifyText } from '~/hooks/useLinkifyText';

const directCastsConversationDetailsInfoRowHeight = 149;

const avatarDiameter = 108;

const DirectCastsConversationDetailsInfoRow: React.FC<{
  conversation: ApiDirectCastConversationInfoV3;
}> = React.memo(({ conversation }) => {
  const t = useTheme();

  const {
    isGroup,
    viewerContext: { counterParty },
  } = conversation;

  let conversationName = conversation.name;
  if (!isGroup && counterParty) {
    conversationName = resolveUsername(counterParty);
  }

  const avatar = React.useMemo(() => {
    if (isGroup) {
      return (
        <GroupConversationImage
          imageURL={conversation.photoUrl}
          diameter={avatarDiameter}
        />
      );
    }
    const pfp = counterParty?.pfp;
    const optimizedImageUrl = pfp
      ? getSpecificallySizedImageUrl({
          staticRaster: pfp.url,
          h: avatarDiameter,
          w: avatarDiameter,
        })
      : defaultAvatarUrl;
    return (
      <SimplerRemoteImage
        uri={optimizedImageUrl}
        height={avatarDiameter}
        width={avatarDiameter}
        style={t.roundedFull}
        recyclingKey={optimizedImageUrl}
      />
    );
  }, [isGroup, conversation.photoUrl, counterParty?.pfp, t.roundedFull]);

  const { linkifiedText: bioText } = useLinkifyText({
    text: (counterParty?.profile.bio.text ?? '').replace(/\n/g, ' '),
    mentions: counterParty?.profile.bio.mentions ?? [],
    channelMentions: counterParty?.profile.bio.channelMentions ?? [],
    options: {
      skipFarcasterLinkTruncate: false,
      skipURLTruncates: false,
      applyInvertedLinkStyles: [t.underline],
    },
  });

  const description = React.useMemo(() => {
    if (isGroup) {
      return conversation.description;
    } else if (counterParty) {
      return bioText;
    }
    return undefined;
  }, [isGroup, conversation.description, counterParty, bioText]);

  return (
    <View style={[t.flex, t.flexCol, t.itemsCenter, t.wFull]}>
      {avatar}
      <Text
        style={[
          t.texts.primary,
          t.fontSemibold,
          t.text2xl,
          t.mT3,
          t.mX2,
          t.textCenter,
        ]}
        numberOfLines={1}
      >
        {conversationName}
      </Text>
      {description && (
        <Text style={[t.texts.tertiary, t.textCenter, t.mT2]}>
          {description}
        </Text>
      )}
    </View>
  );
});

export {
  DirectCastsConversationDetailsInfoRow,
  directCastsConversationDetailsInfoRowHeight,
};
