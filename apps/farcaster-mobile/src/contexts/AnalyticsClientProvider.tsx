import { PostHogProvider as RNPostHogProvider } from 'posthog-react-native';
import React, { FC, memo, ReactNode } from 'react';

import { posthogClient } from '~/analyticsClient/providers/posthogProvider';

type AnalyticsClientProviderProps = {
  children: ReactNode;
};

const AnalyticsClientProvider: FC<AnalyticsClientProviderProps> = memo(
  ({ children }) => {
    return (
      <RNPostHogProvider client={posthogClient} autocapture={false}>
        {children}
      </RNPostHogProvider>
    );
  },
);

AnalyticsClientProvider.displayName = 'AnalyticsClientProvider';

export { AnalyticsClientProvider };
