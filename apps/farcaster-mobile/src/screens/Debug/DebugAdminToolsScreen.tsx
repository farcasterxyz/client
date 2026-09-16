import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useHideAdminFeatures } from '~/hooks/useHideAdminFeatures';
import { CommonStackParamList } from '~/types';

type DebugAdminToolsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugAdminTools'
>;

const DebugAdminToolsScreen = buildScreen<DebugAdminToolsScreenProps>(
  { name: 'DebugAdminTools' },
  () => {
    const t = useTheme();
    const isAdmin = useIsAdmin();
    const [hideAdminFeatures, setHideAdminFeatures] = useHideAdminFeatures();

    if (!isAdmin) {
      return null;
    }

    return (
      <View style={[t.hFull, t.p4, t.justifyBetween]}>
        <View>
          <Text style={[t.texts.secondary, t.textSm]}>Hide Admin Tools</Text>
          <View style={[t.mT1]}>
            <Switch
              value={hideAdminFeatures}
              onValueChange={setHideAdminFeatures}
            />
          </View>
        </View>
      </View>
    );
  },
);

DebugAdminToolsScreen.displayName = 'DebugAdminToolsScreen';

export { DebugAdminToolsScreen };
