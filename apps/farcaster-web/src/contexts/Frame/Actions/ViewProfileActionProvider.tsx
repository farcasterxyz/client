import { ViewProfile } from '@farcaster/miniapp-core';
import React, { useCallback, useMemo, useState } from 'react';

import { ViewProfileDialog } from '~/components/frames/ViewProfileDialog';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type ViewProfileParams = {
  fid: number;
};

type ViewProfileState = ViewProfile.ViewProfileOptions;

type ViewProfileActionContextValue = {
  viewProfile: (options: ViewProfileParams) => Promise<void>;
};

const ViewProfileContext = React.createContext<ViewProfileActionContextValue>({
  viewProfile: async () => {
    throw new Error('Must be called in ViewProfileContext provider');
  },
});

type ViewProfileActionProviderProps = {
  children: React.ReactNode;
};

export const useViewProfileAction = () => React.useContext(ViewProfileContext);

export const ViewProfileActionProvider: React.FC<
  ViewProfileActionProviderProps
> = ({ children }) => {
  const [params, setParams] = useState<ViewProfileState | null>(null);
  const { miniAppMinimized } = useMinimizableWindowContext();
  const navigate = useNavigate();

  const viewProfile = useCallback(
    async (params: ViewProfileParams) => {
      navigate({
        to: 'profileCastsWithoutUsername',
        params: {
          fid: params.fid,
        },
      });
    },
    [navigate],
  );

  const contextValue = useMemo(
    () => ({
      viewProfile,
    }),
    [viewProfile],
  );

  const handleClose = () => {
    if (params) {
      setParams(null);
    }
  };

  return (
    <ViewProfileContext.Provider value={contextValue}>
      {children}
      {params && !miniAppMinimized && (
        <ViewProfileDialog {...params} onDismiss={handleClose} />
      )}
    </ViewProfileContext.Provider>
  );
};
