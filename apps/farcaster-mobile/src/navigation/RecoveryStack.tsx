import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { RecoveryStackParamList } from '~/types';

const RecoveryStack = createNativeStackNavigator<RecoveryStackParamList>();

const RecoveryStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();

  return (
    <RecoveryStack.Navigator
      screenOptions={{
        ...defaultStackScreenOptions,
        animation: 'none',
        gestureEnabled: false,
      }}
    >
      <RecoveryStack.Screen
        name="Recovery"
        component={require('~/screens/Recovery').RecoveryStartScreen}
        options={{
          headerTitle: 'Account Recovery',
        }}
      />
      <RecoveryStack.Screen
        name="RecoveryBackupRecoveryPhrase"
        component={
          require('~/screens/RecoveryBackupRecoveryPhrase')
            .RecoveryBackupRecoveryPhraseScreen
        }
        options={{
          headerTitle: 'Back up recovery phrase',
          headerLeft: () => false,
        }}
      />
    </RecoveryStack.Navigator>
  );
};

RecoveryStackNavigator.displayName = 'RecoveryStackNavigator';

export { RecoveryStackNavigator };
