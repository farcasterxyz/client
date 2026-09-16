import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import {
  useAddTokenToWatchlist,
  useBlockToken,
  useGloballyCachedToken,
  useHideToken,
  useNonSuspenseUserByFid,
  useRemoveTokenFromWatchlist,
  useReportToken,
  useTokenReportsSummary,
  useTrackEvent,
  useUnhideToken,
  useUpdateUser,
} from 'farcaster-client-hooks';
import {
  Ban,
  Bell,
  Check,
  Copy,
  EyeIcon,
  EyeOffIcon,
  MoreHorizontal,
  SendHorizonal,
  Share,
  Star,
  TriangleAlert,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { AnimatedRef } from 'react-native-reanimated';
import { useToast } from 'react-native-toast-notifications';

import {
  AutoDisplayingBottomSheetModal,
  BottomSheetHeader,
  BottomSheetTextInput,
} from '../../../components/bottom-sheet';
import { WarningTriangleIcon } from '../../../components/icons';
import { hitSlopXs } from '../../../constants';
import {
  useEmbeddedWallet,
  useSharedNavigationContext,
} from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useCurrentUserFid,
  useHaptics,
  useIsAdmin,
  useWalletBalances,
} from '../../../hooks';
import { TokenBalance } from '../../../hooks/useTokenBalance';
import { isSameAsset, tokenPositionToMinimalToken } from '../../../utils';
import {
  AnimatedPressable,
  ButtonGroup,
  ButtonGroupOption,
  ButtonV2,
} from '../../design-system';
import { Text2 } from '../../design-system/Text';
import { TokenCircleIcon } from '../../icons/TokenCircleIcon';
import { TokenBadges } from './TokenBadges';
import { TokenIcon } from './TokenIcon';
import { TokenShareToDirectCastBottomSheet } from './TokenShareToDirectCast';

