import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type DebugBenchmarksScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugBenchmarks'
>;

// const benchmark = async (operation: () => Promise<unknown>) => {
//   const start = Date.now();
//   await operation();
//   alert(`${Date.now() - start}ms`);
// };

const DebugBenchmarksScreen = buildScreen<DebugBenchmarksScreenProps>(
  { name: 'DebugBenchmarks' },
  () => {
    const t = useTheme();

    return <View style={[t.hFull, t.p4, t.justifyEnd]}></View>;
  },
);

DebugBenchmarksScreen.displayName = 'DebugBenchmarksScreen';

export { DebugBenchmarksScreen };
