import React, { FC, memo, ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type NotificationGraphicProps = {
  centerVertically?: boolean;
  children: ReactNode;
};

const NotificationGraphic: FC<NotificationGraphicProps> = memo(
  ({ centerVertically, children }) => {
    const t = useTheme();

    return (
      <View
        style={[
          t.itemsEnd,
          centerVertically && t.selfCenter,
          {
            // This should correspond to the user avatar size for notification types for which
            // we render a cast.
            width: 48,
          },
        ]}
      >
        {children}
      </View>
    );
  },
);

NotificationGraphic.displayName = 'NotificationGraphic';

export { NotificationGraphic };
