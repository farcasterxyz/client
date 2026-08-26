import {
  SendToken,
  SignIn,
  SolanaConnectRequestArguments,
  SolanaSignMessageRequestArguments,
  SolanaWireSignAndSendTransactionRequestArguments,
  SolanaWireSignTransactionRequestArguments,
  SwapToken,
} from '@farcaster/miniapp-core';
import { EventEmitter } from 'eventemitter3';
import * as Provider from 'ox/Provider';
import * as RpcRequest from 'ox/RpcRequest';
import * as RpcResponse from 'ox/RpcResponse';
import * as RpcSchema from 'ox/RpcSchema';
import * as RpcTransport from 'ox/RpcTransport';
import * as Siwe from 'ox/Siwe';

import {
  ApiChain,
  ApiJsonFarcasterSignature,
  ApiSwapIntent,
  AuthToken,
} from '../types';

/** Combines members of an intersection into a readable type. */
// https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg
export type Compute<type> = { [key in keyof type]: type[key] } & unknown;

export type InitSchema = RpcSchema.From<{
  Request: {
    method: 'auth';
    params?: undefined;
  };
  ReturnType: {
    authToken: AuthToken;
    siwfMessage: string;
    siwfSignature: string;
  };
}>;

export type EthProviderEvent =
  | {
      event: 'accountsChanged';
      params: string[];
    }
  | {
      event: 'chainChanged';
      params: string;
    }
  | {
      event: 'connect';
      params: Provider.ConnectInfo;
    }
  | {
      event: 'disconnect';
      params: undefined;
    };

