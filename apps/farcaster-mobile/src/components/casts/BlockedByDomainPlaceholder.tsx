import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';

// Renders in place of a cast whose embed URL hostname matches the harmful-domain
// blocklist. Only mounted for admins (see `Cast.tsx`) — non-admins see nothing.
// Lets the moderation team confirm a block landed and audit what's being hidden.
const BlockedByDomainPlaceholder: FC = memo(() => {
  const t = useTheme();
  const textStyles = useCastBodyTextStyle();

  return (
    <View
      style={[
        t.pX4,
        t.pY6,
        t.borderDefault,
        t.borderBHairline,
        t.flex,
        t.alignCenter,
        t.bgDefault,
        { zIndex: 1 },
      ]}
    >
      <Text style={[...textStyles, t.texts.secondary, t.italic]}>
        Hidden — embed matches a blocked domain. Visible to admins only.
      </Text>
    </View>
  );
});

BlockedByDomainPlaceholder.displayName = 'BlockedByDomainPlaceholder';

export { BlockedByDomainPlaceholder };
