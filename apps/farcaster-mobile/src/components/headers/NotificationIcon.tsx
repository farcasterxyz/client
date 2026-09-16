import { Octicons } from '@expo/vector-icons';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

interface NotificationIconProps {
  notificationEnabled: boolean;
}

const NotificationIcon: FC<NotificationIconProps> = memo(
  ({ notificationEnabled }) => {
    const t = useTheme();

    return (
      <>
        <Octicons
          name={notificationEnabled ? 'bell-fill' : 'bell'}
          size={18}
          style={[t.texts.primary, t.relative]}
        />
        <View
          style={[
            t.bgDefault,
            t.roundedFull,
            t.absolute,
            t.top0,
            t.right0,
            {
              marginTop: 6,
              marginRight: 8,
              paddingLeft: 1,
              paddingRight: 1,
            },
          ]}
        >
          <Octicons
            name={notificationEnabled ? 'check' : 'plus'}
            size={8}
            style={[t.texts.primary]}
          />
        </View>
      </>
    );
  },
);

NotificationIcon.displayName = 'NotificationsIcon';

export { NotificationIcon };
