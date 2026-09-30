import React, { FC, memo, ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type NotificationGroupInnerContainerProps = {
  children: ReactNode;
};

const NotificationGroupInnerContainer: FC<NotificationGroupInnerContainerProps> =
  memo(({ children }) => {
    const t = useTheme();

    return (
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.flexGrow,
          t.flexShrink,
          t.selfCenter,
        ]}
      >
        {/* marginLeft should match what we have on casts */}
        <View style={[t.flexGrow, t.flexShrink, { marginLeft: 9 }]}>
          {children}
        </View>
      </View>
    );
  });

NotificationGroupInnerContainer.displayName = 'NotificationGroupInnerContainer';

export { NotificationGroupInnerContainer };
