import React from 'react';
import { View } from 'react-native';

import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useDevMode } from '~/hooks/useDevMode';

export function DeveloperModeSection() {
  const t = useTheme();
  const { devMode, setDevMode } = useDevMode();

  return (
    <>
      <Text style={[t.texts.primary, t.textBase, t.fontSemibold, t.mB2]}>
        Developer mode
      </Text>
      <Text style={[t.texts.secondary, t.textSm]}>
        Expose developer related features in Farcaster.
      </Text>
      <View style={[t.mT3]}>
        <Switch value={devMode} onValueChange={setDevMode} />
      </View>
    </>
  );
}