export function TokenHeader({
  token,
  balance,
  onImagePress,
  imageRef,
  imageStyle,
  hideAdminFeatures = false,
}: {
  token?: ApiTokenLink;
  balance?: TokenBalance;
  onImagePress?: (url: string) => void;
  imageRef?: AnimatedRef<View>;
  imageStyle?: StyleProp<ViewStyle>;
  hideAdminFeatures?: boolean;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const fid = useCurrentUserFid();
  const { data: userData } = useNonSuspenseUserByFid({
    fid: fid ?? 0,
    enabled: !!fid,
  });
  const currentUser = userData?.result?.user;
  const [tokenHidden, setTokenHidden] = useState(balance?.userHidden ?? false);

  const { push } = useSharedNavigationContext();
  const hideToken = useHideToken();
  const unhideToken = useUnhideToken();
  const updateUser = useUpdateUser();
  const reportToken = useReportToken();
  const blockToken = useBlockToken();
  const isAdmin = useIsAdmin();
  const toast = useToast();
  const [showShareBottomSheet, setShowShareBottomSheet] = useState(false);
  const [
    showTokenShareToDirectCastBottomSheet,
    setShowTokenShareToDirectCastBottomSheet,
  ] = useState(false);
  const [showReportTokenBottomSheet, setShowReportTokenBottomSheet] =
    useState(false);
  const [
    showReportTokenSuccessBottomSheet,
    setShowReportTokenSuccessBottomSheet,
  ] = useState(false);
  const [isReportingToken, setIsReportingToken] = useState(false);
  const [showBlockTokenBottomSheet, setShowBlockTokenBottomSheet] =
    useState(false);
  const [isBlockingToken, setIsBlockingToken] = useState(false);

  const handleImagePress = useCallback(() => {
    if (token?.imageUrl) {
      onImagePress?.(token.imageUrl);
    }
  }, [onImagePress, token?.imageUrl]);

  const [showTokenMoreActionsBottomSheet, setShowTokenMoreActionsBottomSheet] =
    React.useState(false);

  const dismissTokenMoreActionsBottomSheet = React.useCallback(() => {
    setShowTokenMoreActionsBottomSheet(false);
  }, []);

  const { evmAddress } = useEmbeddedWallet();

  const { balances } = useWalletBalances();

  const tokenBalance: ApiEthFungibleTokenPosition | undefined = useMemo(() => {
    if (!token) {
      return undefined;
    }

    const { chain, ca } = token;

    return balances.find((b) =>
      isSameAsset({
        chain,
        ca,
        asset: tokenPositionToMinimalToken(b),
      }),
    );
  }, [balances, token]);

  const sendIntent = useMemo(() => {
    if (!evmAddress || !token) {
      return undefined;
    }

    if (token.features?.canTrade === false) {
      return undefined;
    }

    if (!tokenBalance) {
      return undefined;
    }

    return {
      ca: token.ca,
      chain: token.chain,
    };
  }, [evmAddress, token, tokenBalance]);

  const options = React.useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    if (typeof fid === 'undefined') {
      return opts;
    }

    if (typeof token === 'undefined') {
      return opts;
    }

    if (typeof sendIntent !== 'undefined') {
      opts.push({
        label: 'Send token',
        onPress: () => {
          dismissTokenMoreActionsBottomSheet();
          triggerImpactAsync();
          push({
            path: 'WalletSend',
            params: {
              platformType: Platform.OS === 'web' ? 'web' : 'mobile',
              sendIntent,
            },
          });
        },
        icon: ({ size, color }) => <SendHorizonal size={size} color={color} />,
      });
    }

    const profileTokenUri = buildCaip19TokenUri(token.chain, token.ca);

    const isCurrentProfileToken =
      currentUser?.profile?.profileToken?.tokenUri === profileTokenUri;

    opts.push({
      label: isCurrentProfileToken
        ? 'Remove as my profile token'
        : 'Set as my profile token',
      onPress: async () => {
        dismissTokenMoreActionsBottomSheet();

        triggerImpactAsync();

        const toastId = `profile-token-${token.chain}-${token.ca}`;

        if (isCurrentProfileToken) {
          await updateUser({ profileToken: '' });
          toast.show(toastId, {
            type: 'profileToken',
            placement: 'top',
            data: { isRemoving: true },
          });
        } else {
          await updateUser({ profileToken: profileTokenUri });
          toast.show(toastId, {
            type: 'profileToken',
            placement: 'top',
            data: { isRemoving: false },
          });
        }
      },
      icon: ({ size, color }) => <TokenCircleIcon size={size} color={color} />,
    });

    opts.push({
      label: 'Notifications',
      onPress: () => {
        dismissTokenMoreActionsBottomSheet();
        triggerImpactAsync();

        push({
          path: 'WalletAlertsToken',
          params: { chain: token.chain, ca: token.ca },
        });
      },
      icon: ({ size, color }) => <Bell size={size} color={color} />,
    });

    opts.push({
      label: 'Share token',
      onPress: () => {
        dismissTokenMoreActionsBottomSheet();
        triggerImpactAsync();
        setShowShareBottomSheet(true);
      },
      icon: ({ size, color }) => <Share size={size} color={color} />,
    });

    // Only show hide/unhide options if user has a balance
    if (balance) {
      if (tokenHidden) {
        opts.push({
          label: 'Unhide token',
          onPress: () => {
            setTokenHidden(false);
            dismissTokenMoreActionsBottomSheet();

            triggerImpactAsync();

            unhideToken({ fid, ca: token.ca, chain: token.chain });
          },
          icon: ({ size, color }) => <EyeIcon size={size} color={color} />,
        });
      } else {
        opts.push({
          label: 'Hide token',
          onPress: () => {
            setTokenHidden(true);
            dismissTokenMoreActionsBottomSheet();

            triggerImpactAsync();

            hideToken({ fid, ca: token.ca, chain: token.chain });
          },
          icon: ({ size, color }) => <EyeOffIcon size={size} color={color} />,
        });
      }
    }

    // Report token option
    opts.push({
      label: 'Report token',
      onPress: () => {
        dismissTokenMoreActionsBottomSheet();
        triggerImpactAsync();
        setShowReportTokenBottomSheet(true);
      },
      icon: ({ size, color }) => <TriangleAlert size={size} color={color} />,
      destructive: true,
    });

    // Block token option (admin only, shown as last option)
    if (isAdmin) {
      opts.push({
        label: 'Admin Block token',
        onPress: () => {
          dismissTokenMoreActionsBottomSheet();
          triggerImpactAsync();
          setShowBlockTokenBottomSheet(true);
        },
        icon: ({ size, color }) => <Ban size={size} color={color} />,
        destructive: true,
      });
    }

    return opts;
  }, [
    balance,
    currentUser?.profile?.profileToken?.tokenUri,
    dismissTokenMoreActionsBottomSheet,
    fid,
    hideToken,
    isAdmin,
    push,
    sendIntent,
    toast,
    token,
    triggerImpactAsync,
    unhideToken,
    updateUser,
    tokenHidden,
  ]);

  const displayMoreActions = React.useMemo(() => {
    if (typeof token === 'undefined') {
      return false;
    }

    return options.length > 0;
  }, [options.length, token]);

  const handleMoreActionsPress = useCallback(() => {
    setShowTokenMoreActionsBottomSheet(true);
  }, []);

  const onTokenHeaderPress = useCallback(async () => {
    if (!token) {
      return;
    }
    triggerImpactAsync();
    await Clipboard.setStringAsync(token.ca);
    toast.show('Copied address', {
      id: token.ca,
      type: 'success',
    });
  }, [token, triggerImpactAsync, toast]);

  const tokenShareBottomSheet = useMemo(() => {
    if (!token) {
      return null;
    }
    if (showTokenShareToDirectCastBottomSheet) {
      return (
        <TokenShareToDirectCastBottomSheet
          token={token}
          onDismiss={() => setShowTokenShareToDirectCastBottomSheet(false)}
        />
      );
    }
    if (showShareBottomSheet) {
      return (
        <TokenShareBottomSheet
          token={token}
          onDismiss={() => setShowShareBottomSheet(false)}
          openSendDCBottomSheet={() =>
            setShowTokenShareToDirectCastBottomSheet(true)
          }
        />
      );
    }
    return null;
  }, [showShareBottomSheet, showTokenShareToDirectCastBottomSheet, token]);

  const reportTokenBottomSheets = useMemo(() => {
    if (!token || !fid) {
      return null;
    }

    if (showReportTokenSuccessBottomSheet) {
      return (
        <ReportTokenSuccessBottomSheet
          token={token}
          onDismiss={() => setShowReportTokenSuccessBottomSheet(false)}
          hideToken={hideToken}
          fid={fid}
        />
      );
    }

    if (showReportTokenBottomSheet) {
      return (
        <ReportTokenBottomSheet
          token={token}
          onDismiss={() => setShowReportTokenBottomSheet(false)}
          onReportSuccess={() => setShowReportTokenSuccessBottomSheet(true)}
          reportToken={reportToken}
          isReporting={isReportingToken}
          setIsReporting={setIsReportingToken}
        />
      );
    }

    return null;
  }, [
    token,
    fid,
    showReportTokenBottomSheet,
    showReportTokenSuccessBottomSheet,
    reportToken,
    isReportingToken,
    hideToken,
    setShowReportTokenBottomSheet,
    setShowReportTokenSuccessBottomSheet,
    setIsReportingToken,
  ]);

  const blockTokenBottomSheet = useMemo(() => {
    if (!token || !isAdmin) {
      return null;
    }

    if (showBlockTokenBottomSheet) {
      return (
        <BlockTokenBottomSheet
          token={token}
          onDismiss={() => setShowBlockTokenBottomSheet(false)}
          blockToken={blockToken}
          isBlocking={isBlockingToken}
          setIsBlocking={setIsBlockingToken}
        />
      );
    }

    return null;
  }, [
    token,
    isAdmin,
    showBlockTokenBottomSheet,
    blockToken,
    isBlockingToken,
    setShowBlockTokenBottomSheet,
    setIsBlockingToken,
  ]);

  if (!token) {
    return null;
  }

  return (
    <View style={[t.flex1, t.flexRow, t.justifyBetween, t.gap2, t.itemsCenter]}>
      <Animated.View style={[imageStyle]}>
        <TouchableOpacity
          hitSlop={hitSlopXs}
          onPress={handleImagePress}
          activeOpacity={0.75}
          ref={imageRef}
        >
          <TokenIcon
            iconUrl={token.imageUrl}
            chain={token.chain}
            diameter={40}
            chainImageSize={16}
            symbol={token.ticker ?? ''}
            features={token.features}
            badgeOffset={{ top: -2, right: -2 }}
            imageBordered
          />
        </TouchableOpacity>
      </Animated.View>
      <AnimatedPressable
        onPress={onTokenHeaderPress}
        hitSlop={hitSlopXs}
        style={[t.flex1, t.mR6]}
      >
        <View style={[t.flexRow, t.itemsCenter, t.flex1, t.gap1]}>
          <Text2 weight="semibold" size="lg" numberOfLines={1}>
            {token.name ?? token.ticker}
          </Text2>
          <TokenBadges token={token} sheetEnabled />
          {balance?.userHidden && (
            <EyeOffIcon size={16} color={t.colors.text.secondary} />
          )}
        </View>
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            {token.ticker ?? ''}
          </Text2>
          <Copy size={12} color={t.colors.text.secondary} />
        </View>
      </AnimatedPressable>
      <View>
        <View
          style={[
            t.flexRow,
            t.backgrounds.secondary,
            t.roundedFull,
            t.border,
            t.borders.secondary,
            t.pX3,
            t.pY2,
            t.gap2,
          ]}
        >
          <React.Suspense>
            <TokenHeaderReportsWarning
              token={token}
              hideAdminFeatures={hideAdminFeatures}
            />
          </React.Suspense>
          <TokenHeaderWatchlistStar token={token} />
          {displayMoreActions && (
            <AnimatedPressable
              onPress={handleMoreActionsPress}
              hitSlop={{
                left: 4,
                top: 12,
                right: 12,
                bottom: 12,
              }}
            >
              <MoreHorizontal size={22} style={t.texts.primary} />
              {showTokenMoreActionsBottomSheet && (
                <AutoDisplayingBottomSheetModal
                  name="token-more-actions"
                  onDismiss={dismissTokenMoreActionsBottomSheet}
                >
                  <ButtonGroup options={options} />
                </AutoDisplayingBottomSheetModal>
              )}
            </AnimatedPressable>
          )}
        </View>
      </View>
      {tokenShareBottomSheet}
      {reportTokenBottomSheets}
      {blockTokenBottomSheet}
    </View>
  );
}

