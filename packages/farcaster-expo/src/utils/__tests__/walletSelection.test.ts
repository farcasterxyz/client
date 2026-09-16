import {
  buildEmbeddedWalletIndexByAddress,
  pickRootEmbeddedWallet,
} from '../walletSelection';

describe('pickRootEmbeddedWallet', () => {
  it('returns undefined for empty or missing lists', () => {
    expect(pickRootEmbeddedWallet(undefined)).toBeUndefined();
    expect(pickRootEmbeddedWallet([])).toBeUndefined();
  });

  it('returns the only wallet when there is a single wallet', () => {
    const wallet = { address: '0xa', walletIndex: 0 };
    expect(pickRootEmbeddedWallet([wallet])).toBe(wallet);
  });

  it('picks the lowest walletIndex regardless of array order', () => {
    const root = { address: '0xroot', walletIndex: 0 };
    const extra1 = { address: '0x1', walletIndex: 1 };
    const extra2 = { address: '0x2', walletIndex: 2 };
    expect(pickRootEmbeddedWallet([extra2, extra1, root])).toBe(root);
    expect(pickRootEmbeddedWallet([extra1, root, extra2])).toBe(root);
  });

  it('treats a missing walletIndex as the root (index 0)', () => {
    const legacyRoot: { address: string; walletIndex?: number } = {
      address: '0xroot',
    };
    const extra = { address: '0x1', walletIndex: 1 };
    expect(pickRootEmbeddedWallet([extra, legacyRoot])).toBe(legacyRoot);
  });

  it('keeps the first wallet on walletIndex ties', () => {
    const first = { address: '0xa', walletIndex: 0 };
    const second = { address: '0xb', walletIndex: 0 };
    expect(pickRootEmbeddedWallet([first, second])).toBe(first);
  });

  it('resolves the index from indexByAddress when objects omit walletIndex', () => {
    // Mirrors web: useWallets() returns walletIndex undefined for every wallet,
    // so array order would wrongly pick the first. The linkedAccounts-derived
    // map identifies the real root.
    const extra = { address: '0xExtra' };
    const root = { address: '0xRoot' };
    const indexByAddress = new Map([
      ['0xextra', 5],
      ['0xroot', 0],
    ]);
    expect(pickRootEmbeddedWallet([extra, root], indexByAddress)).toBe(root);
  });

  it('prefers the mapped index over the object walletIndex', () => {
    const a = { address: '0xA', walletIndex: 0 };
    const b = { address: '0xB', walletIndex: 1 };
    const indexByAddress = new Map([
      ['0xa', 9],
      ['0xb', 0],
    ]);
    expect(pickRootEmbeddedWallet([a, b], indexByAddress)).toBe(b);
  });
});

describe('buildEmbeddedWalletIndexByAddress', () => {
  const linkedAccounts = [
    {
      type: 'wallet',
      address: '0xEvmRoot',
      chainType: 'ethereum',
      walletClientType: 'privy',
      walletIndex: 0,
    },
    {
      type: 'wallet',
      address: '0xEvmExtra',
      chainType: 'ethereum',
      walletClientType: 'privy',
      walletIndex: 5,
    },
    {
      type: 'wallet',
      address: 'SolRoot',
      chainType: 'solana',
      walletClientType: 'privy',
      walletIndex: 0,
    },
    {
      type: 'wallet',
      address: '0xExternal',
      chainType: 'ethereum',
      walletClientType: 'metamask',
      walletIndex: 0,
    },
    { type: 'email', address: 'a@b.com' },
  ];

  it('maps lowercased address → walletIndex for the chain, privy wallets only', () => {
    const map = buildEmbeddedWalletIndexByAddress(linkedAccounts, 'ethereum');
    expect(map.get('0xevmroot')).toBe(0);
    expect(map.get('0xevmextra')).toBe(5);
    // other chain, external wallets, and non-wallet accounts are excluded
    expect(map.has('solroot')).toBe(false);
    expect(map.has('0xexternal')).toBe(false);
    expect(map.size).toBe(2);
  });

  it('scopes to the requested chainType', () => {
    const map = buildEmbeddedWalletIndexByAddress(linkedAccounts, 'solana');
    expect(map.get('solroot')).toBe(0);
    expect(map.size).toBe(1);
  });

  it('returns an empty map for missing linkedAccounts', () => {
    expect(buildEmbeddedWalletIndexByAddress(undefined, 'ethereum').size).toBe(
      0,
    );
  });
});
