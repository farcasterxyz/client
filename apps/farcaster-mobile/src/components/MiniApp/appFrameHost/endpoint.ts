/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import * as Comlink from 'comlink';
import { RefObject } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

export const SYMBOL_IGNORING_RPC_RESPONSE_ERROR: symbol = Symbol();

export type WebViewEndpoint = Comlink.Endpoint & {
  /**
   * Manually distribute events to listeners as an alternative to `document.addEventHandler` which is unavailable in React Native.
   */
  onMessage: (e: WebViewMessageEvent) => void;
};

/**
 * An endpoint of communicating with WebView
 */
export function createWebViewRpcEndpoint(
  ref: RefObject<WebView>,
): WebViewEndpoint & { emit: (data: any) => void } {
  const listeners: EventListenerOrEventListenerObject[] = [];
  return {
    addEventListener: (type, listener) => {
      if (type !== 'message') {
        throw Error(
          `Got an unexpected event type "${type}". Expected "message".`,
        );
      }
      listeners.push(listener);
    },
    removeEventListener: (type, listener) => {
      if (type !== 'message') {
        throw Error(
          `Got an unexpected event type "${type}". Expected "message".`,
        );
      }
      listeners.splice(listeners.findIndex((l) => l === listener));
    },
    postMessage: (data) => {
      if (!ref.current) {
        if (
          'value' in data &&
          data.value === SYMBOL_IGNORING_RPC_RESPONSE_ERROR
        ) {
          return;
        }
        throw Error('Failed to return RPC response to WebView via postMessage');
      }
      const dataStr = JSON.stringify(data);
      console.debug('[webview:res]', dataStr);
      return ref.current.injectJavaScript(`
        console.debug('[webview:res]', ${dataStr});
        document.dispatchEvent(new MessageEvent('FarcasterAppFrameCallback', { data: ${dataStr} }));
      `);
    },
    onMessage: (e) => {
      console.debug('[webview:req]', e.nativeEvent.data);
      const data = JSON.parse(e.nativeEvent.data);
      const messageEvent = new MessageEvent(data);
      listeners.forEach((l) => {
        if (typeof l === 'function') {
          // Actually, messageEvent doesn't satisfy Event interface,
          // but it satisfies the minimum properties that Comlink's listener requires.
          l(messageEvent as unknown as Event);
        } else {
          l.handleEvent(messageEvent as unknown as Event);
        }
      });
    },
    emit: (data) => {
      if (!ref.current) {
        throw Error('Failed to send Event to WebView via postMessage');
      }
      console.debug('[webview:emit]', data);
      const dataStr = JSON.stringify(data);
      return ref.current.injectJavaScript(`
        console.debug('[webview:emit]', ${dataStr});
        document.dispatchEvent(new MessageEvent('FarcasterAppFrameEvent', { data: ${dataStr} }));
      `);
    },
  };
}

/**
 * Standard MessageEvent is unavailable in React Native since it's part of HTML Standard.
 * Instead, implement our own MessageEvent with the minimum properties required by Comlink implementation.
 */
class MessageEvent {
  public origin = 'ReactNativeWebView';
  constructor(public data: unknown) {}
}