export type WarpcastSchema = RpcSchema.From<
  | {
      Request: {
        method: 'navigate';
        params: {
          to: string;
          params?: unknown;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'open_wallet';
        params: undefined;
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'eth_provider_event';
        params: EthProviderEvent;
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'get_connection_context';
        params?: undefined;
      };
      ReturnType: {
        domain: string;
        iconUrl?: string;
      };
    }
  | {
      Request: {
        method: 'connected';
        params: {
          connected: boolean;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'send_token_result';
        params: {
          result: SendToken.SendTokenResult;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'swap_token_result';
        params: {
          result: SwapToken.SwapTokenResult;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'sign_in_with_auth_address_result';
        params: {
          result: SignIn.SignInResult;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'report_transaction_state';
        params: {
          state: 'confirmed' | 'cancelled' | 'pending' | 'failed';
          metadata?: {
            type?: string;
            [key: string]: unknown;
          };
        };
      };
      ReturnType: undefined;
    }
  // TODO deprecated, remove once removed from EmbeddedWallet in farcaster-web
  | {
      Request: {
        method: 'report_wallet_locked';
        params: undefined;
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'close_wallet';
        params: undefined;
      };
      ReturnType: undefined;
    }
>;
export type WalletSchema = RpcSchema.From<
  | {
      Request: {
        method: 'logout';
        params?: undefined;
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'navigate';
        params: {
          path: string;
          params?: unknown;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'send_token';
        params: {
          sendIntent?: {
            chain: ApiChain;
            ca: string;
            amount?: string;
            recipientAddress?: string;
            recipientFid?: number;
          };
          attributedDomain?: string;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'swap_token';
        params: {
          swapIntent?: ApiSwapIntent;
          attributedDomain?: string;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'set_open';
        params: {
          open: boolean;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'refresh';
        params?: undefined;
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'sign_in_with_auth_address';
        params: {
          message: Omit<Siwe.Message, 'address'>;
        };
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'clear_preview_requests';
        params?: undefined;
      };
      ReturnType: undefined;
    }
  | {
      Request: {
        method: 'silently_sign_manifest';
        params: {
          domain: string;
        };
      };
      ReturnType: ApiJsonFarcasterSignature;
    }
  | {
      Request: {
        method: 'silently_sign_auth_message';
        params: {
          message: string;
        };
      };
      ReturnType: {
        signature: `0x${string}`;
      };
    }
>;
export type SolanaSchema = RpcSchema.From<
  | {
      Request: SolanaConnectRequestArguments & {
        params?: undefined;
      };
      ReturnType: {
        publicKey: string;
      };
    }
  | {
      Request: SolanaSignMessageRequestArguments;
      ReturnType: {
        signature: string;
      };
    }
  | {
      Request: SolanaWireSignAndSendTransactionRequestArguments;
      ReturnType: {
        signature: string;
      };
    }
  | {
      Request: SolanaWireSignTransactionRequestArguments;
      ReturnType: {
        signedTransaction: string;
      };
    }
>;

export type Client<schema extends RpcSchema.Generic> =
  RpcTransport.RpcTransport<false, {}, schema> & {
    destroy: () => void;
  };

export function createClient<schema extends RpcSchema.Generic>({
  channelName,
  port,
}: {
  channelName: string;
  port: MessagePort;
}): Client<schema> {
  const pendingRequestCallbacks: Record<
    string,
    (response: RpcResponse.RpcResponse) => void
  > = {};
  const store = RpcRequest.createStore<schema>();

  const request: RpcTransport.RequestFn<false, {}, schema> = async (
    parameters,
  ) => {
    return new Promise((resolve, reject) => {
      const request = store.prepare(parameters);
      // console.debug('rpc request', channelName, request);

      pendingRequestCallbacks[request.id] = (
        response: RpcResponse.RpcResponse,
      ) => {
        // console.debug('rpc response', channelName, response);
        try {
          resolve(
            RpcResponse.parse(response, {
              request,
            }) as never,
          );
        } catch (error) {
          reject(RpcResponse.parseError(error));
        }
      };

      port.postMessage({
        [channelName]: request,
      });
    });
  };

  function handleMessage(
    event: MessageEvent<Record<string, RpcResponse.RpcResponse>>,
  ) {
    const message = event.data;
    if (message[channelName]) {
      const response = message[channelName];
      const callback = pendingRequestCallbacks[response.id];
      if (callback) {
        delete pendingRequestCallbacks[response.id];
        return callback(response);
      }
    }
  }

  function destroy() {
    port.removeEventListener('message', handleMessage);

    for (const [id, cb] of Object.entries(pendingRequestCallbacks)) {
      cb({
        id: Number(id),
        jsonrpc: '2.0',
        error: {
          code: RpcResponse.InternalError.code,
          message: 'Client destroyed',
        },
      });
    }
  }

  port.addEventListener('message', handleMessage);

  return {
    request,
    destroy,
  };
}

export type Server = {
  destroy: () => void;
};

export function createServer<schema extends RpcSchema.Generic>({
  channelName,
  port,
  handleRequest,
}: {
  channelName: string;
  port: MessagePort;
  handleRequest: {
    current: RpcTransport.RequestFn<false, {}, schema>;
  };
}) {
  function handleMessage(
    event: MessageEvent<Record<string, RpcRequest.RpcRequest<schema>>>,
  ) {
    const message = event.data;
    if (message[channelName]) {
      const request = message[channelName];

      (async () => {
        const response = await (async () => {
          try {
            const result = await handleRequest.current(request as never);
            // @ts-expect-error - unable to type
            return RpcResponse.from({ result }, { request });
          } catch (e) {
            if (
              e instanceof RpcResponse.BaseError ||
              e instanceof Provider.ProviderRpcError
            ) {
              return {
                id: request.id,
                jsonrpc: request.jsonrpc,
                error: {
                  code: e.code,
                  message: e.message,
                },
              };
            }

            return {
              id: request.id,
              jsonrpc: request.jsonrpc,
              error: {
                code: RpcResponse.InternalError.code,
                message: (e as Error).message,
              },
            };
          }
        })();

        port.postMessage({
          [channelName]: response,
        });
      })();
    }

    return;
  }

  port.addEventListener('message', handleMessage);

  function close() {
    port.removeEventListener('message', handleMessage);
  }

  return {
    close,
  };
}

export type Emitter<eventMap extends EventEmitter.ValidEventTypes> = Compute<
  EventEmitter<eventMap>
>;

export function createEmitter<
  eventMap extends EventEmitter.ValidEventTypes,
>(): Emitter<eventMap> {
  const emitter = new EventEmitter<eventMap>();

  return {
    get eventNames() {
      return emitter.eventNames.bind(emitter);
    },
    get listenerCount() {
      return emitter.listenerCount.bind(emitter);
    },
    get listeners() {
      return emitter.listeners.bind(emitter);
    },
    addListener: emitter.addListener.bind(emitter),
    emit: emitter.emit.bind(emitter),
    off: emitter.off.bind(emitter),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  };
}
