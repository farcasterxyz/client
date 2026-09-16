import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { SharedTelemetryContext } from 'farcaster-expo';
import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';

import { analyticsClient } from '~/analyticsClient';
import { AnalyticsEventData } from '~/constants/AnalyticsEvents';
import { isDev } from '~/constants/Env';
import { usePath } from '~/hooks/navigation/usePath';
import { trackError } from '~/utils/ErrorUtils';

type SharedTelemetryProviderProps = {
  children: ReactNode;
  additionalProperties?: Record<string, string | number>;
};

export const SharedTelemetryProvider: FC<SharedTelemetryProviderProps> = memo(
  ({ children, additionalProperties }) => {
    const trackEvent = useCallback(
      async (name: AnalyticsEvent, properties: AnalyticsEventData) => {
        if (isDev) {
          // eslint-disable-next-line no-console
          console.log(`[AMP] event: [${name}]: `, properties);
        }

        const eventProps = {
          ...properties,
          additionalProperties,
          warpcastPlatform: 'mobile',
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyticsClient.capture(name, eventProps as any);
      },
      [additionalProperties],
    );

    const value = useMemo(
      () => ({
        trackEvent,
        trackError,
        addRumAction: (name: string, context?: object) => {
          DdRum.addAction(RumActionType.CUSTOM, name, context);
        },
        startRumAction: (name: string, context?: object) => {
          DdRum.startAction(RumActionType.CUSTOM, name, context);
        },
        stopRumAction: (name: string, context?: object) => {
          DdRum.stopAction(RumActionType.CUSTOM, name, context);
        },
      }),
      [trackEvent],
    );

    return (
      <SharedTelemetryContext.Provider value={value}>
        {children}
      </SharedTelemetryContext.Provider>
    );
  },
);

export const NavAwareSharedTelemetryProvider: FC<SharedTelemetryProviderProps> =
  memo(({ children }) => {
    const path = usePath();
    const additionalProperties = useMemo(
      () => ({
        location: path,
      }),
      [path],
    );

    return (
      <SharedTelemetryProvider additionalProperties={additionalProperties}>
        {children}
      </SharedTelemetryProvider>
    );
  });
