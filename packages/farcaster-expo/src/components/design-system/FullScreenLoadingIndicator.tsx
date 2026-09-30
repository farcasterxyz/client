import React, { FC, memo } from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

type FullScreenLoadingIndicatorProps = {
  justify?: 'start' | 'center';
  message?: string;
  bottomMessage?: string;
  style?: ViewStyle[];
  debugName?: string;
};

const FullScreenLoadingIndicator: FC<FullScreenLoadingIndicatorProps> = memo(
  ({ justify = 'center', message, style, bottomMessage }) => {
    const t = useTheme();

    return (
      <View
        style={[
          t.hFull,
          t.bgDefault,
          t.relative,
          justify === 'center' ? t.justifyCenter : t.justifyStart,
          ...(style || []),
        ]}
      >
        {message && (
          <Text
            style={[
              t.texts.primary,
              t.mB8,
              t.textXl,
              t.fontSemibold,
              t.textCenter,
            ]}
          >
            {message}
          </Text>
        )}
        <ActivityIndicator size="large" color={t.colors.loadingIndicator} />
        {bottomMessage && (
          <View style={[t.absolute, t.bottom0, t.wFull, t.pB16]}>
            <Text style={[t.texts.secondary, t.textBase, t.textCenter]}>
              {bottomMessage}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

FullScreenLoadingIndicator.displayName = 'FullScreenLoadingIndicator';

export { FullScreenLoadingIndicator };
