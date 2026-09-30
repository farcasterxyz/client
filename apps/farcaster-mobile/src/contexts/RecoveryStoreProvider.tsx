import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { recoveryIdStorageKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { trackError } from '~/utils/ErrorUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from '~/utils/SecureStorageUtils';

export type StartData = {
  token: string;
  email: string;
};

type Recovery = {
  id: string;
};

type RecoveryStoreContextValue = {
  startData: StartData | null;
  recovery: Recovery | null | undefined;
  recoveryInProgress: boolean;
  storeRecovery: (recovery: Recovery) => Promise<void>;
  startRecovery: (data: StartData) => void;
  reset: () => Promise<void>;
};

const RecoveryStoreContext = createContext<RecoveryStoreContextValue>(null!);

type RecoveryStoreProviderProps = {
  children: ReactNode;
};

/**
 * Manage state of the current recovery process.
 */
const RecoveryStoreProvider: FC<RecoveryStoreProviderProps> = ({
  children,
}) => {
  // undefined while initialization, null if no recovery, otherwise recovery
  const [recovery, setRecovery] = useState<Recovery | null | undefined>();
  const [startData, setStartData] = useState<{
    token: string;
    email: string;
  } | null>(null);
  const { unregisterUserProperty } = useAnalytics();

  useEffect(() => {
    const init = async () => {
      try {
        const result = await getSecureItem<string | null>({
          key: recoveryIdStorageKey,
          fallback: '',
        });
        if (result) {
          setRecovery(JSON.parse(result));
        } else {
          setRecovery(null);
        }
      } catch (error) {
        const wrappedError = new Error(
          'Failed to retrieve recovery from storage',
        );
        logErrorInDevOnly(wrappedError.message);
        trackError(wrappedError);

        // Set recovery to null so the rest of the tree can render.
        setRecovery(null);
      }
    };

    // Function should never throw
    init();
  }, [setRecovery]);

  const storeRecovery = useCallback(
    async (recovery: Recovery) => {
      try {
        await setSecureItem({
          key: recoveryIdStorageKey,
          value: JSON.stringify(recovery),
        });
        setRecovery(recovery);
      } catch (error) {
        const wrappedError = new Error('Failed to store recovery', {
          cause: error,
        });
        logErrorInDevOnly(wrappedError.message);
        trackError(wrappedError);
      } finally {
        setStartData(null);
      }
    },
    [setRecovery],
  );

  const reset = useCallback(async () => {
    try {
      await deleteSecureItem(recoveryIdStorageKey);
    } catch (error) {
      const wrappedError = new Error('Failed to delete recovery', {
        cause: error,
      });
      logErrorInDevOnly(wrappedError.message);
      trackError(wrappedError);
    } finally {
      setRecovery(null);
      setStartData(null);
      // Clear the recovery intent super property so the next recovery
      // attempt classifies fresh from scratch.
      unregisterUserProperty('recovery_intent');
    }
  }, [setRecovery, setStartData, unregisterUserProperty]);

  const startRecovery = useCallback(
    (data: StartData) => setStartData(data),
    [setStartData],
  );

  const value = useMemo(
    () => ({
      recovery,
      reset,
      storeRecovery,
      startData,
      startRecovery,
      recoveryInProgress: Boolean(recovery || startData),
    }),
    [recovery, reset, storeRecovery, startRecovery, startData],
  );

  // Block until initiatilization completes
  if (recovery === undefined) {
    return <FullScreenLoadingIndicator debugName="RecoveryStoreProvider" />;
  }

  return (
    <RecoveryStoreContext.Provider value={value}>
      {children}
    </RecoveryStoreContext.Provider>
  );
};

const useRecoveryStore = () => {
  const context = useContext(RecoveryStoreContext);
  if (context === undefined) {
    throw new Error(
      'useRecoveryStore must be used within a RecoveryStoreProvider',
    );
  }
  return context;
};

export { RecoveryStoreProvider, useRecoveryStore };
