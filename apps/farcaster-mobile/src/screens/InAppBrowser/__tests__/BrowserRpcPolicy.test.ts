import { evaluateBrowserRpcPolicy } from '../BrowserRpcPolicy';

describe('BrowserRpcPolicy', () => {
  it('blocks all RPC when injection is disabled', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: false,
      request: { id: '1', method: 'eth_chainId', params: [] },
    });
    expect(decision.allowed).toBe(false);
  });

  it('allows chain id reads at tier 1', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: true,
      request: { id: '1', method: 'eth_chainId', params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: false,
    });
  });

  it('returns connect prompt requirement for eth_requestAccounts', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: true,
      request: { id: '1', method: 'eth_requestAccounts', params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: true,
    });
  });

  it('returns connect prompt requirement for wallet_requestPermissions', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: true,
      request: { id: '1', method: 'wallet_requestPermissions', params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: true,
    });
  });

  it('rejects wallet_addEthereumChain', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 3,
      injectEnabled: true,
      request: { id: '1', method: 'wallet_addEthereumChain', params: [] },
    });
    expect(decision.allowed).toBe(false);
  });

  it('allows wallet_switchEthereumChain after connect', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 2,
      injectEnabled: true,
      request: {
        id: '1',
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }],
      },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: false,
    });
  });

  it('requires connection before wallet_switchEthereumChain', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: true,
      request: {
        id: '1',
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }],
      },
    });
    expect(decision.allowed).toBe(false);
  });

  it('allows signing and transaction methods after connect', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 2,
      injectEnabled: true,
      request: { id: '1', method: 'eth_sendTransaction', params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: false,
    });
  });

  it('allows wallet_getPermissions at tier 1', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: true,
      request: { id: '1', method: 'wallet_getPermissions', params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: false,
    });
  });

  it('allows wallet_getCapabilities at tier 1', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 1,
      injectEnabled: true,
      request: { id: '1', method: 'wallet_getCapabilities', params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: false,
    });
  });

  it('rejects unknown methods by default', () => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 3,
      injectEnabled: true,
      request: { id: '1', method: 'wallet_watchAsset', params: [] },
    });
    expect(decision.allowed).toBe(false);
  });

  it.each([
    'eth_getBalance',
    'eth_getCode',
    'eth_getStorageAt',
    'eth_getBlockByNumber',
    'eth_getLogs',
    'wallet_getCallsStatus',
    'wallet_showCallsStatus',
  ])('allows %s at tier 2', (method) => {
    const decision = evaluateBrowserRpcPolicy({
      tier: 2,
      injectEnabled: true,
      request: { id: '1', method, params: [] },
    });
    expect(decision).toEqual({
      allowed: true,
      requiresConnectPrompt: false,
    });
  });
});
