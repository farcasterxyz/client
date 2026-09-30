import { formatShorthandNumber } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import { Text } from './Text';

type StorageCapacityProps = {
  used: number;
  rented: number;
};

const StorageCapacity: React.FC<StorageCapacityProps> = ({ used, rented }) => {
  const t = useTheme();

  const overCapacity = React.useMemo(() => {
    return used > rented;
  }, [rented, used]);

  if (overCapacity) {
    return (
      <View>
        <Text style={[t.textBase, t.texts.danger]}>
          {formatShorthandNumber(rented - used)} over capacity
        </Text>
      </View>
    );
  }

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter]}>
      <Text style={[t.textBase, t.texts.primary, t.mR1]}>
        {formatShorthandNumber(used)}
      </Text>
      <Text style={[t.textBase, t.texts.secondary]}>
        of {formatShorthandNumber(rented)}
      </Text>
      <View style={[t.flex, t.h5, t.w20, t.mL2, t.bgDefault, t.rounded]}>
        <View
          style={[
            t.roundedL,
            t.bgAction,
            t.h5,
            { width: `${(used / rented) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

export { StorageCapacity };
