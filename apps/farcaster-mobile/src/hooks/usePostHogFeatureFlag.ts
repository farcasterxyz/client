import React from 'react';

import { posthogClient } from '~/analyticsClient/providers/posthogProvider';

function readPostHogFeatureFlag(flag: string): boolean {
  return posthogClient.isFeatureEnabled(flag) === true;
}

function usePostHogFeatureFlag(flag: string): boolean {
  const [enabled, setEnabled] = React.useState(() =>
    readPostHogFeatureFlag(flag),
  );

  React.useEffect(() => {
    const refresh = () => {
      setEnabled(readPostHogFeatureFlag(flag));
    };

    refresh();
    return posthogClient.onFeatureFlags(refresh);
  }, [flag]);

  return enabled;
}

export { usePostHogFeatureFlag };
