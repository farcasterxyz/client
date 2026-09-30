import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  useUpdates,
} from 'expo-updates';
import {
  CheckForOverTheAirUpdateError,
  MILLIS_PER_MINUTE,
} from 'farcaster-client-hooks';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { isDev } from '~/constants/Env';
import { logInDevOnly } from '~/utils/LogUtils';

const DEVICE_SUPPORTS_OTA_UPDATES = isEnabled && !isDev;

// https://github.com/facebook/react-native/issues/50274
// Issue on Expo 52+ / old arch. We can remove once we migrate to new arch
const DEVICE_SUPPORTS_RELOAD = Platform.OS !== 'android';

type CheckForOverTheAirUpdateContext = {
  hasDownloadedUpdate: boolean;
  lastCheckedForUpdateAt: number | undefined;
  updateError: Error | undefined;
  restart: () => Promise<void>;
  supportsRestart: boolean;
};

const CheckForOverTheAirUpdateContext =
  createContext<CheckForOverTheAirUpdateContext>({} as never);

type CheckForOverTheAirUpdateProviderProps = {
  children: ReactNode;
};

const INITIAL_DELAY = MILLIS_PER_MINUTE * 10;
const MAX_DELAY = MILLIS_PER_MINUTE * 60;

const CheckForOverTheAirUpdateProvider: FC<CheckForOverTheAirUpdateProviderProps> =
  memo(({ children }) => {
    const { isUpdatePending } = useUpdates();

    const appState = useRef<AppStateStatus>('active');
    const lastMinimize = useRef(0);
    const ranInitialCheck = useRef(false);

    const [hasDownloadedUpdate, setHasDownloadedUpdate] = useState(false);
    const [lastCheckedForUpdateAt, setLastCheckedForUpdateAt] =
      useState<number>();
    const [updateError, setUpdateError] = useState<Error>();
    const [currentDelay, setCurrentDelay] = useState<number>(INITIAL_DELAY);

    const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const clearExistingTimeout = useCallback(() => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    }, []);

    const runUpdateCheck = useCallback(async () => {
      setLastCheckedForUpdateAt(Date.now());
      try {
        const update = await checkForUpdateAsync();
        if (update.isAvailable) {
          await fetchUpdateAsync();
          setHasDownloadedUpdate(true);
          setCurrentDelay(INITIAL_DELAY); // reset backoff if an update is fetched
          return;
        }
        // No update available; increase delay (exponential backoff)
        setCurrentDelay((prev) => Math.min(prev * 2, MAX_DELAY));
      } catch (error) {
        const wrappedError = new CheckForOverTheAirUpdateError({ error });
        setUpdateError(wrappedError);
        // On error, also back off
        setCurrentDelay((prev) => Math.min(prev * 2, MAX_DELAY));
      }
    }, []);

    const scheduleUpdateCheck = useCallback(() => {
      clearExistingTimeout();
      timeout.current = setTimeout(async () => {
        await runUpdateCheck();
        scheduleUpdateCheck();
      }, currentDelay);
    }, [clearExistingTimeout, currentDelay, runUpdateCheck]);

    useEffect(() => {
      if (!DEVICE_SUPPORTS_OTA_UPDATES || ranInitialCheck.current) {
        return;
      }
      scheduleUpdateCheck();
      ranInitialCheck.current = true;
      return clearExistingTimeout;
    }, [scheduleUpdateCheck, clearExistingTimeout]);

    useEffect(() => {
      if (!DEVICE_SUPPORTS_OTA_UPDATES) {
        return;
      }

      const subscription = AppState.addEventListener(
        'change',
        async (nextAppState) => {
          if (
            appState.current.match(/inactive|background/) &&
            nextAppState === 'active'
          ) {
            // If backgrounded longer than our initial delay, trigger an immediate check
            if (Date.now() - lastMinimize.current >= INITIAL_DELAY) {
              clearExistingTimeout();
              if (isUpdatePending && DEVICE_SUPPORTS_RELOAD) {
                // UPDATE 08/19/2025: We decided to drop OTA updates auto-installing as it results
                // in users losing deeplinks or push nav links.
                return;
              } else if (!isUpdatePending) {
                await runUpdateCheck();
                setCurrentDelay(INITIAL_DELAY); // reset delay on resume
                scheduleUpdateCheck();
              }
            }
          } else {
            lastMinimize.current = Date.now();
          }
          appState.current = nextAppState;
        },
      );

      return () => {
        clearExistingTimeout();
        subscription.remove();
      };
    }, [
      isUpdatePending,
      runUpdateCheck,
      scheduleUpdateCheck,
      clearExistingTimeout,
    ]);

    const restart = useCallback(async () => {
      if (!DEVICE_SUPPORTS_RELOAD) {
        logInDevOnly('attempted to call reloadAsync on unsupported device');
        return;
      }
      await reloadAsync();
    }, []);

    const value = useMemo(
      () => ({
        hasDownloadedUpdate,
        lastCheckedForUpdateAt,
        updateError,
        restart,
        supportsRestart: DEVICE_SUPPORTS_RELOAD,
      }),
      [hasDownloadedUpdate, lastCheckedForUpdateAt, updateError, restart],
    );

    return (
      <CheckForOverTheAirUpdateContext.Provider value={value}>
        {children}
      </CheckForOverTheAirUpdateContext.Provider>
    );
  });

CheckForOverTheAirUpdateProvider.displayName =
  'CheckForOverTheAirUpdateProvider';

const useCheckForOverTheAirUpdate = () =>
  useContext(CheckForOverTheAirUpdateContext);

export {
  CheckForOverTheAirUpdateProvider,
  DEVICE_SUPPORTS_RELOAD,
  useCheckForOverTheAirUpdate,
};
