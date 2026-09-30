import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiEmbeddedWallet,
  ApiEmbeddedWalletMiniAppPolicy,
  ApiEmbeddedWalletProtocol,
  ApiEmbeddedWalletRegistrationSource,
} from 'farcaster-client-data';
import {
  useEmbeddedWalletsQuery,
  useRegisterEmbeddedWallet,
  useUpdateEmbeddedWallet,
} from 'farcaster-client-hooks';
import { ChevronDown, Info, Wallet } from 'lucide-react-native';
import React from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { withRetry } from 'viem';

import {
  useEmbeddedWallet,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import {
  getLocalMiniAppPolicyOverridesKey,
  parseLocalMiniAppPolicyOverrides,
  useActiveWallet,
  useCurrentUserFid,
  useSecondaryWalletsAvailable,
  useSecondaryWalletsEnabled,
  useSecondaryWalletsVisible,
} from '../../../hooks';
import {
  AutoDisplayingBottomSheetModal,
  BottomSheetTextInput,
} from '../../bottom-sheet';
import {
  AnimatedPressable,
  AtomsButton,
  SwitchV2,
  Text2,
} from '../../design-system';

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getEmbeddedWalletDisplayPolicy(wallet: ApiEmbeddedWallet) {
  if (wallet.displayPolicy) {
    return wallet.displayPolicy;
  }

  const legacyVisibility = (wallet as { visibility?: 'default' | 'private' })
    .visibility;
  const visibleByDefault = wallet.isPrimary || legacyVisibility === 'default';
  return {
    showInTokenList: visibleByDefault,
    showInActivity: visibleByDefault,
  };
}

export function getEmbeddedWalletMiniAppPermission(wallet: ApiEmbeddedWallet) {
  const miniAppPolicy = wallet.miniAppPolicy as
    | ApiEmbeddedWallet['miniAppPolicy']
    | 'allowed'
    | 'blocked';
  return typeof miniAppPolicy === 'string'
    ? miniAppPolicy
    : miniAppPolicy.default;
}

function miniAppPermissionSummary(permission: 'allowed' | 'blocked') {
  return permission === 'allowed' ? 'Mini-apps allowed' : 'Mini-apps blocked';
}

async function invalidateEmbeddedWalletQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === 'embeddedWallets',
  });
}

function responseMiniAppPermission(
  response: Awaited<ReturnType<ReturnType<typeof useUpdateEmbeddedWallet>>>,
) {
  return getEmbeddedWalletMiniAppPermission(response.data.result.wallet);
}

