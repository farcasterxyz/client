import { Context } from '@farcaster/miniapp-host';
import {
  useFetchFrameDetails,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import * as React from 'react';

import { MiniAppLaunchConfig } from '~/components/miniApp/MiniApp';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { toast } from '~/utils/toast';

type DevPreviewLaunchContext = {
  type: 'dev_preview';
};

export type LaunchContext = DevPreviewLaunchContext | Context.LocationContext;

export type MiniAppParams = {
  launchConfig: MiniAppLaunchConfig;
  context: LaunchContext;
  debug?: boolean;
  skipConfirmation?: boolean;
};

// You should probably be calling useMinimizableWindowContext instead of this
// one to make sure that the wallet gets minimized when the mini app is opened
// or maximized
type MiniAppContextValue = {
  launchMiniAppWithoutMinimizingWallet: (params: MiniAppParams) => void;
  dismiss: () => void;
  minimize: () => void;
  maximizeMiniAppWithoutMinimizingWallet: () => void;
  minimized: boolean;
  miniAppParams: MiniAppParams | undefined;
};

const MiniAppContext = React.createContext<MiniAppContextValue>({
  launchMiniAppWithoutMinimizingWallet: () => {
    throw new Error('No MiniAppProvider');
  },
  dismiss: () => {
    throw new Error('No MiniAppProvider');
  },
  minimize: () => {
    throw new Error('No MiniAppProvider');
  },
  maximizeMiniAppWithoutMinimizingWallet: () => {
    throw new Error('No MiniAppProvider');
  },
  minimized: false,
  miniAppParams: undefined,
});

type ConfirmingMiniAppOpen = {
  params: MiniAppParams;
  curFrameName: string;
  newFrameName: string;
};

type MiniAppProviderProps = {
  children: React.ReactNode;
};

export const MiniAppProvider: React.FC<MiniAppProviderProps> = ({
  children,
}) => {
  const [miniAppParams, setMiniAppParams] = React.useState<
    MiniAppParams | undefined
  >(undefined);
  const [miniAppMinimized, setMiniAppMinimized] = React.useState(false);

  const [confirmingMiniAppOpenParams, setConfirmingMiniAppOpenParams] =
    React.useState<ConfirmingMiniAppOpen | null>(null);

  const forceLaunchMiniApp = React.useCallback((params: MiniAppParams) => {
    setMiniAppMinimized(false);
    setMiniAppParams(params);
  }, []);

  let curFrameDomain = '';
  if (miniAppParams) {
    const url = new URL(miniAppParams.launchConfig.url);
    curFrameDomain = url.hostname;
  }

  const baseCurFrameName =
    miniAppParams?.launchConfig.type === 'standalone'
      ? miniAppParams.launchConfig.name
      : undefined;
  const shouldFetchCurFrameName = miniAppParams && !baseCurFrameName;

  const { data } = useNonSuspenseFrameDetails({
    domain: curFrameDomain,
    enabled: !!shouldFetchCurFrameName,
  });
  const curFrameDetails = useGloballyCachedFrame(data);
  const prefetchedCurFrameName = baseCurFrameName
    ? baseCurFrameName
    : curFrameDetails?.name;

  const fetchFrameDetails = useFetchFrameDetails();

  const miniAppOpen = !!miniAppParams;
  const launchMiniAppWithoutMinimizingWallet = React.useCallback(
    async (params: MiniAppParams) => {
      if (!params.launchConfig.url?.startsWith('https://') && !params.debug) {
        toast({
          message: 'Invalid mini app URL',
          type: 'error',
          toastId: 'invalid-mini-app-url',
        });
        return;
      }

      if (!miniAppOpen || params.skipConfirmation === true) {
        forceLaunchMiniApp(params);
        return;
      }

      const url = new URL(params.launchConfig.url);
      const newDomain = url.hostname;
      if (curFrameDomain === newDomain) {
        forceLaunchMiniApp(params);
        return;
      }

      const [curFrameName, newFrameName] = await Promise.all([
        (async () => {
          if (prefetchedCurFrameName) {
            return prefetchedCurFrameName;
          }
          const details = await fetchFrameDetails({ domain: curFrameDomain });
          return details?.name ?? curFrameDomain;
        })(),
        (async () => {
          const details = await fetchFrameDetails({ domain: newDomain });
          return details?.name ?? newDomain;
        })(),
      ]);

      setConfirmingMiniAppOpenParams({ params, curFrameName, newFrameName });
    },
    [
      miniAppOpen,
      forceLaunchMiniApp,
      prefetchedCurFrameName,
      fetchFrameDetails,
      curFrameDomain,
    ],
  );

  const dismiss = React.useCallback(() => {
    setMiniAppParams(undefined);
  }, []);

  const minimize = React.useCallback(() => {
    setMiniAppMinimized(true);
  }, []);

  const maximizeMiniAppWithoutMinimizingWallet = React.useCallback(() => {
    setMiniAppMinimized(false);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      launchMiniAppWithoutMinimizingWallet,
      dismiss,
      minimize,
      maximizeMiniAppWithoutMinimizingWallet,
      minimized: miniAppMinimized,
      miniAppParams,
    }),
    [
      launchMiniAppWithoutMinimizingWallet,
      dismiss,
      minimize,
      maximizeMiniAppWithoutMinimizingWallet,
      miniAppMinimized,
      miniAppParams,
    ],
  );

  return (
    <MiniAppContext.Provider value={contextValue}>
      {children}
      {confirmingMiniAppOpenParams && (
        <ConfirmationModal
          onCancel={() => {
            setConfirmingMiniAppOpenParams(null);
          }}
          onConfirm={() => {
            setConfirmingMiniAppOpenParams(null);
            if (confirmingMiniAppOpenParams) {
              forceLaunchMiniApp(confirmingMiniAppOpenParams.params);
            }
          }}
          title={`Close ${confirmingMiniAppOpenParams.curFrameName}?`}
          body={
            <>
              {`You have ${confirmingMiniAppOpenParams.curFrameName} open. `}
              Would you like to close it and open
              {` ${confirmingMiniAppOpenParams.newFrameName}?`}
            </>
          }
        />
      )}
    </MiniAppContext.Provider>
  );
};

export const useLaunchMiniApp = () => React.useContext(MiniAppContext);
