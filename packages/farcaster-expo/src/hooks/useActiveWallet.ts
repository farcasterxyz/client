import { ApiEmbeddedWallet } from 'farcaster-client-data';
import { useEmbeddedWalletsQuery } from 'farcaster-client-hooks';
import React from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { useCurrentUserFid } from './useCurrentUser';
import { useSecondaryWalletsEnabled } from './useSecondaryWalletsEnabled';

const PRIMARY_NAMESPACE = 'primary';
const SECONDARY_NAMESPACE = 'secondary';
const MINI_APP_POLICY_OVERRIDES_KEY_PREFIX = 'wallet-mini-app-policy-overrides';

export type ActiveWalletNamespace = 'primary' | 'secondary';

export type LocalMiniAppPolicyOverrides = Record<string, 'allowed' | 'blocked'>;

export function getLocalMiniAppPolicyOverridesKey(fid: number | undefined) {
  return `${MINI_APP_POLICY_OVERRIDES_KEY_PREFIX}-${fid}`;
}

export function parseLocalMiniAppPolicyOverrides(
  rawOverrides: string | undefined,
): LocalMiniAppPolicyOverrides {
  if (!rawOverrides) {
    return {};
  }

  try {
    return JSON.parse(rawOverrides) as LocalMiniAppPolicyOverrides;
  } catch {
    return {};
  }
}

function applyLocalMiniAppPolicyOverrides(
  wallets: ApiEmbeddedWallet[],
  overrides: LocalMiniAppPolicyOverrides,
) {
  return wallets.map((wallet) => {
    const override = overrides[wallet.id];
    if (!override) {
      return wallet;
    }

    return {
      ...wallet,
      miniAppPolicy: { default: override },
    };
  });
}

export type ActiveWalletSelection = {
  activeNamespace: ActiveWalletNamespace;
  activeEvmWallet?: ApiEmbeddedWallet;
  activeSolanaWallet?: ApiEmbeddedWallet;
  activeEvmAddress?: `0x${string}`;
  activeSolanaAddress?: string;
  wallets: ApiEmbeddedWallet[];
  primaryWallet?: ApiEmbeddedWallet;
  primaryEvmWallet?: ApiEmbeddedWallet;
  primarySolanaWallet?: ApiEmbeddedWallet;
  secondaryEvmWallet?: ApiEmbeddedWallet;
  secondarySolanaWallet?: ApiEmbeddedWallet;
  hasSecondaryEvm: boolean;
  hasSecondarySolana: boolean;
  selectActiveNamespace: (namespace: ActiveWalletNamespace) => void;
  selectPrimaryWallet: () => void;
  isLoadingActiveWallet: boolean;
  // Legacy fields — kept for backward compatibility with callers that still
  // key off a single active wallet record / walletId. Both point at the EVM
  // half of the active pair.
  activeWallet?: ApiEmbeddedWallet;
  activeWalletId?: string;
  activeWalletSelection: string;
  selectActiveWallet: (walletId: string) => void;
};

function isEvmAddress(address: string): address is `0x${string}` {
  return address.startsWith('0x');
}

function normalizeNamespace(
  value: string | undefined,
  wallets: ApiEmbeddedWallet[],
): ActiveWalletNamespace {
  if (!value || value === PRIMARY_NAMESPACE) {
    return PRIMARY_NAMESPACE;
  }
  if (value === SECONDARY_NAMESPACE) {
    return SECONDARY_NAMESPACE;
  }
  // Legacy MMKV value was a walletId — look up its namespace.
  const match = wallets.find((wallet) => wallet.id === value);
  if (match?.privyAppNamespace === SECONDARY_NAMESPACE) {
    return SECONDARY_NAMESPACE;
  }
  return PRIMARY_NAMESPACE;
}