function TokenHeaderWatchlistStar({
  token: fallback,
}: {
  token: ApiTokenLink;
}) {
  const token = useGloballyCachedToken({ fallback });

  const t = useTheme();

  const { trackEvent } = useTrackEvent();

  const addTokenToWatchlist = useAddTokenToWatchlist();

  const removeTokenFromWatchlist = useRemoveTokenFromWatchlist();

  const favorited =
    typeof token.walletContext !== 'undefined' &&
    typeof token.walletContext.favorited !== 'undefined' &&
    token.walletContext.favorited;

  const { triggerImpactAsync } = useHaptics();

  const handlePress = useCallback(() => {
    triggerImpactAsync();

    if (favorited) {
      trackEvent(AnalyticsEvent.RemoveTokenWatchlist, {
        tokenCa: token.ca,
        tokenChain: token.chain,
      });

      removeTokenFromWatchlist({ tokenCa: token.ca, tokenChain: token.chain });
    } else {
      trackEvent(AnalyticsEvent.AddTokenWatchlist, {
        tokenCa: token.ca,
        tokenChain: token.chain,
      });

      addTokenToWatchlist({
        tokenCa: token.ca,
        tokenChain: token.chain,
        optimisticTokenToInsert: token,
      });
    }
  }, [
    addTokenToWatchlist,
    favorited,
    removeTokenFromWatchlist,
    token,
    trackEvent,
    triggerImpactAsync,
  ]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      hitSlop={{
        left: 8,
        top: 12,
        right: 4,
        bottom: 12,
      }}
    >
      <Star
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        size={22}
        style={t.texts.primary}
        fill={favorited ? t.colors.text.primary : t.colors.background.secondary}
      />
    </AnimatedPressable>
  );
}

