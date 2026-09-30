import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainDisplayName,
  ApiTokenLink,
  ApiTokenSourcePlatform,
  ApiTokenUrls,
} from 'farcaster-client-data';
import {
  formatShorthandNumber,
  formatTimeAgoLong,
  formatTokenStat,
  useGloballyCachedToken,
} from 'farcaster-client-hooks';
import { Check, Copy, Globe } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useRootToast, useSharedTelemetry } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import { useHaptics, useUserLevel } from '../../../hooks';
import { formatAddress } from '../../../utils';
import { Avatar } from '../../Avatar';
import { useCopyText } from '../../CopyIconButton';
import { AnimatedPressable } from '../../design-system/AnimatedPressable';
import { Table, TableRow } from '../../design-system/Table';
import { Text2 } from '../../design-system/Text';
import { FarcasterProBadge } from '../../farcasterPro';
import { TokenPlatformIcon } from './TokenPlatformIcon';

const Farcaster = require('../../../assets/platforms/farcaster.webp');

const PLATFORM_NAMES: Record<ApiTokenSourcePlatform, string> = {
  zora: 'Zora',
  clanker: 'Clanker',
  pumpfun: 'PumpFun',
  bonk: 'Bonk',
  heaven: 'Heaven',
  paragraph: 'Paragraph',
  'base-solana-bridge': 'Base Solana Bridge',
};

const handleLinkPress = (link: string) => {
  Linking.openURL(link);
};

type ISupportedLinks = keyof ApiTokenUrls;

const supportedLinks = new Set(['coingecko', 'dexscreener', 'geckoterminal']);

function getTokenLinkInfo(
  link: ISupportedLinks,
  color: string,
): { label: string; icon: React.ReactNode } | null {
  switch (link) {
    case 'twitter':
      return {
        label: 'X',
        icon: <XLogo color={color} />,
      };
    case 'coingecko':
      return {
        label: 'CoinGecko',
        icon: <CoingeckoLogo />,
      };
    case 'dexscreener':
      return {
        label: 'DexScreener',
        icon: <DexscreenerLogo color={color} />,
      };
    case 'geckoterminal':
      return {
        label: 'GeckoTerminal',
        icon: <GeckoTerminalLogo />,
      };
    default:
      return null;
  }
}

const CLANKER_TYPE_LABELS: Record<string, string> = {
  clanker_v3: 'V3',
  clanker_v3_1: 'V3.1',
  clanker_v4: 'V4',
};

