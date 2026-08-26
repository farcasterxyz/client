import { useEffect, useState } from 'react';

import { Analytics } from '~/utils/analyticsUtils';

function readPostHogFeatureFlag(flag: string): boolean {
  return Analytics.isFeatureEnabled(flag) === true;
}

function usePostHogFeatureFlag(flag: string): boolean {
  const [enabled, setEnabled] = useState(() => readPostHogFeatureFlag(flag));

  useEffect(() => {
    const refresh = () => {
      setEnabled(readPostHogFeatureFlag(flag));
    };

    refresh();
    return Analytics.onFeatureFlags(refresh);
  }, [flag]);

  return enabled;
}

export { usePostHogFeatureFlag };