export function useActiveWallet(): ActiveWalletSelection {
  const fid = useCurrentUserFid();
  const secondaryWalletsEnabled = useSecondaryWalletsEnabled();
  const [storedNamespace, setStoredNamespace] = useMMKVString(
    `wallet-active-wallet-${fid}`,
  );
  const [rawMiniAppPolicyOverrides] = useMMKVString(
    getLocalMiniAppPolicyOverridesKey(fid),
  );
  const { data, isPending } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: secondaryWalletsEnabled && !!fid,
  });

  const miniAppPolicyOverrides = React.useMemo(
    () => parseLocalMiniAppPolicyOverrides(rawMiniAppPolicyOverrides),
    [rawMiniAppPolicyOverrides],
  );
  const wallets = React.useMemo(
    () =>
      applyLocalMiniAppPolicyOverrides(
        data?.wallets ?? [],
        miniAppPolicyOverrides,
      ),
    [data?.wallets, miniAppPolicyOverrides],
  );

  const primaryEvmWallet = React.useMemo(
    () =>
      wallets.find(
        (wallet) => wallet.isPrimary && wallet.protocol === 'ethereum',
      ),
    [wallets],
  );
  const primarySolanaWallet = React.useMemo(
    () =>
      wallets.find(
        (wallet) => wallet.isPrimary && wallet.protocol === 'solana',
      ),
    [wallets],
  );
  const secondaryEvmWallet = React.useMemo(
    () =>
      wallets.find(
        (wallet) =>
          wallet.privyAppNamespace === SECONDARY_NAMESPACE &&
          wallet.protocol === 'ethereum',
      ),
    [wallets],
  );
  const secondarySolanaWallet = React.useMemo(
    () =>
      wallets.find(
        (wallet) =>
          wallet.privyAppNamespace === SECONDARY_NAMESPACE &&
          wallet.protocol === 'solana',
      ),
    [wallets],
  );

  const primaryWallet = primaryEvmWallet ?? primarySolanaWallet;

  const activeNamespace = React.useMemo<ActiveWalletNamespace>(
    () => normalizeNamespace(storedNamespace, wallets),
    [storedNamespace, wallets],
  );

  // Self-heal: if the stored namespace resolves to no live wallets at all,
  // fall back to primary and rewrite MMKV. Also migrate legacy walletId
  // values to their resolved namespace string.
  React.useEffect(() => {
    if (secondaryWalletsEnabled && isPending) {
      return;
    }
    if (!storedNamespace) {
      return;
    }
    if (
      storedNamespace !== PRIMARY_NAMESPACE &&
      storedNamespace !== SECONDARY_NAMESPACE
    ) {
      setStoredNamespace(activeNamespace);
      return;
    }
    if (
      activeNamespace === SECONDARY_NAMESPACE &&
      !secondaryEvmWallet &&
      !secondarySolanaWallet
    ) {
      setStoredNamespace(PRIMARY_NAMESPACE);
    }
  }, [
    activeNamespace,
    isPending,
    secondaryEvmWallet,
    secondarySolanaWallet,
    secondaryWalletsEnabled,
    setStoredNamespace,
    storedNamespace,
  ]);

  // Namespace-scoped: no cross-fallback to the primary sibling on secondary.
  const activeEvmWallet =
    activeNamespace === SECONDARY_NAMESPACE
      ? secondaryEvmWallet
      : primaryEvmWallet;
  const activeSolanaWallet =
    activeNamespace === SECONDARY_NAMESPACE
      ? secondarySolanaWallet
      : primarySolanaWallet;

  const activeEvmAddress =
    activeEvmWallet && isEvmAddress(activeEvmWallet.address)
      ? activeEvmWallet.address
      : undefined;
  const activeSolanaAddress = activeSolanaWallet?.address;

  const selectActiveNamespace = React.useCallback(
    (namespace: ActiveWalletNamespace) => {
      setStoredNamespace(namespace);
    },
    [setStoredNamespace],
  );

  const selectPrimaryWallet = React.useCallback(() => {
    setStoredNamespace(PRIMARY_NAMESPACE);
  }, [setStoredNamespace]);

  // Legacy callback: callers pass a walletId. Resolve to namespace.
  const selectActiveWallet = React.useCallback(
    (walletId: string) => {
      if (walletId === PRIMARY_NAMESPACE) {
        setStoredNamespace(PRIMARY_NAMESPACE);
        return;
      }
      if (walletId === SECONDARY_NAMESPACE) {
        setStoredNamespace(SECONDARY_NAMESPACE);
        return;
      }
      const wallet = wallets.find((candidate) => candidate.id === walletId);
      setStoredNamespace(
        wallet?.privyAppNamespace === SECONDARY_NAMESPACE
          ? SECONDARY_NAMESPACE
          : PRIMARY_NAMESPACE,
      );
    },
    [setStoredNamespace, wallets],
  );

  const legacyActiveWallet = activeEvmWallet ?? activeSolanaWallet;

  return {
    activeNamespace,
    activeEvmWallet,
    activeSolanaWallet,
    activeEvmAddress,
    activeSolanaAddress,
    wallets,
    primaryWallet,
    primaryEvmWallet,
    primarySolanaWallet,
    secondaryEvmWallet,
    secondarySolanaWallet,
    hasSecondaryEvm: !!secondaryEvmWallet,
    hasSecondarySolana: !!secondarySolanaWallet,
    selectActiveNamespace,
    selectPrimaryWallet,
    isLoadingActiveWallet: secondaryWalletsEnabled ? isPending : false,
    // Legacy fields:
    activeWallet: legacyActiveWallet,
    activeWalletId: legacyActiveWallet?.id,
    activeWalletSelection: activeNamespace,
    selectActiveWallet,
  };
}
