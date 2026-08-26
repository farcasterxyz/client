import { Octicons } from '@expo/vector-icons';
import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { Sparkles } from 'lucide-react-native';
import React, { FC, memo } from 'react';

import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface IncludeReasonTopHatProps {
  avatarDiameter?: number;
  includeReasonType: Extract<
    ApiCastFeedIncludeReason['type'],
    'evergreen-following-author' | 'high-quality-unfollowed'
  >;
}

const IncludeReasonTopHat: FC<IncludeReasonTopHatProps> = memo(
  ({ avatarDiameter, includeReasonType }) => {
    const t = useTheme();
    const label =
      includeReasonType === 'high-quality-unfollowed'
        ? {
            icon: <Sparkles size={14} color={t.colors.text.tertiary} />,
            text: 'relevant for you',
          }
        : {
            icon: (
              <Octicons name="history" size={14} style={[t.texts.tertiary]} />
            ),
            text: 'in case you missed it',
          };

    return (
      <FeedItemTopHatContainer
        avatarDiameter={avatarDiameter}
        icon={label.icon}
      >
        <Text
          style={[
            t.texts.tertiary,
            t.fontNormal,
            {
              fontSize: 14,
              lineHeight: 18,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label.text}
        </Text>
      </FeedItemTopHatContainer>
    );
  },
);

IncludeReasonTopHat.displayName = 'IncludeReasonTopHat';

export { IncludeReasonTopHat };
