import { Image } from 'expo-image';
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { domainFromUrl, isDomainOrSubdomain } from 'farcaster-client-data';
import { AnimatedPressable, Text2, useHaptics, useTheme } from 'farcaster-expo';
import { ExternalLinkIcon } from 'lucide-react-native';
import React from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { resolveUniversalLink } from '~/utils/DeepLinkUtils';

const CoinTelegraphAssetUri = require('~/assets/images/sources/CoinTelegraph.webp');
const CoindeskAssetUri = require('~/assets/images/sources/Coindesk.webp');
const DefiantAssetUri = require('~/assets/images/sources/Defiant.webp');
const FarcasterAssetUri = require('~/assets/images/sources/Farcaster.webp');
const OpenSeaAssetUri = require('~/assets/images/sources/OpenSea.webp');
const ParagraphAssetUri = require('~/assets/images/sources/Paragraph.webp');
const XAssetUri = require('~/assets/images/sources/X.webp');
const TheBlockAssetUri = require('~/assets/images/sources/TheBlock.webp');
const YahooFinanceAssetUri = require('~/assets/images/sources/YahooFinance.webp');

export function SourcePill({ source }: { source: string }) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const push = usePush();

  const navigate = useNavigate();

  const { triggerImpactAsync } = useHaptics();

  const formattedDomain = React.useMemo(() => {
    return domainFromUrl(source);
  }, [source]);

  const assetUri = React.useCallback(() => {
    if (isDomainOrSubdomain(formattedDomain, 'cointelegraph.com')) {
      return CoinTelegraphAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'coindesk.com')) {
      return CoindeskAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'theblock.co')) {
      return TheBlockAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'farcaster.xyz')) {
      return FarcasterAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'opensea.io')) {
      return OpenSeaAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'thedefiant.io')) {
      return DefiantAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'finance.yahoo.com')) {
      return YahooFinanceAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'twitter.com')) {
      return XAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'x.com')) {
      return XAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'paragraph.com')) {
      return ParagraphAssetUri;
    }
    if (isDomainOrSubdomain(formattedDomain, 'paragraph.xyz')) {
      return ParagraphAssetUri;
    }

    return undefined;
  }, [formattedDomain])();

  const sourceTitle = React.useCallback(() => {
    if (isDomainOrSubdomain(formattedDomain, 'cointelegraph.com')) {
      return 'Cointelegraph';
    }
    if (isDomainOrSubdomain(formattedDomain, 'coindesk.com')) {
      return 'Coindesk';
    }
    if (isDomainOrSubdomain(formattedDomain, 'theblock.co')) {
      return 'The Block';
    }
    if (isDomainOrSubdomain(formattedDomain, 'farcaster.xyz')) {
      return 'Farcaster';
    }
    if (isDomainOrSubdomain(formattedDomain, 'opensea.io')) {
      return 'OpenSea';
    }
    if (isDomainOrSubdomain(formattedDomain, 'thedefiant.io')) {
      return 'The Defiant';
    }
    if (isDomainOrSubdomain(formattedDomain, 'finance.yahoo.com')) {
      return 'Yahoo Finance';
    }
    if (isDomainOrSubdomain(formattedDomain, 'twitter.com')) {
      return 'X (Formerly Twitter)';
    }
    if (isDomainOrSubdomain(formattedDomain, 'x.com')) {
      return 'X (Formerly Twitter)';
    }
    if (isDomainOrSubdomain(formattedDomain, 'paragraph.com')) {
      return 'Paragraph';
    }
    if (isDomainOrSubdomain(formattedDomain, 'paragraph.xyz')) {
      return 'Paragraph';
    }

    return formattedDomain.replace('www.', '');
  }, [formattedDomain])();

  const onSourcePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressArticleSource, { source });

    triggerImpactAsync();

    if (isDomainOrSubdomain(formattedDomain, 'farcaster.xyz')) {
      try {
        const parsedUrl = new URL(source);

        const universalLinkResult = resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        });

        if (
          universalLinkResult &&
          (universalLinkResult.type === 'navigate' ||
            universalLinkResult.type === 'push')
        ) {
          const pushOrNavigate =
            universalLinkResult.type === 'push' ? push : navigate;

          return pushOrNavigate(
            universalLinkResult.name,
            universalLinkResult.params,
          );
        }
      } catch {
        // Nothing to do here if we fail to resolve a Farcaster path
      }
    } else {
      openBrowserAsync(source, {
        dismissButtonStyle: 'close',
        readerMode: false,
        presentationStyle: WebBrowserPresentationStyle.POPOVER,
      });
    }
  }, [formattedDomain, navigate, push, source, trackEvent, triggerImpactAsync]);

  const pressableStyle = React.useMemo(
    () => [
      t.selfStart,
      t.backgrounds.secondary,
      t.pX2,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      { borderRadius: 16, gap: 8, paddingVertical: 6 },
    ],
    [
      t.backgrounds.secondary,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.pX2,
      t.selfStart,
    ],
  );

  return (
    <AnimatedPressable style={pressableStyle} onPress={onSourcePress}>
      {typeof assetUri !== 'undefined' && (
        <Image
          transition={0}
          source={assetUri}
          cachePolicy="memory-disk"
          style={[t.w4, t.h4, t.roundedFull]}
        />
      )}
      <Text2 size="sm" weight="medium" color="secondary">
        {sourceTitle}
      </Text2>
      {typeof assetUri === 'undefined' && (
        <ExternalLinkIcon size={12} color={t.colors.text.secondary} />
      )}
    </AnimatedPressable>
  );
}
