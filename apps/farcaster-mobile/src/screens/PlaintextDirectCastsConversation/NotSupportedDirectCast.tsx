import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

const NotSupportedDirectCast: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <View style={[t.flex, t.flexRow, t.justifyCenter, t.mB2]}>
      <View style={[t.pY1, t.pX2, t.bgDefault, t.rounded]}>
        <Text
          style={[t.textSm, t.textCenter, t.texts.secondary]}
          numberOfLines={2}
        >
          Message is not supported — please update Farcaster
        </Text>
      </View>
    </View>
  );
});

NotSupportedDirectCast.displayName = 'NotSupportedDirectCast';

export { NotSupportedDirectCast };
