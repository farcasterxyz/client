import * as React from 'react';

import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useTheme } from '~/contexts/ThemeProvider';
import { getStandardizedAvatarUrl } from '~/utils/ImageUtils';

import { GroupConversationImage } from './GroupConversationImage';

// This lets the conversation load the same image as the inbox to
// avoid re-downloading the same image.
export const INBOX_AVATAR_DIAMETER = 56;

// We want to allow callers to pass in a subset of the properties of the full
// ApiDirectCastInboxConversationInfoV3 type, so that if they want, they can
// memoize those components individually to avoid a rerender if unrelated parts
// of the larger type change.
type DirectCastConversationAvatarProps = {
  conversation: {
    isGroup: boolean;
    photoUrl?: string;
    viewerContext: {
      counterParty?: {
        pfp?: {
          url: string;
        };
      };
    };
  };
  diameter?: number;
};
const DirectCastConversationAvatar: React.FC<DirectCastConversationAvatarProps> =
  React.memo(({ conversation, diameter = INBOX_AVATAR_DIAMETER }) => {
    const t = useTheme();
    const commonAvatarStyle = React.useMemo(
      () => [t.borderDefault, t.borderHairline, t.roundedFull],
      [t.borderDefault, t.borderHairline, t.roundedFull],
    );

    if (conversation.isGroup) {
      return (
        <GroupConversationImage
          imageURL={conversation.photoUrl}
          diameter={diameter}
        />
      );
    }

    const { counterParty } = conversation.viewerContext;
    if (!counterParty) {
      return null;
    }

    const optimizedImageUrl = counterParty?.pfp?.url
      ? getStandardizedAvatarUrl({
          url: counterParty.pfp?.url,
          size: 'default',
        })
      : defaultAvatarUrl;

    return (
      <SimplerRemoteImage
        uri={optimizedImageUrl}
        height={diameter}
        width={diameter}
        style={commonAvatarStyle}
        recyclingKey={optimizedImageUrl}
      />
    );
  });

export { DirectCastConversationAvatar };
