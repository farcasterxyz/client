import { Octicons } from '@expo/vector-icons';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type MarkAsUnreadIconProps = {
  color?: string;
};

const MarkAsUnreadIcon: FC<MarkAsUnreadIconProps> = memo(({ color }) => {
  const t = useTheme();

  return (
    <View style={[t.relative]}>
      <Octicons
        name={'comment'}
        size={22}
        style={[{ color: color || t.colors.text.primary }, t.relative]}
      />
      {/* Adding this one-off handler as the colors being all the same does not work well with wrapping circle */}
      {color === '#ffffff' ? (
        <View
          style={[
            t.absolute,
            t.top0,
            t.right0,
            {
              marginTop: -3.5,
              marginRight: -1.5,
            },
          ]}
        >
          <Octicons
            name={'dot-fill'}
            size={12}
            style={[{ color: color || t.colors.text.primary }]}
          />
        </View>
      ) : (
        <View
          style={[
            t.bgDefault,
            t.roundedFull,
            t.absolute,
            t.top0,
            t.right0,
            {
              paddingLeft: 2,
              paddingRight: 2,
              marginTop: -3,
              marginRight: -3,
            },
          ]}
        >
          <Octicons
            name={'dot-fill'}
            size={10}
            style={[{ color: color || t.colors.text.primary }]}
          />
        </View>
      )}
    </View>
  );
});

MarkAsUnreadIcon.displayName = 'MarkAsUnreadIcon';

export { MarkAsUnreadIcon };
