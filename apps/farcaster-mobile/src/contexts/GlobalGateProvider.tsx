import { checkGate, GATE_IDS, type GateId } from 'farcaster-client-data';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

type GlobalGateContextValue = {
  checkGate: (gateName: GateId) => { value: boolean };
  gates: () => Set<GateId>;
  referrals: boolean;
};

const GlobalGateContext = createContext<GlobalGateContextValue>({
  checkGate: () => ({ value: false }),
  gates: () => new Set<GateId>(),
  referrals: false,
});

type GlobalGateProviderProps = {
  children: ReactNode;
};

const GlobalGateProvider: FC<GlobalGateProviderProps> = memo(({ children }) => {
  const { fid } = useCurrentUser_UNSAFE();

  const checkGateFn = useCallback(
    (gateName: GateId): { value: boolean } => ({
      value: checkGate(gateName, fid),
    }),
    [fid],
  );

  const gates = useCallback((): Set<GateId> => {
    const enabled = new Set<GateId>();
    for (const gateName of GATE_IDS) {
      if (checkGate(gateName, fid)) {
        enabled.add(gateName);
      }
    }
    return enabled;
  }, [fid]);

  const contextValue = useMemo(
    () => ({
      checkGate: checkGateFn,
      gates,
      referrals: false,
    }),
    [checkGateFn, gates],
  );

  return (
    <GlobalGateContext.Provider value={contextValue}>
      {children}
    </GlobalGateContext.Provider>
  );
});

const useGlobalGate = () => useContext(GlobalGateContext);

export { GlobalGateProvider, useGlobalGate };
