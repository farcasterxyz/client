import { parseBrowserBridgeMessage } from '../BrowserWalletBridge';

const TOKEN = 'b9c7d8e0-1234-5678-9abc-def012345678';

describe('BrowserWalletBridge', () => {
  it('accepts bridge requests that match the active origin and token', () => {
    const result = parseBrowserBridgeMessage(
      {
        nativeEvent: {
          data: JSON.stringify({
            channel: 'farcaster_browser_wallet',
            type: 'rpc_request',
            payload: {
              id: '1',
              method: 'eth_chainId',
              params: [],
              origin: 'https://example.com',
              url: 'https://example.com/app',
              token: TOKEN,
            },
          }),
          url: 'https://example.com/app',
        },
      } as never,
      'https://example.com',
      TOKEN,
    );

    expect(result).toEqual({
      id: '1',
      method: 'eth_chainId',
      params: [],
      origin: 'https://example.com',
      url: 'https://example.com/app',
    });
  });

  it('rejects requests from a mismatched native url origin', () => {
    const result = parseBrowserBridgeMessage(
      {
        nativeEvent: {
          data: JSON.stringify({
            channel: 'farcaster_browser_wallet',
            type: 'rpc_request',
            payload: {
              id: '1',
              method: 'eth_chainId',
              params: [],
              origin: 'https://example.com',
              url: 'https://example.com/app',
              token: TOKEN,
            },
          }),
          url: 'https://evil.com/app',
        },
      } as never,
      'https://example.com',
      TOKEN,
    );

    expect(result).toBeUndefined();
  });

  it('rejects requests whose payload origin disagrees with the active page', () => {
    const result = parseBrowserBridgeMessage(
      {
        nativeEvent: {
          data: JSON.stringify({
            channel: 'farcaster_browser_wallet',
            type: 'rpc_request',
            payload: {
              id: '1',
              method: 'eth_chainId',
              params: [],
              origin: 'https://evil.com',
              url: 'https://evil.com/app',
              token: TOKEN,
            },
          }),
          url: 'https://example.com/app',
        },
      } as never,
      'https://example.com',
      TOKEN,
    );

    expect(result).toBeUndefined();
  });

  it('rejects envelopes whose token does not match the per-mount nonce', () => {
    const result = parseBrowserBridgeMessage(
      {
        nativeEvent: {
          data: JSON.stringify({
            channel: 'farcaster_browser_wallet',
            type: 'rpc_request',
            payload: {
              id: '1',
              method: 'eth_chainId',
              params: [],
              origin: 'https://example.com',
              url: 'https://example.com/app',
              token: 'not-the-real-token',
            },
          }),
          url: 'https://example.com/app',
        },
      } as never,
      'https://example.com',
      TOKEN,
    );

    expect(result).toBeUndefined();
  });

  it('rejects envelopes that omit the token entirely', () => {
    const result = parseBrowserBridgeMessage(
      {
        nativeEvent: {
          data: JSON.stringify({
            channel: 'farcaster_browser_wallet',
            type: 'rpc_request',
            payload: {
              id: '1',
              method: 'eth_chainId',
              params: [],
              origin: 'https://example.com',
              url: 'https://example.com/app',
            },
          }),
          url: 'https://example.com/app',
        },
      } as never,
      'https://example.com',
      TOKEN,
    );

    expect(result).toBeUndefined();
  });

  it('strips the token from the returned request so handlers never see it', () => {
    const result = parseBrowserBridgeMessage(
      {
        nativeEvent: {
          data: JSON.stringify({
            channel: 'farcaster_browser_wallet',
            type: 'rpc_request',
            payload: {
              id: '1',
              method: 'eth_chainId',
              params: [],
              origin: 'https://example.com',
              url: 'https://example.com/app',
              token: TOKEN,
            },
          }),
          url: 'https://example.com/app',
        },
      } as never,
      'https://example.com',
      TOKEN,
    );

    expect(result).toBeDefined();
    expect(result).not.toHaveProperty('token');
  });
});