export function TokenAbout({
  token: fallbackToken,
  onLinkPress,
  onUserPress,
}: {
  token: ApiTokenLink;
  onLinkPress?: ({ target }: { target: string }) => void;
  onUserPress?: ({ fid, username }: { fid: number; username?: string }) => void;
}) {
  const token = useGloballyCachedToken({ fallback: fallbackToken });
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  // Clanker enrichment removed — endpoint deprecated in backend types.yaml
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clankerData: any | undefined = undefined;

  const descriptionText = token.description;
  const { trackEvent } = useSharedTelemetry();
  const toast = useRootToast();

  const handleCopy = useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.CopyCAToClipboard, {
      ca: token.ca,
      ticker: token?.ticker,
    });
    toast.show('Copied address', {
      type: 'success',
    });
  }, [token.ca, token?.ticker, trackEvent, triggerImpactAsync, toast]);

  const { copy, copied } = useCopyText({
    text: token.ca,
    onCopy: handleCopy,
  });

  const handleCopyCreatorAddress = useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.CopyCreatorAddressToClipboard, {
      ca: token.ca,
      ticker: token?.ticker,
    });
    toast.show('Copied creator address', {
      type: 'success',
    });
  }, [token.ca, token?.ticker, trackEvent, triggerImpactAsync, toast]);

  const { copy: copyCreatorAddress, copied: copiedCreatorAddress } =
    useCopyText({
      text: token.source?.creatorAddress ?? '',
      onCopy: handleCopyCreatorAddress,
    });

  const handleUserPress = useCallback(() => {
    if (!token.source?.creator) {
      return;
    }

    onUserPress?.({
      fid: token.source.creator.fid,
      username: token.source.creator.username,
    });
  }, [onUserPress, token.source?.creator]);

  const isCreatorFarcasterPro = useUserLevel(token.source?.creator) === 'pro';

  const onPillPress = React.useCallback(
    ({ target }: { target: string | undefined }) => {
      if (typeof target === 'undefined' || target === null || target === '') {
        return;
      }

      trackEvent(AnalyticsEvent.PressTokenAboutPill, { target });

      if (typeof onLinkPress === 'function') {
        onLinkPress({ target });
      } else {
        handleLinkPress(target);
      }
    },
    [onLinkPress, trackEvent],
  );

  const pills = useMemo(() => {
    const retPills: {
      icon: React.ReactNode;
      label: string;
      onPress: () => void;
    }[] = [];
    const addedLinks = new Set<string>();

    if (token.source?.platformUrl && token.source.platform) {
      retPills.push({
        icon: <TokenPlatformIcon platform={token.source.platform} size={14} />,
        label: PLATFORM_NAMES[token.source.platform] ?? token.source.platform,
        onPress: () => onPillPress({ target: token.source?.platformUrl }),
      });
      addedLinks.add(token.source.platformUrl);
    }

    if (token.urls?.website) {
      try {
        const url = new URL(token.urls?.website);

        const farcasterUrl =
          url.host.toLowerCase() === 'warpcast.com' ||
          url.host.toLowerCase() === 'farcaster.xyz' ||
          url.protocol === 'farcaster:';

        const icon = farcasterUrl ? (
          <Image
            source={Farcaster}
            cachePolicy="memory-disk"
            style={[t.roundedFull, { width: 16, height: 16 }]}
          />
        ) : (
          <Globe size={16} color={t.colors.text.tertiary} />
        );

        const label = farcasterUrl
          ? 'Farcaster'
          : url.host.replace('www.', '').split('?')[0];

        retPills.push({
          icon: icon,
          label: label,
          onPress: () => onPillPress({ target: token.urls?.website }),
        });
        addedLinks.add(token.urls?.website);
      } catch {}
    }

    if (token.urls?.twitter) {
      const username = token.urls?.twitter.split('/').pop();
      if (username) {
        retPills.push({
          icon: <XLogo size={10} color={t.colors.text.primary} />,
          label: username,
          onPress: () => onPillPress({ target: token.urls?.twitter }),
        });
        addedLinks.add(token.urls?.twitter);
      }
    }

    if (token.urls?.discord) {
      retPills.push({
        icon: <DiscordLogo size={14} />,
        label: 'Discord',
        onPress: () => onPillPress({ target: token.urls?.discord }),
      });
      addedLinks.add(token.urls?.discord);
    }

    if (token.urls?.telegram) {
      retPills.push({
        icon: <TelegramLogo size={12} />,
        label: 'Telegram',
        onPress: () => onPillPress({ target: token.urls?.telegram }),
      });
      addedLinks.add(token.urls?.telegram);
    }

    const clankerFarcasterUrl = clankerData?.farcasterUrl ?? undefined;
    if (clankerFarcasterUrl && !addedLinks.has(clankerFarcasterUrl)) {
      retPills.push({
        icon: (
          <Image
            source={Farcaster}
            cachePolicy="memory-disk"
            style={[t.roundedFull, { width: 16, height: 16 }]}
          />
        ),
        label: 'Farcaster',
        onPress: () => onPillPress({ target: clankerFarcasterUrl }),
      });
      addedLinks.add(clankerFarcasterUrl);
    }

    const clankerTwitterUrl = clankerData?.twitterUrl ?? undefined;
    if (clankerTwitterUrl && !addedLinks.has(clankerTwitterUrl)) {
      const username = clankerTwitterUrl.split('/').pop();
      retPills.push({
        icon: <XLogo size={10} color={t.colors.text.primary} />,
        label: username || 'X',
        onPress: () => onPillPress({ target: clankerTwitterUrl }),
      });
      addedLinks.add(clankerTwitterUrl);
    }

    const socialLinks = clankerData?.socialLinks;
    if (socialLinks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socialLinks.forEach((link: any) => {
        if (!link.link || addedLinks.has(link.link)) {
          return;
        }
        const label = link.name ? link.name : 'Link';
        retPills.push({
          icon: <Globe size={16} color={t.colors.text.tertiary} />,
          label,
          onPress: () => onPillPress({ target: link.link }),
        });
        addedLinks.add(link.link);
      });
    }

    return retPills;
  }, [
    clankerData?.farcasterUrl,
    clankerData?.socialLinks,
    clankerData?.twitterUrl,
    onPillPress,
    t.colors.text.primary,
    t.colors.text.tertiary,
    t.roundedFull,
    token.source?.platform,
    token.source?.platformUrl,
    token.urls?.discord,
    token.urls?.telegram,
    token.urls?.twitter,
    token.urls?.website,
  ]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Age',
        value: token.source?.createdAt
          ? formatTimeAgoLong(token.source.createdAt)
          : '-',
      },
      {
        label: 'Total Supply',
        value: token.totalSupply
          ? formatShorthandNumber(Number(token.totalSupply))
          : '-',
      },
      {
        label: 'Fully diluted valuation',
        value: formatTokenStat(token.fdv, '-'),
      },
      {
        label: 'Liquidity',
        value: formatTokenStat(token.liquidity, '-'),
      },
      {
        label: 'Market Cap',
        value: formatTokenStat(token.marketCap ?? token.fdv, '-'),
      },
      {
        label: 'Volume 24h',
        value: formatTokenStat(token.volume?.h24, '-'),
      },
    ];
  }, [token]);

  const contract = useMemo(() => {
    const retRows: TableRow[] = [];
    if (token.chain) {
      retRows.push({
        label: 'Chain',
        value: apiChainDisplayName(token.chain),
      });
    }

    if (token.source?.platform) {
      const platformName =
        PLATFORM_NAMES[token.source.platform] ?? token.source.platform;
      // Add Clanker version if available
      const clankerVersion =
        clankerData?.type && CLANKER_TYPE_LABELS[clankerData.type]
          ? ` (${CLANKER_TYPE_LABELS[clankerData.type]})`
          : '';
      retRows.push({
        label: 'Platform',
        value: `${platformName}${clankerVersion}`,
      });
    }

    if (token.ca) {
      retRows.push({
        label: 'Contract address',
        value: (
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}
            onPress={copy}
            activeOpacity={0.75}
          >
            <Text2 size="base" weight="medium">
              {formatAddress(token.ca)}
            </Text2>
            {copied ? (
              <Check size={12} color={t.colors.text.secondary} />
            ) : (
              <Copy size={12} color={t.colors.text.secondary} />
            )}
          </TouchableOpacity>
        ),
      });
    }

    // Add Clanker pool address if available
    if (clankerData?.poolAddress) {
      retRows.push({
        label: 'Pool address',
        value: (
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}
            onPress={() =>
              handleLinkPress(
                `https://basescan.org/address/${clankerData.poolAddress}`,
              )
            }
            activeOpacity={0.75}
          >
            <Text2 size="base" weight="medium">
              {formatAddress(clankerData.poolAddress)}
            </Text2>
          </TouchableOpacity>
        ),
      });
    }

    // Add Clanker locker address if available
    if (clankerData?.lockerAddress) {
      retRows.push({
        label: 'Locker address',
        value: (
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}
            onPress={() =>
              handleLinkPress(
                `https://basescan.org/address/${clankerData.lockerAddress}`,
              )
            }
            activeOpacity={0.75}
          >
            <Text2 size="base" weight="medium">
              {formatAddress(clankerData.lockerAddress)}
            </Text2>
          </TouchableOpacity>
        ),
      });
    }

    if (token.source?.creatorAddress && !token.source?.creator?.username) {
      retRows.unshift({
        label: 'Creator',
        value: (
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}
            onPress={copyCreatorAddress}
            activeOpacity={0.75}
          >
            <Text2 size="sm" weight="medium">
              {formatAddress(token.source.creatorAddress)}
            </Text2>
            {copiedCreatorAddress ? (
              <Check size={14} color={t.colors.text.tertiary} />
            ) : (
              <Copy size={14} color={t.colors.text.tertiary} />
            )}
          </TouchableOpacity>
        ),
      });
    }

    return retRows;
  }, [
    token,
    clankerData,
    t.colors.text.tertiary,
    t.colors.text.secondary,
    t.flex,
    t.flexRow,
    t.itemsCenter,
    copy,
    copied,
    copiedCreatorAddress,
    copyCreatorAddress,
  ]);

  // Clanker fees table
  const clankerFees = useMemo(() => {
    if (!clankerData?.extensions?.fees) {
      return [];
    }

    const fees = clankerData.extensions.fees;
    const retRows: TableRow[] = [];

    if (fees.type) {
      retRows.push({
        label: 'Fee Type',
        value: fees.type === 'dynamic' ? 'Dynamic' : 'Static',
      });
    }

    if (fees.clankerFee !== undefined) {
      retRows.push({
        label: 'Clanker Fee',
        value: `${(fees.clankerFee / 10000).toFixed(2)}%`,
      });
    }

    if (fees.pairedFee !== undefined) {
      retRows.push({
        label: 'Paired Fee',
        value: `${(fees.pairedFee / 10000).toFixed(2)}%`,
      });
    }

    if (fees.hookAddress) {
      retRows.push({
        label: 'Hook',
        value: (
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}
            onPress={() =>
              handleLinkPress(
                `https://basescan.org/address/${fees.hookAddress}`,
              )
            }
            activeOpacity={0.75}
          >
            <Text2 size="base" weight="medium">
              {formatAddress(fees.hookAddress)}
            </Text2>
          </TouchableOpacity>
        ),
      });
    }

    if (fees.recipients && fees.recipients.length > 0) {
      retRows.push({
        label: 'Fee Recipients',
        value: `${fees.recipients.length} recipient${
          fees.recipients.length === 1 ? '' : 's'
        }`,
      });
    }

    return retRows;
  }, [clankerData, t.flex, t.flexRow, t.itemsCenter]);

  // Clanker warnings
  const clankerWarnings = useMemo(() => {
    if (!clankerData?.warnings || clankerData.warnings.length === 0) {
      return null;
    }
    return clankerData.warnings;
  }, [clankerData]);

  // Clankernomics table (vault, dev buy, supply distribution)
  const clankernomics = useMemo(() => {
    if (!clankerData) {
      return [];
    }

    const retRows: TableRow[] = [];

    const formatDuration = (seconds?: number) => {
      if (!seconds || Number.isNaN(seconds)) {
        return undefined;
      }
      if (seconds < 60) {
        return `${seconds}s`;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (days > 0) {
        return `${days}d ${hours}h`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    const formatTokenAmount = (amount?: string) => {
      if (!amount) {
        return undefined;
      }
      const numeric = Number(amount);
      if (Number.isNaN(numeric)) {
        return amount;
      }
      return formatShorthandNumber(numeric / 1e18);
    };

    const formatEthAmount = (amount?: string) => {
      if (!amount) {
        return undefined;
      }
      const numeric = Number(amount);
      if (Number.isNaN(numeric)) {
        return amount;
      }
      // amountEth is in wei, convert to ETH for display
      const ethValue = numeric / 1e18;
      return ethValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      });
    };

    if (clankerData.extensions?.devBuy?.amountEth) {
      retRows.push({
        label: 'Dev Buy',
        value: `${formatEthAmount(clankerData.extensions.devBuy.amountEth)} ETH`,
      });
    }

    if (clankerData.extensions?.vault?.amount) {
      retRows.push({
        label: 'Vault Amount',
        value: formatTokenAmount(clankerData.extensions.vault.amount) ?? '-',
      });
    }

    if (clankerData.extensions?.airdrop?.amount) {
      retRows.push({
        label: 'Airdrop Amount',
        value: formatTokenAmount(clankerData.extensions.airdrop.amount) ?? '-',
      });
    }

    const vaultLockup = formatDuration(
      clankerData.extensions?.vault?.lockup?.lockDuration,
    );
    if (vaultLockup) {
      retRows.push({
        label: 'Vault Lockup',
        value: vaultLockup,
      });
    }

    const vaultVesting = formatDuration(
      clankerData.extensions?.vault?.lockup?.vestDuration,
    );
    if (vaultVesting) {
      retRows.push({
        label: 'Vault Vesting',
        value: vaultVesting,
      });
    }

    const airdropLockup = formatDuration(
      clankerData.extensions?.airdrop?.lockup?.lockDuration,
    );
    if (airdropLockup) {
      retRows.push({
        label: 'Airdrop Lockup',
        value: airdropLockup,
      });
    }

    const airdropVesting = formatDuration(
      clankerData.extensions?.airdrop?.lockup?.vestDuration,
    );
    if (airdropVesting) {
      retRows.push({
        label: 'Airdrop Vesting',
        value: airdropVesting,
      });
    }

    if (clankerData.extensions?.sniperTax?.startingFee !== undefined) {
      retRows.push({
        label: 'Sniper Tax Start',
        value: `${(
          clankerData.extensions.sniperTax.startingFee / 10000
        ).toFixed(2)}%`,
      });
    }

    if (clankerData.extensions?.sniperTax?.endingFee !== undefined) {
      retRows.push({
        label: 'Sniper Tax End',
        value: `${(clankerData.extensions.sniperTax.endingFee / 10000).toFixed(
          2,
        )}%`,
      });
    }

    if (clankerData.extensions?.sniperTax?.secondsToDecay) {
      const decay = formatDuration(
        Number(clankerData.extensions.sniperTax.secondsToDecay),
      );
      if (decay) {
        retRows.push({
          label: 'Sniper Tax Decay',
          value: decay,
        });
      }
    }

    if (clankerData.extensions?.positions?.length) {
      retRows.push({
        label: 'Positions',
        value: `${clankerData.extensions.positions.length}`,
      });
    }

    if (clankerData.market?.startingMarketCap !== undefined) {
      retRows.push({
        label: 'Starting Market Cap',
        value: formatTokenStat(clankerData.market.startingMarketCap, '-'),
      });
    }

    return retRows;
  }, [clankerData]);

  // Deployment info table
  const deploymentInfo = useMemo(() => {
    if (!clankerData) {
      return [];
    }

    const retRows: TableRow[] = [];

    // Interface
    if (clankerData.socialContext?.interface) {
      retRows.push({
        label: 'Interface',
        value: clankerData.socialContext.interface,
      });
    }

    // Platform
    if (clankerData.socialContext?.platform) {
      retRows.push({
        label: 'Platform',
        value: clankerData.socialContext.platform,
      });
    }

    const createdAt = clankerData.deployedAt ?? clankerData.createdAt;
    if (createdAt) {
      const createdDate = new Date(createdAt);
      retRows.push({
        label: 'Created',
        value: createdDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    if (clankerData.lastIndexed) {
      const indexedDate = new Date(clankerData.lastIndexed);
      retRows.push({
        label: 'Last Indexed',
        value: indexedDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    if (clankerData.admin) {
      retRows.push({
        label: 'Admin Address',
        value: (
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, { gap: 6 }]}
            onPress={() =>
              handleLinkPress(
                `https://basescan.org/address/${clankerData.admin}`,
              )
            }
            activeOpacity={0.75}
          >
            <Text2 size="base" weight="medium">
              {formatAddress(clankerData.admin)}
            </Text2>
          </TouchableOpacity>
        ),
      });
    }

    if (clankerData.tags?.verified !== undefined) {
      retRows.push({
        label: 'Verified',
        value: clankerData.tags.verified ? 'Yes' : 'No',
      });
    }

    // Supply
    if (clankerData.supply) {
      const supplyNum = Number(clankerData.supply) / 1e18; // Assuming 18 decimals
      retRows.push({
        label: 'Total Supply',
        value: formatShorthandNumber(supplyNum),
      });
    }

    return retRows;
  }, [clankerData, t.flex, t.flexRow, t.itemsCenter]);

  const links = useMemo(() => {
    const retLinks: {
      label: string;
      url: string;
      icon: React.ReactNode;
      onPress: () => void;
    }[] = [];

    if (token.urls) {
      for (const key in token.urls) {
        if (
          supportedLinks.has(key as ISupportedLinks) &&
          token.urls[key as keyof ApiTokenUrls]
        ) {
          const info = getTokenLinkInfo(
            key as ISupportedLinks,
            t.colors.text.primary,
          );
          if (info) {
            const url = token.urls[key as keyof ApiTokenUrls];

            if (typeof url !== 'undefined') {
              retLinks.push({
                label: info.label,
                url: url,
                icon: info.icon,
                onPress: () => onPillPress({ target: url }),
              });
            }
          }
        }
      }
    }

    return retLinks;
  }, [onPillPress, t.colors.text.primary, token.urls]);

  const [showMoreDescription, setShowMoreDescription] = React.useState(false);

  const toggleShowMoreDescription = useCallback(() => {
    triggerImpactAsync();
    setShowMoreDescription((prev) => !prev);
  }, [triggerImpactAsync]);

  return (
    <Animated.View
      entering={FadeIn}
      style={[t.flex1, { gap: 12, paddingBottom: 20 }]}
    >
      {(descriptionText ||
        pills.length > 0 ||
        token.source?.creator?.username) && (
        <View style={[{ gap: 12 }]}>
          {descriptionText && (
            <Pressable
              style={[{ paddingHorizontal: 12 }]}
              onPress={toggleShowMoreDescription}
            >
              <Text2
                weight="medium"
                numberOfLines={showMoreDescription ? undefined : 3}
              >
                {descriptionText}
              </Text2>
              <Text2 color="brand" weight="medium" size="sm">
                {showMoreDescription ? 'Show less' : 'Show more'}
              </Text2>
            </Pressable>
          )}
          {token.source?.creator?.username && (
            <AnimatedPressable
              onPress={handleUserPress}
              style={[
                t.flexRow,
                t.itemsCenter,
                { gap: 4 },
                { paddingHorizontal: 12 },
              ]}
            >
              <Text2 color="tertiary" weight="medium" size="sm">
                Created by
              </Text2>
              <View>
                <Avatar
                  pfpUrl={token.source?.creator?.pfp?.url}
                  diameter={16}
                />
                {isCreatorFarcasterPro && (
                  <View
                    style={[
                      t.absolute,
                      {
                        position: 'absolute',
                        bottom: -1,
                        right: -1,
                      },
                    ]}
                  >
                    <FarcasterProBadge
                      size={8}
                      showBorder
                      borderWidth={0.5}
                      color={t.colors.background.brand}
                      checkColor={t.colors.background.default}
                    />
                  </View>
                )}
              </View>
              <Text2 size="sm" color="secondary" weight="semibold">
                {token.source?.creator?.username}
              </Text2>
            </AnimatedPressable>
          )}
          {pills.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[{ gap: 8, paddingHorizontal: 12 }]}
            >
              {pills.map((pill, index) => (
                <AnimatedPressable
                  key={index}
                  onPress={pill.onPress}
                  style={[
                    t.flexRow,
                    t.itemsCenter,
                    t.backgrounds.secondary,
                    t.roundedFull,
                    {
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    },
                  ]}
                >
                  {pill.icon}
                  <Text2
                    size="sm"
                    weight="medium"
                    color="secondary"
                    style={{ lineHeight: 16 }}
                  >
                    {pill.label}
                  </Text2>
                </AnimatedPressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}
      <Table
        rows={stats}
        title="Stats"
        alternating={false}
        rowLabelStyle={[t.fontMedium, t.texts.tertiary]}
        titleStyle={[t.texts.primary, { paddingHorizontal: 12 }]}
        rowStyle={[{ paddingHorizontal: 12 }]}
      />
      {/* Clanker warnings */}
      {clankerWarnings && clankerWarnings.length > 0 && (
        <View style={[{ paddingHorizontal: 12, gap: 8 }]}>
          <Text2 weight="semibold" color="primary">
            Warnings
          </Text2>
          {clankerWarnings.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (warning: any, index: number) => (
              <View
                key={index}
                style={[
                  t.flexRow,
                  t.itemsCenter,
                  {
                    gap: 8,
                    backgroundColor: t.colors.background.warning,
                    borderRadius: 8,
                    padding: 12,
                  },
                ]}
              >
                <Text2 size="sm" weight="medium" style={{ flex: 1 }}>
                  {warning.message || warning.type || 'Warning'}
                </Text2>
              </View>
            ),
          )}
        </View>
      )}
      {/* Clankernomics */}
      {clankernomics.length > 0 && (
        <Table
          rows={clankernomics}
          title="Clankernomics"
          alternating={false}
          rowLabelStyle={[t.fontMedium, t.texts.tertiary]}
          titleStyle={[t.texts.primary, { paddingHorizontal: 12 }]}
          rowStyle={[{ paddingHorizontal: 12 }]}
        />
      )}
      {/* Clanker fees */}
      {clankerFees.length > 0 && (
        <Table
          rows={clankerFees}
          title="Fees"
          alternating={false}
          rowLabelStyle={[t.fontMedium, t.texts.tertiary]}
          titleStyle={[t.texts.primary, { paddingHorizontal: 12 }]}
          rowStyle={[{ paddingHorizontal: 12 }]}
        />
      )}
      {/* Deployment info */}
      {deploymentInfo.length > 0 && (
        <Table
          rows={deploymentInfo}
          title="Deployment Info"
          alternating={false}
          rowLabelStyle={[t.fontMedium, t.texts.tertiary]}
          titleStyle={[t.texts.primary, { paddingHorizontal: 12 }]}
          rowStyle={[{ paddingHorizontal: 12 }]}
        />
      )}
      <View>
        <Table
          rows={contract}
          title="Contract"
          alternating={false}
          rowLabelStyle={[t.fontMedium, t.texts.tertiary]}
          titleStyle={[t.texts.primary, { paddingHorizontal: 12 }]}
          rowStyle={[{ paddingHorizontal: 12 }]}
        />
        {links.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[{ gap: 8, paddingHorizontal: 12 }]}
          >
            {links.map((link, index) => (
              <AnimatedPressable
                key={index}
                onPress={() => handleLinkPress(link.url)}
                style={[
                  t.flexRow,
                  t.itemsCenter,
                  t.backgrounds.secondary,
                  t.roundedFull,
                  {
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  },
                ]}
              >
                {link.icon}
                <Text2
                  size="sm"
                  weight="medium"
                  color="secondary"
                  style={{ lineHeight: 16 }}
                >
                  {link.label}
                </Text2>
              </AnimatedPressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
}

function DexscreenerLogo({
  size = 16,
  color,
}: {
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 9 11" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.4221 3.91842C5.74985 3.75063 6.16688 3.50365 6.58442 3.16525C6.67245 3.35295 6.6821 3.51674 6.63674 3.64899C6.6046 3.7422 6.54403 3.82327 6.46438 3.88777C6.37813 3.95747 6.27042 4.00822 6.15135 4.03564C5.92542 4.08789 5.66163 4.05739 5.4221 3.91842ZM5.47892 5.63757L5.91278 5.89486C5.02692 6.4046 4.7861 7.35112 4.50003 8.27303C4.21399 7.35112 3.97313 6.4046 3.08731 5.89486L3.52117 5.63757C3.56314 5.62129 3.59901 5.59178 3.62365 5.55329C3.64828 5.51479 3.66042 5.46927 3.65831 5.42326C3.61856 4.55987 3.84563 4.17806 4.15192 3.93833C4.26178 3.85246 4.3817 3.80934 4.50003 3.80934C4.61835 3.80934 4.73828 3.85246 4.84817 3.93833C5.15445 4.17806 5.38153 4.55987 5.34178 5.42326C5.33967 5.46927 5.3518 5.51479 5.37644 5.55329C5.40108 5.59178 5.43695 5.62129 5.47892 5.63757ZM4.50003 0C5.00153 0.0138233 5.50428 0.113777 5.9406 0.30822C6.24274 0.443043 6.52467 0.621133 6.77995 0.834093C6.89524 0.930233 6.99017 1.02311 7.09474 1.13003C7.37678 1.14004 7.78895 0.818363 7.98031 0.517367C7.65099 1.6258 6.1482 2.93476 5.10781 3.43563C5.10738 3.43545 5.1071 3.43519 5.10678 3.43497C4.92006 3.2886 4.71006 3.21541 4.50003 3.21541C4.28999 3.21541 4.08003 3.2886 3.89331 3.43497C3.89299 3.43515 3.8927 3.43548 3.89228 3.43563C2.85185 2.93476 1.3491 1.6258 1.01978 0.517367C1.2111 0.818363 1.62328 1.14004 1.90531 1.13003C2.00992 1.02315 2.10485 0.930233 2.2201 0.834093C2.47538 0.621133 2.75731 0.443043 3.05945 0.30822C3.49581 0.113777 3.99856 0.0138233 4.50003 0ZM3.57795 3.91842C3.25024 3.75063 2.83317 3.50365 2.41567 3.16525C2.32763 3.35295 2.31799 3.51674 2.36331 3.64899C2.39549 3.7422 2.45606 3.82327 2.53567 3.88777C2.62195 3.95747 2.72967 4.00822 2.84874 4.03564C3.07467 4.08789 3.33842 4.05739 3.57795 3.91842Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.04168 2.75064C7.27154 2.51249 7.47407 2.24889 7.63693 2.01367L7.71964 2.1735C7.98593 2.72046 8.12429 3.26522 8.12429 3.87828L8.12371 4.85112L8.12871 5.35544C8.148 6.59352 8.40893 7.84617 9 8.99251L7.76332 7.96871L6.88829 9.42654L5.969 8.53806L4.5 10.9855L3.031 8.5381L2.11175 9.42657L1.23671 7.96874L0 8.99255C0.591071 7.8462 0.852 6.59356 0.871321 5.35547L0.876321 4.85116L0.87575 3.87832C0.87575 3.26522 1.01407 2.72046 1.28043 2.17354L1.36311 2.01371C1.52596 2.24893 1.72846 2.51249 1.95836 2.75067L1.88657 2.90376C1.74711 3.20109 1.70093 3.53354 1.80957 3.84972C1.87961 4.05336 2.00743 4.22801 2.17221 4.36133C2.33221 4.4908 2.52157 4.57807 2.71982 4.6239C2.84896 4.65375 2.98054 4.66603 3.11125 4.66185C3.08075 4.83935 3.06743 5.02345 3.06657 5.21104L1.9 5.90279L2.80021 6.42086C2.87217 6.46227 2.94066 6.50972 3.005 6.56272C3.74718 7.24685 4.19339 9.27074 4.50004 10.2593C4.80671 9.27074 5.25289 7.24685 5.99511 6.56272C6.05944 6.50972 6.12794 6.46227 6.19989 6.42086L7.10011 5.90279L5.9335 5.21104C5.93264 5.02345 5.91932 4.83935 5.88882 4.66185C6.01954 4.66603 6.15111 4.65375 6.28025 4.6239C6.4785 4.57807 6.66789 4.4908 6.82786 4.36133C6.99261 4.22801 7.12046 4.05336 7.19046 3.84972C7.29914 3.53354 7.25293 3.20112 7.1135 2.90376L7.04171 2.75067L7.04168 2.75064Z"
        fill={color}
      />
    </Svg>
  );
}

function GeckoTerminalLogo({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 37 37" fill="none">
      <Path
        d="M25.3874 4.67265C23.9551 2.11695 21.2579 0.514543 18.3286 0.465142C15.3085 0.414209 12.4875 2.02076 11.0032 4.65148L9.8357 6.72071C9.09319 8.03669 8.00288 9.12298 6.68417 9.86063L4.60241 11.0251C2.02886 12.4647 0.421609 15.1706 0.388648 18.1192L0.385481 18.4026C0.35181 21.4147 1.96564 24.2048 4.5934 25.6774L6.58611 26.7942C7.90926 27.5358 9.00187 28.6284 9.74341 29.9515L10.8602 31.9443C12.3329 34.572 15.123 36.1859 18.1351 36.1522L18.4485 36.1487C21.381 36.1159 24.0748 34.5258 25.5205 31.9742L26.8032 29.7102C27.5482 28.3954 28.6406 27.3109 29.9609 26.5756L31.8462 25.5256C34.4992 24.048 36.1235 21.2301 36.0723 18.1938C36.0229 15.2648 34.4209 12.5826 31.8654 11.1504L29.7372 9.95773C28.4141 9.21618 27.3215 8.12357 26.5799 6.80043L25.3874 4.67265Z"
        fill="#7556F6"
      />
      <Path
        d="M25.277 12.4741C24.225 12.1677 23.1357 11.732 22.031 11.2929C21.9673 11.0142 21.7225 10.6669 21.2261 10.2411C20.5047 9.61075 19.1496 9.62734 17.979 9.90604C16.6866 9.59969 15.4095 9.4902 14.184 9.7866C4.16276 12.5681 9.69071 19.6486 6.01099 26.469C9.24534 27.7065 10.4312 31.9072 20.0754 32.3096C20.0754 32.3096 17.7045 25.3066 24.0065 22.0617C29.1181 19.4306 32.811 14.5445 25.2759 12.473L25.277 12.4741Z"
        fill="#CBBDFF"
      />
      <Path
        d="M28.7843 18.1609C26.5145 19.7723 23.9307 20.9944 20.2686 20.9944C18.5544 20.9944 18.2063 19.1596 17.0731 20.0588C16.4878 20.5233 14.4256 21.5618 12.7883 21.4833C11.1368 21.4036 8.50026 20.437 7.75904 16.9189C7.80084 20.4604 7.69323 23.5277 6.00781 26.4723C9.00977 27.9229 10.2431 31.4325 11.666 33.1416C13.7591 35.6556 16.5217 36.7331 20.1699 35.9463C19.5627 31.674 23.5969 23.6089 25.6855 21.4678C26.4761 20.6571 27.9915 19.3333 28.7843 18.1609Z"
        fill="#CBBDFF"
      />
      <Path
        d="M17.7097 9.89927C18.6069 10.2579 21.8833 11.3491 23.3008 11.7775C21.8535 9.37595 19.6601 9.51454 17.7097 9.89927Z"
        fill="#AC94FF"
      />
      <Path
        d="M18.6731 14.1006C18.6731 15.66 17.4179 16.923 15.8707 16.923C14.3235 16.923 13.0684 15.66 13.0684 14.1006C13.0684 12.5412 14.3235 11.2793 15.8707 11.2793C17.4179 11.2793 18.6731 12.5423 18.6731 14.1006Z"
        fill="white"
      />
      <Ellipse
        cx="17.052"
        cy="14.0805"
        rx="1.64445"
        ry="2.30222"
        fill="black"
      />
      <Path
        d="M17.052 14.0802L15.0787 12.7646V15.3958L17.052 14.0802Z"
        fill="white"
      />
    </Svg>
  );
}

function CoingeckoLogo({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 33" fill="none">
      <Path
        d="M31.9998 16.203C32.0398 25.1032 24.9085 32.3503 16.0727 32.3906C7.23579 32.4309 0.0401701 25.2485 0.000167473 16.3482C-0.0398351 7.44801 7.09154 0.200848 15.9285 0.160559C24.7642 0.121491 31.9598 7.30272 31.9998 16.203Z"
        fill="#FFE866"
      />
      <Path
        d="M24.1145 10.509C22.9532 10.1708 21.7507 9.68979 20.5313 9.2051C20.4609 8.89743 20.1906 8.51408 19.6427 8.04404C18.8463 7.34813 17.3504 7.36645 16.0582 7.67411C14.6315 7.33593 13.2217 7.21506 11.8689 7.54225C0.806333 10.6128 7.07826 18.1004 3.01617 25.6296C3.59439 26.8639 9.97172 32.7942 18.8378 32.1357C18.8378 32.1357 15.7552 24.6749 22.712 21.0928C28.3548 18.1884 32.4314 12.7945 24.1133 10.5078L24.1145 10.509Z"
        fill="#4BCC00"
      />
      <Path
        d="M16.8243 12.3042C16.8243 14.0256 15.4388 15.4199 13.7308 15.4199C12.0228 15.4199 10.6373 14.0256 10.6373 12.3042C10.6373 10.5827 12.0228 9.1897 13.7308 9.1897C15.4388 9.1897 16.8243 10.5839 16.8243 12.3042Z"
        fill="white"
      />
      <Path
        d="M27.9862 16.7882C25.4806 18.567 22.6283 19.9161 18.5856 19.9161C16.6933 19.9161 16.3091 17.8906 15.0581 18.8832C14.412 19.396 12.1355 20.5424 10.3281 20.4557C8.50493 20.3678 5.59444 19.3007 4.7762 15.4171C4.45255 19.3007 4.28769 22.1625 2.83911 25.4418C6.39505 30.6678 12.5951 33.2679 18.8377 32.1371C18.1674 27.4208 22.2598 22.8022 24.5654 20.4386C25.4382 19.5437 27.111 18.0823 27.9862 16.7882Z"
        fill="#4BCC00"
      />
      <Ellipse
        cx="15.0348"
        cy="12.2829"
        rx="1.81532"
        ry="2.54145"
        fill="#0D1217"
      />
      <Path
        d="M15.7609 7.6682C16.7513 8.06406 20.3681 9.26871 21.933 9.74159C20.3352 7.09051 17.914 7.24349 15.7609 7.6682Z"
        fill="#35AF00"
      />
      <Path
        d="M15.0347 12.2826L12.8563 10.8303V13.7348L15.0347 12.2826Z"
        fill="white"
      />
    </Svg>
  );
}

function XLogo({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1200 1227" fill="none">
      <Path
        d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
        fill={color}
      />
    </Svg>
  );
}

function DiscordLogo({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M10.1651 2.1139C9.38836 1.75047 8.55779 1.48634 7.68945 1.33594C7.58281 1.52874 7.45822 1.78807 7.37232 1.99436C6.44925 1.85555 5.53467 1.85555 4.62858 1.99436C4.5427 1.78807 4.41528 1.52874 4.30768 1.33594C3.4384 1.48634 2.60688 1.75144 1.8301 2.11583C0.263321 4.48343 -0.161406 6.79223 0.0509583 9.06824C1.09013 9.84426 2.0972 10.3157 3.08729 10.6242C3.33174 10.2877 3.54977 9.93006 3.73759 9.55314C3.37988 9.41721 3.03726 9.24948 2.71354 9.05475C2.79942 8.99112 2.88343 8.9246 2.96459 8.85615C4.9391 9.77968 7.08445 9.77968 9.03537 8.85615C9.11748 8.9246 9.20148 8.99112 9.28642 9.05475C8.96174 9.25043 8.61819 9.41817 8.26048 9.55411C8.4483 9.93006 8.66538 10.2887 8.91078 10.6251C9.90182 10.3166 10.9098 9.84523 11.949 9.06824C12.1982 6.42976 11.5233 4.14217 10.1651 2.1139ZM4.00659 7.66851C3.41386 7.66851 2.92778 7.11516 2.92778 6.44132C2.92778 5.76748 3.40348 5.21318 4.00659 5.21318C4.60971 5.21318 5.09578 5.76651 5.0854 6.44132C5.08634 7.11516 4.60971 7.66851 4.00659 7.66851ZM7.99337 7.66851C7.40064 7.66851 6.91456 7.11516 6.91456 6.44132C6.91456 5.76748 7.39025 5.21318 7.99337 5.21318C8.59648 5.21318 9.08256 5.76651 9.07218 6.44132C9.07218 7.11516 8.59648 7.66851 7.99337 7.66851Z"
        fill="#5865F2"
      />
    </Svg>
  );
}

function TelegramLogo({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Circle cx="120" cy="120" r="120" fill="#000" />
      <Path
        d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z"
        fill="#c8daea"
      />
      <Path
        d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763"
        fill="#a9c6d8"
      />
      <Path
        d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z"
        fill="#fff"
      />
    </Svg>
  );
}
