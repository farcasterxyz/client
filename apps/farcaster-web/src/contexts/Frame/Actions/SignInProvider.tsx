import { SignIn, SignInOptions } from '@farcaster/miniapp-core';
import React, { useCallback, useMemo, useState } from 'react';

import { SignInDialog } from '~/components/frames/SignInDialog';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';

type SignInParams = {
  name?: string;
  domain: string;
  uri: string;
  options: SignInOptions;
  // True (default): render in a full-screen portal, render centered with full-screen overlay when frame is not open
  // False: render as absolute element, render on bottom with limited overlay when frame is open
  renderInPortal?: boolean;
};

type SignInState = SignInParams & {
  resolve: (value: SignIn.SignInResult) => void;
  reject: (e: unknown) => void;
};

export type SignInContextValue = {
  signIn: (params: SignInParams) => Promise<SignIn.SignInResult>;
  resetSignIn: () => void;
};

const SignInContext = React.createContext<SignInContextValue>({
  signIn: async () => {
    throw new Error('Must be called in SignInContext provider');
  },
  resetSignIn: () => {
    throw new Error('Must be called in SignInContext provider');
  },
});

type SignInProviderProps = {
  children: React.ReactNode;
};

export const useSignIn = () => React.useContext(SignInContext);

export const SignInProvider: React.FC<SignInProviderProps> = ({ children }) => {
  const [params, setParams] = useState<SignInState | null>(null);

  const signIn = useCallback((params: SignInParams) => {
    return new Promise<SignIn.SignInResult>((resolve, reject) => {
      setParams({
        ...params,
        resolve,
        reject,
      });
    });
  }, []);

  const resetSignIn = useCallback(() => {
    setParams(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      signIn,
      resetSignIn,
    }),
    [signIn, resetSignIn],
  );

  const handleClose = () => {
    if (params) {
      params.reject(new SignIn.RejectedByUser());
      setParams(null);
    }
  };

  const { miniAppMinimized } = useMinimizableWindowContext();

  return (
    <SignInContext.Provider value={contextValue}>
      {children}
      {params && !miniAppMinimized && (
        <SignInDialog
          name={params.name}
          domain={params.domain}
          targetUrl={params.uri}
          options={params.options}
          onDismiss={handleClose}
          onSignIn={async (result) => {
            try {
              params.resolve(result);
            } catch (e) {
              params.reject(e);
            } finally {
              setParams(null);
            }
          }}
          renderInPortal={params.renderInPortal}
        />
      )}
    </SignInContext.Provider>
  );
};
