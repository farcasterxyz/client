import * as React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useHomeSearch } from '~/screens/Feed/HomeScreenScrollHandlers';

import { HeaderSearchButton } from './HeaderSearchButton';

function HomeHeaderRightButtons() {
  const t = useTheme();
  const { setSearchAutoOpen } = useHomeSearch();

  return (
    <View style={[t.flexRow, { gap: 20 }]}>
      <HeaderSearchButton onPress={() => setSearchAutoOpen(true)} />
    </View>
  );
}

export { HomeHeaderRightButtons };
