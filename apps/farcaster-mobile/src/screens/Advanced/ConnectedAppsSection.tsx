import { AtomsButton } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { usePush } from '~/hooks/navigation/usePush';

const ConnectedAppsSection: FC = () => {
  const t = useTheme();
  const push = usePush();
  const { showConnectedApps } = useUserAppContext();

  if (!showConnectedApps) {
    return null;
  }

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          Connected apps
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        Connected apps can cast, like and recast on your behalf. These apps do
        not have access to your Farcaster recovery phrase.
      </Text>
      <AtomsButton onPress={() => push('ConnectedApps', {})} size="l">
        Manage connected apps
      </AtomsButton>
    </View>
  );
};

export { ConnectedAppsSection };
