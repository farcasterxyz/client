import React, { FC, memo } from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';

import { debugLoadingIndicatorsEnabled } from '~/constants/Debug';
import { useTheme } from '~/contexts/ThemeProvider';
import { debugAppLoadEnabled } from '~/utils/FastStorageUtils';
import { logInDevOnly } from '~/utils/LogUtils';

import { Text } from './Text';

type FullScreenLoadingIndicatorProps = {
  justify?: 'start' | 'center';
  message?: string;
  bottomMessage?: string;
  style?: ViewStyle[];
  debugName?: string;
};

const FullScreenLoadingIndicator: FC<FullScreenLoadingIndicatorProps> = memo(
  ({ justify = 'center', message, style, bottomMessage, debugName }) => {
    const t = useTheme();

    const debugAppLoad = debugAppLoadEnabled();

    if (debugLoadingIndicatorsEnabled && debugName) {
      logInDevOnly(`Showing loading spinner: ${debugName}`);
    }

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
        {debugAppLoad && (
          <View style={[t.absolute, t.bottom0, t.wFull, t.pB16]}>
            <Text style={[t.texts.secondary, t.textBase, t.textCenter]}>
              {debugName}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

FullScreenLoadingIndicator.displayName = 'FullScreenLoadingIndicator';

export { FullScreenLoadingIndicator };
