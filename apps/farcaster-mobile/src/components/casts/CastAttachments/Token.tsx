import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLinkCore } from 'farcaster-client-data';
import {
  CastClickType,
  formatBuyerCount,
  formatTimeAgo,
  resolveUsernameShort,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  Text2,
  TokenIcon,
  useHaptics,
} from 'farcaster-expo';
import { TokenBadges } from 'farcaster-expo/src/components/crypto/tokens/TokenBadges';
import React from 'react';
import { View } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

interface TokenEmbedProps {
  token: ApiTokenLinkCore;
  disabled: boolean;
  location?: 'feed' | 'direct-casts';
}

function embedKeyGenerator({ token }: { token: ApiTokenLinkCore }) {
  return `${token.chain}:${token.ca}`;
}

function TokenEmbed({ token, disabled, location }: TokenEmbedProps) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const trackCastClick = useTrackCastClick();

  const { triggerImpactAsync } = useHaptics();

  const push = usePush();

  const { colors, locations } = easeGradient({
    colorStops: {
      0: {
        color: t.colors.bgDefault,
      },
      1: {
        color: t.dark ? '#140E1A' : '#F0F0F0',
      },
    },
  });

  const tokenForBadgeComponent = React.useMemo(() => {
    return {
      ...token,
      source:
        typeof token.source !== 'undefined'
          ? { ...token.source, creator: undefined }
          : undefined,
    };
  }, [token]);

  return (
    <AnimatedPressable
      key={embedKeyGenerator({ token })}
      disableHaptics={true}
      disableAnimation={disabled}
      disabled={disabled}
      style={[
        t.relative,
        t.flex,
        t.borderDesignSystemDefault,
        t.border,
        t.flexCol,
        t.justifyBetween,
        t.wFull,
        t.p3,
        { borderRadius: 12 },
        t.overflowHidden,
      ]}
      onPress={() => {
        if (disabled) {
          return;
        }

        trackEvent(AnalyticsEvent.ClickTokenEmbed, {
          chain: token.chain,
          ca: token.ca,
          location,
        });

        trackCastClick({ type: CastClickType.ExtLink });

        triggerImpactAsync();

        push('Token', { ca: token.ca, chain: token.chain, via: 'cast_embed' });
      }}
    >
      <LinearGradient
        colors={colors as unknown as [string, string, ...string[]]}
        locations={locations as unknown as [number, number, ...number[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[t.absolute, t.inset0, { borderRadius: 12 }]}
        pointerEvents="none"
      />
      <View style={[t.flex, t.flexRow, t.itemsStart, t.justifyBetween]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <TokenIcon
            iconUrl={token.imageUrl}
            diameter={48}
            chain={token.chain}
            symbol={token.ticker}
            features={token.features}
            imageBordered={true}
          />
          <View style={[t.flex1, t.flexCol]}>
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                { gap: 4, maxWidth: '90%' },
              ]}
            >
              <Text2
                color="primary"
                weight="medium"
                size="sm"
                numberOfLines={1}
              >
                {token.name}
              </Text2>
              <TokenBadges token={tokenForBadgeComponent} />
            </View>
            {typeof token.source !== 'undefined' &&
              typeof token.source.creator !== 'undefined' && (
                <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  <Text2 color="secondary" size="sm">
                    by
                  </Text2>
                  <Avatar
                    pfpUrl={token.source.creator.pfp?.url}
                    diameter={16}
                  />
                  <Text2 color="secondary" size="sm" weight="medium">
                    {resolveUsernameShort({
                      fid: token.source.creator.fid,
                      username: token.source.creator.username,
                    })}
                  </Text2>
                </View>
              )}
          </View>
        </View>
      </View>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX1,
          t.mT4,
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, { gap: 4 }]}>
          <Text2 size="xs" weight="medium" color="tertiary">
            TICKER
          </Text2>
          <Text2 size="sm" weight="medium" color="secondary">
            ${token.ticker}
          </Text2>
        </View>
        <View style={[t.flexRow, t.itemsCenter, { gap: 24 }]}>
          <View style={[t.flex, t.flexCol, t.itemsStart, { gap: 4 }]}>
            <Text2 size="xs" weight="medium" color="tertiary">
              BUYERS
            </Text2>
            <Text2 size="sm" weight="medium" color="secondary">
              {token.holderCount
                ? `${formatBuyerCount(token.holderCount)}`
                : '-'}
            </Text2>
          </View>
          <View style={[t.flex, t.flexCol, t.itemsStart, { gap: 4 }]}>
            <Text2 size="xs" weight="medium" color="tertiary">
              AGE
            </Text2>
            <Text2 size="sm" weight="medium" color="secondary">
              {token.source?.createdAt
                ? `${formatTimeAgo(token.source?.createdAt)}`
                : '-'}
            </Text2>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}
export { TokenEmbed };