function TokenHeaderReportsWarning({
  token,
  hideAdminFeatures,
}: {
  token: ApiTokenLink;
  hideAdminFeatures: boolean;
}) {
  const t = useTheme();
  const { push } = useSharedNavigationContext();
  const isAdmin = useIsAdmin();
  const { triggerImpactAsync } = useHaptics();

  const { data: reportsSummary } = useTokenReportsSummary({
    chain: token.chain,
    ca: token.ca,
    enabled: isAdmin && !hideAdminFeatures,
  });

  const totalReports = reportsSummary?.result?.totalReports ?? 0;

  const handleWarningPress = useCallback(() => {
    triggerImpactAsync();
    if (Platform.OS === 'web') {
      return; // No action on web
    }
    push({
      path: 'TokenReportsSummary',
      params: { chain: token.chain, ca: token.ca },
    });
  }, [push, token, triggerImpactAsync]);

  // Only show for admins with at least 1 report and when admin tools are not hidden
  if (!isAdmin || hideAdminFeatures || totalReports === 0) {
    return null;
  }

  return (
    <AnimatedPressable
      onPress={handleWarningPress}
      hitSlop={{ left: 12, right: 0, top: 12, bottom: 12 }}
    >
      <View style={{ position: 'relative' }}>
        <TriangleAlert size={22} color={t.colors.yellow500} />
      </View>
    </AnimatedPressable>
  );
}

