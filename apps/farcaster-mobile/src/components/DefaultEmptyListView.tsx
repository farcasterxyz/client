import React, { FC } from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

const DefaultEmptyListView: FC<{ message: string; refresh?: () => void }> = ({
  message,
  refresh,
}) => {
  const t = useTheme();

  return (
    <View style={[t.flexCol, t.itemsCenter, t.pX4, t.pT50]}>
      <Text2 color="secondary" style={[t.textCenter]}>
        {message}
      </Text2>
      {refresh && (
        <ButtonV2
          title="Refresh"
          margin={{ marginTop: sizes.s4 }}
          height="sm"
          onPress={refresh}
        />
      )}
    </View>
  );
};
DefaultEmptyListView.displayName = 'DefaultEmptyListView';

export { DefaultEmptyListView };
