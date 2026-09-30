import * as Comlink from 'comlink';
import type * as RpcSchema from 'ox/RpcSchema';
import { RefObject, useCallback, useEffect, useRef } from 'react';
import WebView, {
  WebViewMessageEvent,
  WebViewProps,
} from 'react-native-webview';

import { createWebViewRpcEndpoint, WebViewEndpoint } from './endpoint';

type SetPrimaryButton = (options: {
  text: string;
  loading?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}) => void;

export type EthProviderRequest = <
  methodName extends RpcSchema.ExtractMethodName<RpcSchema.Default>,
>(
  parameters: RpcSchema.ExtractRequest<RpcSchema.Default, methodName>,
) => Promise<RpcSchema.ExtractReturnType<RpcSchema.Default, methodName>>;

export type AppFrameSDK = {
  untrustedUser: {
    fid: number;
  };
  close: () => void;
  hideSplashScreen: () => void;
  openUrl: (url: string) => void;
  followChannel: (options: { key: string }) => void;
  setPrimaryButton: SetPrimaryButton;
  ethProviderRequest: EthProviderRequest;
};

/**
 * Returns a handler of RPC message from WebView.
 */
export function useWebViewRpcAdapter(
  webViewRef: RefObject<WebView>,
  sdk: AppFrameSDK,
) {
  const endpointRef = useRef<
    WebViewEndpoint & {
      emit: (data: unknown) => void;
    }
  >(undefined);

  const onMessage: WebViewProps['onMessage'] = useCallback(
    (e: WebViewMessageEvent) => {
      endpointRef.current?.onMessage(e);
    },
    [endpointRef],
  );

  useEffect(() => {
    const endpoint = createWebViewRpcEndpoint(webViewRef);
    endpointRef.current = endpoint;

    Comlink.expose(sdk, endpoint);

    return () => {
      endpointRef.current = undefined;
    };
  }, [webViewRef, sdk]);

  return {
    onMessage,
    emit: endpointRef.current?.emit,
  };
}
