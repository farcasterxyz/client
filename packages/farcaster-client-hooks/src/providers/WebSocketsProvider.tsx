import {
  ApiWebSocketAuthenticateMessage,
  ApiWebSocketMessage,
  ApiWebSocketMessageType,
} from 'farcaster-client-data';
import React from 'react';

import { useFarcasterApiClient } from './FarcasterApiClientProvider';

type OnMessageCallback = ({
  message,
}: {
  message: ApiWebSocketMessage;
}) => void;

type OnMessageCallbackReferences = {
  [referenceId: string]: OnMessageCallback;
};

export type WebSocketsProviderContextValue = {
  send: ({ message }: { message: ApiWebSocketMessage }) => void;
  registerOnMessageCallback: ({
    messageType,
    cbReferenceId,
    cb,
  }: {
    messageType: ApiWebSocketMessageType;
    cbReferenceId: string;
    cb: OnMessageCallback;
  }) => void;
  unregisterOnMessageCallback: ({
    messageType,
    cbReferenceId,
  }: {
    messageType: ApiWebSocketMessageType;
    cbReferenceId: string;
  }) => void;
};

type OnMessageCallbacks = {
  [mt in ApiWebSocketMessageType]: OnMessageCallbackReferences;
};

const WebSocketsProviderContext =
  React.createContext<WebSocketsProviderContextValue>({
    send: () => {},
    registerOnMessageCallback: () => {},
    unregisterOnMessageCallback: () => {},
  });

export type WebSocketsProviderProps = {
  children: React.ReactNode;
};

const WebSocketsProvider = React.memo(
  ({ children }: WebSocketsProviderProps) => {
    const { apiClient } = useFarcasterApiClient();

    const hooks = React.useRef<OnMessageCallbacks>(
      {} as OnMessageCallbacks,
    ).current;

    const webSocket = React.useRef<WebSocket>(undefined);

    const registerOnMessageCallback = React.useCallback(
      ({
        messageType,
        cbReferenceId,
        cb,
      }: {
        messageType: ApiWebSocketMessageType;
        cbReferenceId: string;
        cb: OnMessageCallback;
      }) => {
        const callbacks = hooks[messageType] || {};

        callbacks[cbReferenceId] = cb;

        hooks[messageType] = callbacks;
      },
      [hooks],
    );

    const unregisterOnMessageCallback = React.useCallback(
      ({
        messageType,
        cbReferenceId,
      }: {
        messageType: ApiWebSocketMessageType;
        cbReferenceId: string;
      }) => {
        const callbacks = hooks[messageType] || {};
        delete callbacks[cbReferenceId];
        hooks[messageType] = callbacks;
      },
      [hooks],
    );

    const send = React.useCallback(
      ({ message }: { message: ApiWebSocketMessage }) => {
        if (webSocket.current) {
          webSocket.current.send(JSON.stringify(message));
        } else {
          throw new Error(
            'No current WebSocket reference found to send message',
          );
        }
      },
      [webSocket],
    );

    const runApplicableHooks = React.useCallback(
      ({ message }: { message: ApiWebSocketMessage }) => {
        const callbacksWithReferences = hooks[message.messageType];

        const callbacks = Object.values(callbacksWithReferences);

        for (const cb of callbacks) {
          cb({ message });
        }
      },
      [hooks],
    );

    React.useEffect(() => {
      let hasUnmounted = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let backoff = 500;

      const reconnect = async () => {
        if (hasUnmounted) {
          return;
        }

        if (
          !webSocket.current &&
          apiClient.options.authToken &&
          apiClient.webSocketUrl
        ) {
          try {
            const ws = new WebSocket(apiClient.webSocketUrl);

            ws.onclose = () => {
              backoff *= 2;
              if (backoff > 8000) {
                backoff = 8000;
              }

              webSocket.current = undefined;
            };
            ws.onopen = () => {
              backoff = 500;
              webSocket.current = ws;
              if (apiClient.options.authToken) {
                try {
                  ws.send(
                    JSON.stringify({
                      messageType: 'authenticate',
                      data: 'Bearer ' + apiClient.options.authToken.secret,
                    } satisfies ApiWebSocketAuthenticateMessage),
                  );
                } catch {
                  // if this fails it's due to rapid failover of webSocket,
                  // let's let it wait for recovery.
                  backoff = 8000;
                  webSocket.current = undefined;
                }
              }
            };
            ws.onmessage = (e) => {
              try {
                const message = JSON.parse(e.data) as ApiWebSocketMessage;
                runApplicableHooks({ message });
              } catch {}
            };
          } catch {
            backoff *= 2;
            if (backoff > 8000) {
              backoff = 8000;
            }
            webSocket.current = undefined;
          }
        }

        timeout = setTimeout(reconnect, backoff);
      };

      timeout = setTimeout(reconnect, backoff);

      return () => {
        hasUnmounted = true;
        clearTimeout(timeout);
      };
    }, [apiClient.options, apiClient.webSocketUrl, runApplicableHooks]);

    const memoizedContextProvider = React.useMemo(
      () => (
        <WebSocketsProviderContext.Provider
          value={{
            send,
            registerOnMessageCallback,
            unregisterOnMessageCallback,
          }}
        >
          {children}
        </WebSocketsProviderContext.Provider>
      ),
      [children, registerOnMessageCallback, send, unregisterOnMessageCallback],
    );

    return memoizedContextProvider;
  },
);

WebSocketsProvider.displayName = 'WebSocketsProvider';

const useWebSockets = () => React.useContext(WebSocketsProviderContext);

export { useWebSockets, WebSocketsProvider };
