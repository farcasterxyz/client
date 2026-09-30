import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type CastWatchUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CastWatchUsers'
>;

const CastWatchUsersScreen = buildScreen<CastWatchUsersScreenProps>(
  { name: 'CastWatchUsers' },
  () => {
    const t = useTheme();

    return (
      <View style={[t.hFull, t.justifyCenter]}>
        <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
          Cast bookmarks are anonymous. 👀
        </Text>
      </View>
    );
  },
);

export { CastWatchUsersScreen };
