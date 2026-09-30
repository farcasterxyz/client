import * as React from 'react';

import { useSharedNavigationContext } from '../../contexts';
import { useAttemptBiometricAuth } from './useAttemptBiometricAuth';

type ResolveRejectBiometricAuth = {
  resolve: () => void;
  reject: (error: Error) => void;
};

function useRequireBiometricAuth(): Promise<void> {
  const { goBack } = useSharedNavigationContext();
  const attemptBiometricAuth = useAttemptBiometricAuth();

  const resolveRejectPromiseRef = React.useRef<
    undefined | ResolveRejectBiometricAuth
  >(undefined);
  const promiseRef = React.useRef<undefined | Promise<void>>(undefined);
  if (!resolveRejectPromiseRef.current || !promiseRef.current) {
    promiseRef.current = new Promise((resolve, reject) => {
      resolveRejectPromiseRef.current = { resolve, reject };
    });
  }

  const hasAuthenticatedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasAuthenticatedRef.current) {
      return;
    }
    hasAuthenticatedRef.current = true;
    void (async () => {
      const authResult = await attemptBiometricAuth();
      if (!authResult.success) {
        goBack();
      }
      if (!resolveRejectPromiseRef.current) {
        throw new Error('resolveRejectPromiseRef.current is undefined');
      } else if (authResult.success) {
        resolveRejectPromiseRef.current.resolve();
      } else {
        resolveRejectPromiseRef.current.reject(
          new Error('attemptBiometricAuth did not return success'),
        );
      }
    })();
  }, [attemptBiometricAuth, goBack]);

  return promiseRef.current;
}

export { useRequireBiometricAuth };
