import React, { FC, useState } from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { Button } from './design-system/Button';
import { Text } from './design-system/Text';
import { NoConnectionIcon } from './icons/NoConnectionIcon';

interface LoadFailureIndicatorProps {
  style?: ViewStyle | ViewStyle[];
  retry: () => void;
}

const LoadFailureIndicator: FC<LoadFailureIndicatorProps> = ({
  retry,
  style,
}) => {
  const t = useTheme();
  const [isRetrying, setIsRetrying] = useState(false);

  return (
    <View style={[t.wFull, t.flexRow, t.pX4, t.pY4, { gap: 8 }, style]}>
      <View
        style={[
          t.flexCol,
          t.bgMuted,
          t.roundedFull,
          t.itemsCenter,
          t.justifyCenter,
          { width: 48, height: 48 },
        ]}
      >
        <NoConnectionIcon />
      </View>
      <View style={[t.flexCol, t.flex1, t.justifyCenter, { gap: 4 }]}>
        <Text style={[t.texts.primary, t.fontBold, t.textBase]}>
          Unstable connection
        </Text>
        <Text style={[t.texts.tertiary, t.fontNormal, t.textSm]}>
          Check your connection and try again.
        </Text>
      </View>
      <View style={[t.w23]}>
        <Button
          style={[t.pY3]}
          variant="inverted"
          title="Retry"
          fontWeight="bold"
          loading={isRetrying}
          onPress={async () => {
            setIsRetrying(true);
            try {
              retry();
            } finally {
              setIsRetrying(false);
            }
          }}
        />
      </View>
    </View>
  );
};

export { LoadFailureIndicator };
