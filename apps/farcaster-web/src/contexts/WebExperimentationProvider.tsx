import { checkGate, type GateId } from 'farcaster-client-data';
import React, { memo } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

function useFeatureGate(gateName: GateId): boolean {
  const user = useCurrentUser();
  return checkGate(gateName, user.fid);
}

interface WebExperimentationProviderProps {
  children: React.ReactNode;
}

const WebExperimentationProvider: React.FC<WebExperimentationProviderProps> =
  memo(({ children }) => {
    return <>{children}</>;
  });

WebExperimentationProvider.displayName = 'WebExperimentationProvider';

export { useFeatureGate, WebExperimentationProvider };