function TokenShareBottomSheet({
  onDismiss,
  openSendDCBottomSheet,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
  openSendDCBottomSheet: () => void;
}) {
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const { triggerImpactAsync } = useHaptics();

  const onSendDCPress = useCallback(() => {
    triggerImpactAsync();
    openSendDCBottomSheet();
    bottomSheetRef.current?.dismiss();
    onDismiss();
  }, [openSendDCBottomSheet, onDismiss, triggerImpactAsync]);

  const options: ButtonGroupOption[] = useMemo(
    () => [
      {
        label: 'Send in a DC',
        onPress: onSendDCPress,
        icon: ({ size, color }) => <SendHorizonal size={size} color={color} />,
      },
    ],
    [onSendDCPress],
  );

  // Task: convert this to ButtonGroup
  return (
    <AutoDisplayingBottomSheetModal
      name="token-share"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <ButtonGroup options={options} />
    </AutoDisplayingBottomSheetModal>
  );
}

function ReportTokenBottomSheet({
  token,
  onDismiss,
  onReportSuccess,
  reportToken,
  isReporting,
  setIsReporting,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
  onReportSuccess: () => void;
  reportToken: ReturnType<typeof useReportToken>;
  isReporting: boolean;
  setIsReporting: (value: boolean) => void;
}) {
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const { triggerImpactAsync } = useHaptics();
  const toast = useToast();
  const t = useTheme();

  const handleReport = useCallback(
    async (reason: 'fraudulent' | 'offensive') => {
      setIsReporting(true);
      try {
        await reportToken({ chain: token.chain, ca: token.ca, reason });
        bottomSheetRef.current?.dismiss();
        onDismiss();
        onReportSuccess();
      } catch (error) {
        toast.show('report-token-error', {
          type: 'danger',
          placement: 'top',
          data: {
            title: 'Failed to report token',
          },
        });
      } finally {
        setIsReporting(false);
      }
    },
    [
      reportToken,
      token.chain,
      token.ca,
      setIsReporting,
      onDismiss,
      onReportSuccess,
      toast,
    ],
  );

  const options: ButtonGroupOption[] = useMemo(
    () => [
      {
        label: 'Fraudulent',
        subLabel:
          'This token is impersonating someone or tricking people in some way.',
        onPress: () => {
          triggerImpactAsync();
          handleReport('fraudulent');
        },
        disabled: isReporting,
      },
      {
        label: 'Offensive',
        subLabel:
          'This token has language or iconography that many users would find unpleasant.',
        onPress: () => {
          triggerImpactAsync();
          handleReport('offensive');
        },
        disabled: isReporting,
      },
    ],
    [handleReport, triggerImpactAsync, isReporting],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="report-token"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <View>
        <BottomSheetHeader
          Icon={
            <WarningTriangleIcon
              size={24}
              fillColor={t.colors.yellow500}
              strokeColor={t.colors.black}
            />
          }
          title="Reporting a token"
        />
        <Text2 color="secondary" size="sm" style={[t.mB4]}>
          Tell us why you're reporting this token
        </Text2>
        <ButtonGroup options={options} />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function ReportTokenSuccessBottomSheet({
  token,
  onDismiss,
  hideToken,
  fid,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
  hideToken: ReturnType<typeof useHideToken>;
  fid: number;
}) {
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const { triggerImpactAsync } = useHaptics();
  const t = useTheme();

  const handleHideToken = useCallback(() => {
    triggerImpactAsync();
    hideToken({ fid, ca: token.ca, chain: token.chain });
    bottomSheetRef.current?.dismiss();
    onDismiss();
  }, [hideToken, fid, token.ca, token.chain, triggerImpactAsync, onDismiss]);

  const options: ButtonGroupOption[] = useMemo(
    () => [
      {
        label: 'Hide token',
        onPress: handleHideToken,
        icon: ({ size, color }) => <EyeOffIcon size={size} color={color} />,
      },
    ],
    [handleHideToken],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="report-token-success"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <View>
        <BottomSheetHeader
          Icon={
            <View
              style={[
                t.roundedFull,
                t.itemsCenter,
                t.justifyCenter,
                {
                  width: 24,
                  height: 24,
                  backgroundColor: t.colors.green500,
                },
              ]}
            >
              <Check size={10} color={t.colors.white} strokeWidth={6} />
            </View>
          }
          title="Thanks for reporting"
        />
        <Text2 color="secondary" size="sm" style={[t.mB4]}>
          Would you like to remove this token from your list?
        </Text2>
        <ButtonGroup options={options} />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function BlockTokenBottomSheet({
  token,
  onDismiss,
  blockToken,
  isBlocking,
  setIsBlocking,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
  blockToken: ReturnType<typeof useBlockToken>;
  isBlocking: boolean;
  setIsBlocking: (value: boolean) => void;
}) {
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const { triggerImpactAsync } = useHaptics();
  const toast = useToast();
  const t = useTheme();
  const [reason, setReason] = React.useState('');

  const handleConfirm = React.useCallback(async () => {
    if (!reason.trim()) {
      return;
    }

    setIsBlocking(true);
    try {
      await blockToken({
        chain: token.chain,
        ca: token.ca,
        reason: reason.trim(),
      });
      bottomSheetRef.current?.dismiss();
      onDismiss();
      toast.show('Token blocked');
    } catch (error) {
      toast.show('Failed to block token', {
        type: 'danger',
      });
    } finally {
      setIsBlocking(false);
    }
  }, [
    blockToken,
    token.chain,
    token.ca,
    reason,
    setIsBlocking,
    onDismiss,
    toast,
  ]);

  const handleCancel = React.useCallback(() => {
    triggerImpactAsync();
    bottomSheetRef.current?.dismiss();
    onDismiss();
  }, [triggerImpactAsync, onDismiss]);

  // Reset reason when dismissed
  React.useEffect(() => {
    return () => {
      setReason('');
    };
  }, []);

  return (
    <AutoDisplayingBottomSheetModal
      name="block-token"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <View>
        <BottomSheetHeader
          Icon={<Ban size={24} color={t.colors.red500} />}
          title="Block token"
        />
        <Text2 color="secondary" size="sm" style={[t.mB3]}>
          Enter a reason for blocking this token
        </Text2>
        <BottomSheetTextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Reason"
          style={[t.p3, t.bgLightGray, { borderRadius: 12, marginBottom: 16 }]}
          autoFocus
          editable={!isBlocking}
        />
        <View style={[t.flexRow, t.justifyBetween, { gap: 16 }]}>
          <View style={[t.flex1, { borderRadius: 14 }]}>
            <ButtonV2
              textSize="lg"
              variant="secondary"
              title="Cancel"
              onPress={handleCancel}
              width="flex1"
              disabled={isBlocking}
            />
          </View>
          <View style={[t.flex1, { borderRadius: 14 }]}>
            <ButtonV2
              textSize="lg"
              title={isBlocking ? 'Blocking...' : 'Confirm'}
              onPress={handleConfirm}
              width="flex1"
              disabled={isBlocking || !reason.trim()}
              loading={isBlocking}
            />
          </View>
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
