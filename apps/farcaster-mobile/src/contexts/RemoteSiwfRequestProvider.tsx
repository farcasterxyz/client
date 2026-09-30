import { useGetRemoteSiwfRequest, useWebSockets } from 'farcaster-client-hooks';
import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { remoteSiwfRequestPrompt } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { trackError } from '~/utils/ErrorUtils';
import { logInDevOnly } from '~/utils/LogUtils';

import { useConnectionStatus } from './ConnectionStatusProvider';

export function RemoteSiwfRequestProvider({
  children,
}: {
  children: ReactNode;
}) {
  const isSignedIn = useIsSignedIn();

  const { isOnline } = useConnectionStatus();

  return (
    <>
      {children}
      {isSignedIn && isOnline && <RemoteSiwfRequestHandlers />}
    </>
  );
}

export function RemoteSiwfRequestHandlers() {
  const { registerOnMessageCallback } = useWebSockets();
  const { showGlobalPrompt } = useGlobalPrompts();
  const getRemoteSiwfRequest = useGetRemoteSiwfRequest();

  const appState = useRef(AppState.currentState);
  const isFirstLoad = useRef(true);

  const getCurrentRequest = useCallback(async () => {
    try {
      const res = await getRemoteSiwfRequest({
        token: undefined,
      });

      // navigate if we found a request and it hasn't been handled
      if (res.request && !res.request.error && !res.request.signature) {
        logInDevOnly('Found current SIWF request, opening');
        showGlobalPrompt({
          key: remoteSiwfRequestPrompt,
          globalPromptData: {
            remoteSiwfRequest: { token: res.request.token },
          },
        });
      }
    } catch (e) {
      trackError(e);
    }
  }, [getRemoteSiwfRequest, showGlobalPrompt]);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      logInDevOnly('Checking for current SIWF request');
      setTimeout(() => {
        void getCurrentRequest();
      }, 125);
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        void getCurrentRequest();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [getCurrentRequest]);

  const { unregisterOnMessageCallback } = useWebSockets();

  useEffect(() => {
    registerOnMessageCallback({
      messageType: 'remote-siwf-request',
      cbReferenceId: 'RemoteSiwfRequestProvider',
      cb: ({ message }) => {
        if (message.messageType === 'remote-siwf-request') {
          logInDevOnly('RemoteSiwfRequestProvider: received message');
          showGlobalPrompt({
            key: remoteSiwfRequestPrompt,
            globalPromptData: {
              remoteSiwfRequest: { token: message.payload.token },
            },
          });
        }
      },
    });
    return () => {
      unregisterOnMessageCallback({
        messageType: 'remote-siwf-request',
        cbReferenceId: 'RemoteSiwfRequestProvider',
      });
    };
  }, [
    registerOnMessageCallback,
    unregisterOnMessageCallback,
    showGlobalPrompt,
  ]);

  return null;
}
