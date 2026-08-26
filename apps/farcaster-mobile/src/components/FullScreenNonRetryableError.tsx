import { AnalyticsEvent } from 'farcaster-analytics';
import { isError } from 'farcaster-client-data';
import React, { FC, memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useManuallyTrackView } from '~/hooks/datadog/useManuallyTrackView';

import { ErrorIconWithDebugActions } from './ErrorIconWithDebugActions';

type FullScreenNonRetryableErrorProps = {
  error: unknown;
};

const FullScreenNonRetryableError: FC<FullScreenNonRetryableErrorProps> = memo(
  ({ error }) => {
    const t = useTheme();
    const { onAppInitialized } = useSplash();
    const { trackEvent } = useAnalytics();

    useManuallyTrackView({
      key: 'FullScreenNonRetryableError',
      name: 'FullScreenNonRetryableError',
      context: useMemo(
        () =>
          error instanceof Error
            ? {
                errorName: error.name,
                errorMessage: error.message,
              }
            : {},
        [error],
      ),
    });

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewNonRetryableError, {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown',
      });
    }, [error, trackEvent]);

    useEffect(() => {
      // We call onAppInitialized to ensure that the faux splash screen
      // transitions out in cases where one of the top-level API requests
      // (e.g. fetching the current user profile + activity) fails
      // before we even get a chance to render the navigation container
      // and a screen that would typically trigger this behavior.
      onAppInitialized();
    }, [onAppInitialized]);

    return (
      <View style={[t.hFull, t.justifyCenter, t.bgDefault, t.p4]}>
        <View style={[t.mB4, t.itemsCenter]}>
          <ErrorIconWithDebugActions
            onReset={() => {
              // No full reset on this flow.
            }}
          />
          <Text style={[t.texts.primary, t.textBase]}>
            {isError(error) ? error.message : String(error)}
          </Text>
        </View>
      </View>
    );
  },
);

FullScreenNonRetryableError.displayName = 'FullScreenNonRetryableError';

export { FullScreenNonRetryableError };
