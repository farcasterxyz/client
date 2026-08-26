import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type PlaintextDirectCastDisabledComposerProps = {
  conversationIsGroup: boolean;
  conversationCounterParty: ApiUser | undefined;
};

const PlaintextDirectCastDisabledComposer: React.FC<PlaintextDirectCastDisabledComposerProps> =
  React.memo(({ conversationIsGroup, conversationCounterParty }) => {
    const t = useTheme();

    const disclaimer = React.useMemo(() => {
      if (conversationIsGroup) {
        return 'Only admins can send messages';
      }

      if (typeof conversationCounterParty !== 'undefined') {
        const username = resolveUsername({
          username: conversationCounterParty.username,
          fid: conversationCounterParty.fid,
        });
        return `Only ${username} can send messages`;
      }

      return 'You are not allowed to send messages';
    }, [conversationCounterParty, conversationIsGroup]);

    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.bgDefault,
          t.pY4,
        ]}
      >
        <Text style={[t.texts.tertiary, t.textSm]}>{disclaimer}</Text>
      </View>
    );
  });

PlaintextDirectCastDisabledComposer.displayName =
  'PlaintextDirectCastDisabledComposer';

export { PlaintextDirectCastDisabledComposer };