function applyLocalMiniAppPolicyOverride(
  wallet: ApiEmbeddedWallet,
  permission: 'allowed' | 'blocked' | undefined,
) {
  if (!permission) {
    return wallet;
  }

  return {
    ...wallet,
    miniAppPolicy: { default: permission },
  };
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_PATH_LENGTH = 23;

function NamespaceRow({
  title,
  evmAddress,
  solanaAddress,
  isActive = false,
  onPress,
}: {
  title: string;
  evmAddress?: string;
  solanaAddress?: string;
  isActive?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  React.useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, { duration: 260 });
  }, [activeProgress, isActive]);
  const checkContainerStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));
  const checkPathProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - activeProgress.value),
  }));

  const subtitle = [
    evmAddress ? `ETH ${shortAddress(evmAddress)}` : undefined,
    solanaAddress ? `SOL ${shortAddress(solanaAddress)}` : undefined,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        { gap: 12, minHeight: 58, paddingVertical: 8 },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text2 weight="semibold">{title}</Text2>
        {!!subtitle && (
          <Text2 color="tertiary" size="sm" numberOfLines={1}>
            {subtitle}
          </Text2>
        )}
      </View>
      <Animated.View style={[t.flexNone, checkContainerStyle]}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <AnimatedPath
            d="M20 6 L9 17 L4 12"
            stroke={t.colors.text.brand}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${CHECK_PATH_LENGTH} ${CHECK_PATH_LENGTH}`}
            animatedProps={checkPathProps}
          />
        </Svg>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Bounded exponential backoff for the registerEmbeddedWallet POST. Three
// attempts at delays 1s / 3s / 6s — cumulative wait stays ≤ ~10s before the
// user has to tap the button again to retry. Mirrors the user's directive:
// "try 3 times with exponential backoff with max 10 sec for all attempts,
// then user can retry with the button click again".
const REGISTER_RETRY_DELAYS_MS = [1000, 3000, 6000];

async function registerWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    retryCount: REGISTER_RETRY_DELAYS_MS.length,
    delay: ({ count }) =>
      REGISTER_RETRY_DELAYS_MS[
        Math.min(count - 1, REGISTER_RETRY_DELAYS_MS.length - 1)
      ] ?? 0,
  });
}

function AddPrivateWalletSheet({
  onDismiss,
  source,
  missingProtocols,
}: {
  onDismiss: () => void;
  source: ApiEmbeddedWalletRegistrationSource;
  missingProtocols: ApiEmbeddedWalletProtocol[];
}) {
  const t = useTheme();
  const fid = useCurrentUserFid();
  const { createPrivateWallet } = useEmbeddedWallet();
  const registerEmbeddedWallet = useRegisterEmbeddedWallet();
  const { refetch } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: !!fid,
  });
  const [displayName, setDisplayName] = React.useState('Secondary wallet');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const { trackEvent } = useSharedTelemetry();

  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleBackdropPress = React.useCallback(() => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    } else {
      onDismiss();
    }
  }, [isKeyboardVisible, onDismiss]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="none"
        appearsOnIndex={1}
        disappearsOnIndex={-1}
        opacity={0.3}
        onPress={handleBackdropPress}
      />
    ),
    [handleBackdropPress],
  );

  const handleCreatePrivateWallet = React.useCallback(async () => {
    setIsSubmitting(true);
    setError(undefined);

    trackEvent(AnalyticsEvent.CreatePrivateWalletAttempt, { source });

    let stage: 'create' | 'register' = 'create';
    try {
      const created = await createPrivateWallet({
        protocols: missingProtocols,
      });
      stage = 'register';
      const toRegister: {
        protocol: ApiEmbeddedWalletProtocol;
        address: string;
      }[] = [];
      if (created.ethereum && missingProtocols.includes('ethereum')) {
        toRegister.push({
          protocol: 'ethereum',
          address: created.ethereum.address,
        });
      }
      if (created.solana && missingProtocols.includes('solana')) {
        toRegister.push({
          protocol: 'solana',
          address: created.solana.address,
        });
      }
      // Register each protocol's account with backend. Each call is retried
      // independently; if one protocol's registration fails after all
      // retries, the other protocol's row may still have been registered.
      // The button label will reflect what's still missing on the next open.
      const errors: Error[] = [];
      for (const entry of toRegister) {
        try {
          await registerWithRetry(() =>
            registerEmbeddedWallet({
              protocol: entry.protocol,
              address: entry.address,
              source: 'privy',
              privyAppNamespace: 'secondary',
              displayName,
            }),
          );
          trackEvent(AnalyticsEvent.CreatePrivateWalletSuccess, {
            source,
            protocol: entry.protocol,
          });
        } catch (e) {
          errors.push(e as Error);
          trackEvent(AnalyticsEvent.CreatePrivateWalletError, {
            source,
            stage: 'register',
            protocol: entry.protocol,
            error_name: (e as Error)?.name,
            error_message: (e as Error)?.message,
          });
        }
      }
      await refetch();
      if (errors.length > 0) {
        setError(
          errors.length === toRegister.length
            ? 'Could not save wallet. Please try again.'
            : 'Some wallets could not be saved. Tap the button to retry the missing one.',
        );
        return;
      }
      onDismiss();
    } catch (e) {
      const err = e as Error | undefined;
      // eslint-disable-next-line no-console
      console.log('[secondary-wallet] PrivateWalletsPanel.create FAILED', {
        stage,
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5).join(' | '),
      });
      trackEvent(AnalyticsEvent.CreatePrivateWalletError, {
        source,
        stage,
        error_name: err?.name,
        error_message: err?.message,
      });
      setError('Could not create wallet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    createPrivateWallet,
    displayName,
    missingProtocols,
    onDismiss,
    refetch,
    registerEmbeddedWallet,
    source,
    trackEvent,
  ]);

  const isImport = source === 'imported';
  const buttonLabel = (() => {
    if (isImport) return 'Secure import coming soon';
    if (missingProtocols.length === 2) return 'Create secondary wallet';
    if (missingProtocols[0] === 'solana')
      return 'Create Solana secondary wallet';
    return 'Create Ethereum secondary wallet';
  })();

  return (
    <AutoDisplayingBottomSheetModal
      name={`add-private-wallet-${source}`}
      onDismiss={onDismiss}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
    >
      <View style={[t.p4, { gap: 12 }]}>
        <View style={{ gap: 4 }}>
          <Text2 weight="semibold" size="lg">
            {isImport ? 'Import wallet' : buttonLabel}
          </Text2>
          <Text2 color="secondary" size="sm">
            {isImport
              ? 'Secure import is not available yet.'
              : 'Blocked from mini-apps by default.'}
          </Text2>
        </View>

        {!isImport && (
          <View
            style={[
              t.roundedLg,
              t.p3,
              {
                gap: 6,
                backgroundColor: t.colors.bgNewLightGray,
                borderWidth: 1,
                borderColor: t.colors.border || '#E2E8F0',
              },
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
              <Info size={14} color={t.colors.text.warning} />
              <Text2
                weight="semibold"
                size="sm"
                style={{ color: t.colors.text.warning }}
              >
                Onchain Privacy Warning
              </Text2>
            </View>
            <Text2 color="secondary" size="xs" style={{ lineHeight: 16 }}>
              Secondary wallets are not explicitly linked to your Farcaster ID
              on the protocol. However, onchain activities (like funding gas or
              transferring assets from your primary wallet) can still make it
              easy for others to de-anonymize you.
            </Text2>
          </View>
        )}

        {!isImport && (
          <View style={[t.roundedLg, t.p3, { gap: 6, borderWidth: 1 }]}>
            <Text2 color="tertiary" size="sm">
              Name
            </Text2>
            {/* Uncontrolled (`defaultValue`) on purpose: a controlled
                `value` round-trip on Android races the IME and reorders
                characters when the cursor sits mid-string (typing `sec`
                produces `ces`). State is still tracked via `onChangeText`. */}
            <BottomSheetTextInput
              defaultValue={displayName}
              onChangeText={setDisplayName}
              placeholder="Secondary wallet"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoFocus
              style={[{ color: t.colors.text.primary, paddingVertical: 4 }]}
            />
          </View>
        )}

        <Text2 color="tertiary" size="sm">
          You can change mini-app access later.
        </Text2>

        {error && (
          <Text2 color="danger" size="sm">
            {error}
          </Text2>
        )}

        {isImport ? (
          <AtomsButton hierarchy="secondary" disabled>
            Secure import coming soon
          </AtomsButton>
        ) : (
          <AtomsButton
            hierarchy="primary"
            loading={isSubmitting}
            disabled={!displayName || missingProtocols.length === 0}
            onPress={handleCreatePrivateWallet}
          >
            {buttonLabel}
          </AtomsButton>
        )}
        {isKeyboardVisible && <View style={{ height: keyboardHeight }} />}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function WalletSettingToggle({
  title,
  value,
  onValueChange,
  caption,
}: {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  caption?: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, gap: 1 }}>
        <Text2 weight="semibold">{title}</Text2>
        {caption && (
          <Text2 color="tertiary" size="sm">
            {caption}
          </Text2>
        )}
      </View>
      <View style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}>
        <SwitchV2 value={value} onValueChange={onValueChange} />
      </View>
    </View>
  );
}

function PrivateWalletPermissionsSheet({
  wallet,
  onDismiss,
}: {
  wallet: ApiEmbeddedWallet;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const fid = useCurrentUserFid();
  const updateEmbeddedWallet = useUpdateEmbeddedWallet();
  const queryClient = useQueryClient();
  const [rawMiniAppPolicyOverrides, setRawMiniAppPolicyOverrides] =
    useMMKVString(getLocalMiniAppPolicyOverridesKey(fid));
  const { data, refetch } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: !!fid,
  });
  const currentWalletFromApi =
    data?.wallets.find((candidate) => candidate.id === wallet.id) ?? wallet;
  const miniAppPolicyOverrides = React.useMemo(
    () => parseLocalMiniAppPolicyOverrides(rawMiniAppPolicyOverrides),
    [rawMiniAppPolicyOverrides],
  );
  const currentWallet = React.useMemo(
    () =>
      applyLocalMiniAppPolicyOverride(
        currentWalletFromApi,
        miniAppPolicyOverrides[currentWalletFromApi.id],
      ),
    [currentWalletFromApi, miniAppPolicyOverrides],
  );
  const currentMiniAppPermission =
    getEmbeddedWalletMiniAppPermission(currentWallet);

  const handleSetMiniAppPolicy = React.useCallback(
    async (miniAppPolicy: ApiEmbeddedWalletMiniAppPolicy) => {
      const permission = miniAppPolicy.default;
      const response = await updateEmbeddedWallet({
        walletId: currentWallet.id,
        miniAppPolicy,
      });
      if (responseMiniAppPermission(response) !== permission) {
        throw new Error('Unexpected mini-app policy response');
      }
      setRawMiniAppPolicyOverrides(
        JSON.stringify({
          ...parseLocalMiniAppPolicyOverrides(rawMiniAppPolicyOverrides),
          [currentWallet.id]: permission,
        }),
      );
      await invalidateEmbeddedWalletQueries(queryClient);
      await refetch();
    },
    [
      currentWallet.id,
      queryClient,
      rawMiniAppPolicyOverrides,
      refetch,
      setRawMiniAppPolicyOverrides,
      updateEmbeddedWallet,
    ],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="private-wallet-permissions"
      onDismiss={onDismiss}
    >
      <View style={[t.p4, { gap: 12 }]}>
        <View style={{ gap: 4 }}>
          <Text2 weight="semibold" size="lg">
            {currentWallet.displayName}
            {currentWallet.protocol === 'solana' ? ' · SOL' : ' · ETH'}
          </Text2>
          <Text2 color="secondary" size="sm">
            {miniAppPermissionSummary(currentMiniAppPermission)}
          </Text2>
          <Text2 color="tertiary" size="sm">
            {shortAddress(currentWallet.address)}
          </Text2>
        </View>

        <View style={{ gap: 12 }}>
          <WalletSettingToggle
            title="Mini-app transactions"
            caption="Allow this wallet in mini-apps"
            value={currentMiniAppPermission === 'allowed'}
            onValueChange={(value) =>
              void handleSetMiniAppPolicy({
                default: value ? 'allowed' : 'blocked',
              })
            }
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

export function PrivateWalletsPanel() {
  const t = useTheme();
  const secondaryWalletsAvailable = useSecondaryWalletsAvailable();
  const secondaryWalletsEnabled = useSecondaryWalletsEnabled();
  const secondaryWalletsVisible = useSecondaryWalletsVisible();
  const fid = useCurrentUserFid();
  const { evmAddress, solanaAddress } = useEmbeddedWallet();
  const {
    activeNamespace,
    primaryEvmWallet,
    primarySolanaWallet,
    secondaryEvmWallet,
    secondarySolanaWallet,
    hasSecondaryEvm,
    hasSecondarySolana,
    selectActiveNamespace,
  } = useActiveWallet();
  const { isPending, refetch } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: secondaryWalletsEnabled && !!fid,
  });
  const [isManageOpen, setIsManageOpen] = React.useState(false);
  const chevronRotation = useSharedValue(0);
  React.useEffect(() => {
    chevronRotation.value = withTiming(isManageOpen ? 1 : 0, { duration: 200 });
  }, [chevronRotation, isManageOpen]);
  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 180}deg` }],
  }));
  const [addSource, setAddSource] =
    React.useState<ApiEmbeddedWalletRegistrationSource | null>(null);
  const [permissionsWallet, setPermissionsWallet] =
    React.useState<ApiEmbeddedWallet>();

  const missingProtocols = React.useMemo<ApiEmbeddedWalletProtocol[]>(() => {
    const missing: ApiEmbeddedWalletProtocol[] = [];
    if (!hasSecondaryEvm) missing.push('ethereum');
    if (!hasSecondarySolana) missing.push('solana');
    return missing;
  }, [hasSecondaryEvm, hasSecondarySolana]);

  const canCreatePrivateWallet =
    secondaryWalletsAvailable && missingProtocols.length > 0;

  const pillLabel =
    activeNamespace === 'secondary' ? 'Secondary wallet' : 'Primary wallet';

  const closeTimeoutRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const handleSelectNamespace = React.useCallback(
    (ns: 'primary' | 'secondary') => {
      if (activeNamespace === ns) {
        setIsManageOpen(false);
        return;
      }
      selectActiveNamespace(ns);
      closeTimeoutRef.current = setTimeout(() => {
        setIsManageOpen(false);
      }, 450);
    },
    [activeNamespace, selectActiveNamespace],
  );

  React.useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (isManageOpen) {
      void refetch();
    }
  }, [isManageOpen, refetch]);

  if (!secondaryWalletsVisible) {
    return null;
  }

  const buttonLabel = (() => {
    if (missingProtocols.length === 2) return 'Create secondary wallet';
    if (missingProtocols[0] === 'solana')
      return 'Create Solana secondary wallet';
    return 'Create Ethereum secondary wallet';
  })();

  return (
    <>
      <AnimatedPressable
        onPress={() => setIsManageOpen(true)}
        style={[
          t.roundedFull,
          t.pX2,
          t.flexRow,
          t.itemsCenter,
          {
            backgroundColor: t.colors.bgNewLightGray,
            gap: 6,
            height: 32,
            maxWidth: 240,
            minWidth: 150,
            opacity: isPending ? 0.6 : 1,
          },
        ]}
      >
        <Wallet size={14} color={t.colors.text.primary} />
        <View style={{ flex: 1 }}>
          <Text2 weight="semibold" size="sm" numberOfLines={1}>
            {pillLabel}
          </Text2>
        </View>
        <Animated.View style={chevronAnimatedStyle}>
          <ChevronDown size={14} color={t.colors.text.tertiary} />
        </Animated.View>
      </AnimatedPressable>

      {isManageOpen && (
        <AutoDisplayingBottomSheetModal
          name="manage-private-wallets"
          onDismiss={() => setIsManageOpen(false)}
        >
          <View style={[t.p4, { gap: 12 }]}>
            <Text2 weight="semibold" size="lg">
              Manage wallets
            </Text2>

            <View style={{ gap: 4 }}>
              <Text2 color="tertiary" size="sm">
                Primary
              </Text2>
              {primaryEvmWallet || primarySolanaWallet ? (
                <NamespaceRow
                  title="Primary wallet"
                  evmAddress={primaryEvmWallet?.address ?? evmAddress}
                  solanaAddress={primarySolanaWallet?.address ?? solanaAddress}
                  isActive={activeNamespace === 'primary'}
                  onPress={() => handleSelectNamespace('primary')}
                />
              ) : (
                <View style={{ gap: 2, paddingVertical: 8 }}>
                  <Text2 weight="semibold">Primary wallet</Text2>
                  <Text2 color="tertiary" size="sm" numberOfLines={1}>
                    {evmAddress ?? solanaAddress ?? 'Connecting...'}
                  </Text2>
                </View>
              )}
            </View>

            <View style={{ gap: 4 }}>
              <Text2 color="tertiary" size="sm">
                Secondary
              </Text2>
              {secondaryEvmWallet || secondarySolanaWallet ? (
                <NamespaceRow
                  title="Secondary wallet"
                  evmAddress={secondaryEvmWallet?.address}
                  solanaAddress={secondarySolanaWallet?.address}
                  isActive={activeNamespace === 'secondary'}
                  onPress={() => handleSelectNamespace('secondary')}
                />
              ) : (
                <Text2 color="tertiary" size="sm">
                  No secondary wallets yet.
                </Text2>
              )}
            </View>

            <View style={{ gap: 8 }}>
              {canCreatePrivateWallet && (
                <AtomsButton
                  hierarchy="primary"
                  onPress={() => setAddSource('privy')}
                >
                  {buttonLabel}
                </AtomsButton>
              )}
              {/* Import wallet hidden for now; functionality retained
                  so we can re-enable once the imported-wallet UX ships.
              <AtomsButton
                hierarchy="secondary"
                onPress={() => setAddSource('imported')}
              >
                Import wallet
              </AtomsButton>
              */}
              {activeNamespace === 'secondary' && secondaryEvmWallet && (
                <AtomsButton
                  hierarchy="secondary"
                  onPress={() => {
                    setPermissionsWallet(secondaryEvmWallet);
                    setIsManageOpen(false);
                  }}
                >
                  ETH wallet permissions
                </AtomsButton>
              )}
              {/* SOL wallet permissions hidden for now; functionality retained
                  so we can re-enable once UX is finalized.
              {activeNamespace === 'secondary' && secondarySolanaWallet && (
                <AtomsButton
                  hierarchy="secondary"
                  onPress={() => {
                    setPermissionsWallet(secondarySolanaWallet);
                    setIsManageOpen(false);
                  }}
                >
                  SOL wallet permissions
                </AtomsButton>
              )}
              */}
            </View>
          </View>
        </AutoDisplayingBottomSheetModal>
      )}

      {addSource && (
        <AddPrivateWalletSheet
          source={addSource}
          missingProtocols={
            addSource === 'privy' ? missingProtocols : ['ethereum', 'solana']
          }
          onDismiss={() => setAddSource(null)}
        />
      )}

      {permissionsWallet && (
        <PrivateWalletPermissionsSheet
          wallet={permissionsWallet}
          onDismiss={() => setPermissionsWallet(undefined)}
        />
      )}
    </>
  );
}
