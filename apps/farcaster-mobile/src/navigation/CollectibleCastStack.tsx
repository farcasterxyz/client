import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { CommonStackParamList } from '~/types/navigation';

type CollectibleCastStackScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CollectibleCast'
>;

const Stack = createNativeStackNavigator<CommonStackParamList>();

export function CollectibleCastStack({
  route,
}: CollectibleCastStackScreenProps) {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{
        ...defaultStackScreenOptions,
        contentStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="CollectibleCastDisplay"
    >
      <Stack.Screen
        key="CollectibleCastDisplay"
        name="CollectibleCastDisplay"
        component={
          require('~/screens/CollectibleCast/CollectibleCastDisplayScreen')
            .CollectibleCastDisplayScreen
        }
        initialParams={route.params}
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack.Navigator>
  );
}
