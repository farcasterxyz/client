import React, { FC } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { SquareSpinner } from '~/screens/Feed/SquareSpinner';

const NewUserRefreshingFeed: FC = () => {
  const t = useTheme();

  return (
    <View style={[t.flex, t.flexCol, t.itemsCenter, t.pT10, t.pX10]}>
      <SquareSpinner />
      <Text style={[t.texts.primary, t.textXl, t.mT6, t.textCenter]}>
        Personalizing your feed
      </Text>
      <Text style={[t.texts.secondary, t.textBase, t.mT6, t.textCenter]}>
        Your feed will continue to get better as you follow more people.
      </Text>
    </View>
  );
};
NewUserRefreshingFeed.displayName = 'NewUserRefreshingFeed';

export { NewUserRefreshingFeed };
