import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Image } from 'expo-image';
import {
  ApiCastUrlEmbed,
  isDomainOrSubdomain,
  isExactDomain,
} from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React, { FC, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';
import { getOpenGraphImageTypeAndHeight } from '~/utils/CastUtils';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import { getOpenGraphType } from '~/utils/UrlUtils';

import { DeprecatedFrameBanner } from './DeprecatedFrameBanner';

const AmazonAssetUri = require('~/assets/images/open-graph/Amazon.webp');
const AppleMusicAssetUri = require('~/assets/images/open-graph/AppleMusic.webp');
const EtherscanAssetUri = require('~/assets/images/open-graph/Etherscan.webp');
const FacebookAssetUri = require('~/assets/images/open-graph/Facebook.webp');
const InstagramAssetUri = require('~/assets/images/open-graph/Instagram.webp');
const LinkAssetUri = require('~/assets/images/open-graph/Link.webp');
const NotionAssetUri = require('~/assets/images/open-graph/Notion.webp');
const OpenSeaAssetUri = require('~/assets/images/open-graph/OpenSea.webp');
const ReplitAssetUri = require('~/assets/images/open-graph/Replit.webp');
const SubstackAssetUri = require('~/assets/images/open-graph/Substack.webp');
const TwitterAssetUri = require('~/assets/images/open-graph/Twitter.webp');
const WikipediaAssetUri = require('~/assets/images/open-graph/Wikipedia.webp');
const YCAssetUri = require('~/assets/images/open-graph/YC.webp');
const YouTubeAssetUri = require('~/assets/images/open-graph/YouTube.webp');

interface OpenGraphCastAttachmentProps {
  urlEmbed: ApiCastUrlEmbed;
  height?: number;
  width?: number;
  disabled?: boolean;
  skipWrapperStyles?: boolean;
  variant?: 'default' | 'direct-cast';
}

const OpenGraphCastAttachment: FC<OpenGraphCastAttachmentProps> = ({
  urlEmbed,
  height,
  width,
  disabled = false,
}) => {
  const t = useTheme();
  const trackCastClick = useTrackCastClick();
  const textStyles = useCastBodyTextStyle();
  const navigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  const og = urlEmbed.openGraph;
  const ogType = getOpenGraphType({ domain: og.domain, url: og.url });

  const assetUri = useCallback(() => {
    if (!og.domain) {
      return LinkAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'amazon.com')) {
      return AmazonAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'music.apple.com')) {
      return AppleMusicAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'facebook.com')) {
      return FacebookAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'instagram.com')) {
      return InstagramAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'opensea.io')) {
      return OpenSeaAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'replit.com')) {
      return ReplitAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'substack.com')) {
      return SubstackAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'twitter.com')) {
      return TwitterAssetUri;
    }
    if (isExactDomain(og.domain, 'x.com')) {
      return TwitterAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'wikipedia.org')) {
      return WikipediaAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'youtube.com')) {
      return YouTubeAssetUri;
    }
    if (
      // eslint-disable-next-line no-restricted-syntax
      isDomainOrSubdomain(og.domain, 'notion.so') ||
      // eslint-disable-next-line no-restricted-syntax
      isDomainOrSubdomain(og.domain, 'notion.site')
    ) {
      return NotionAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'ycombinator.com')) {
      return YCAssetUri;
    }
    if (isDomainOrSubdomain(og.domain, 'etherscan.io')) {
      return EtherscanAssetUri;
    }
    return LinkAssetUri;
  }, [og.domain])();

  const title = useMemo(() => {
    if (og.domain && isDomainOrSubdomain(og.domain, 'etherscan.io')) {
      return 'Etherscan';
    }

    if (og.domain && isDomainOrSubdomain(og.domain, 'amazon.com')) {
      return 'Amazon';
    }

    if (og.title === '- YouTube') {
      return 'YouTube';
    }

    return og.title || '';
  }, [og]);

  const { forceFallbackAsset } = useMemo(() => {
    return getOpenGraphImageTypeAndHeight(og.domain, og.useLargeImage);
  }, [og.domain, og.useLargeImage]);

  const hasAnyImagesToRender = useMemo(() => {
    return (
      forceFallbackAsset ||
      typeof og.image !== 'undefined' ||
      typeof og.logo !== 'undefined'
    );
  }, [forceFallbackAsset, og.image, og.logo]);

  const shouldRenderQuoteTweet = useMemo(() => {
    return (
      og.domain &&
      (isDomainOrSubdomain(og.domain, 'twitter.com') ||
        isExactDomain(og.domain, 'x.com')) &&
      og.title &&
      og.description
    );
  }, [og]);

  const shouldRenderChannelEmbed = useMemo(() => {
    return (
      og.domain &&
      (isDomainOrSubdomain(og.domain, 'warpcast.com') ||
        isDomainOrSubdomain(og.domain, 'farcaster.xyz')) &&
      og.title &&
      typeof og.channel !== 'undefined'
    );
  }, [og.channel, og.domain, og.title]);

  const shouldRenderAppEmbed = useMemo(() => {
    return ogType === 'explore-apps';
  }, [ogType]);

  const shouldRenderNewsArticleEmbed = useMemo(() => {
    return ogType === 'news';
  }, [ogType]);

  const shouldRenderWarpcastSettingsEmbed = useMemo(() => {
    return ogType === 'warpcast-settings';
  }, [ogType]);

  const shouldRenderStarterPackEmbed = useMemo(() => {
    return ogType === 'starter-pack';
  }, [ogType]);

  const shouldRenderRichWarpcastEmbed = useMemo(() => {
    return ogType === 'rich-warpcast-attachment';
  }, [ogType]);

  const shouldRenderTokenEmbed = useMemo(() => {
    return ogType === 'token';
  }, [ogType]);

  const shouldRenderFrameV1Embed = React.useMemo(() => {
    return (
      typeof og.frame !== 'undefined' &&
      typeof og.domain !== 'undefined' &&
      typeof og.frameEmbedNext === 'undefined'
    );
  }, [og.domain, og.frame, og.frameEmbedNext]);

  const domainToRender = React.useMemo(() => {
    return og.domain?.startsWith('www.') ? og.domain.slice(4) : og.domain;
  }, [og.domain]);

  const image = useMemo(() => {
    if (!hasAnyImagesToRender) {
      return (
        <View
          style={[
            {
              width: (width || 0) - 2,
              aspectRatio: 1.91,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
            t.relative,
            t.bgElevated,
          ]}
        >
          <View style={[t.absolute, t.inset0, t.justifyCenter, t.itemsCenter]}>
            <Image
              transition={0}
              source={assetUri}
              cachePolicy="memory-disk"
              style={[t.w12, t.h12, t.roundedLg]}
            />
          </View>
        </View>
      );
    }

    return forceFallbackAsset ? (
      <View
        style={[
          {
            width: (width || 0) - 2,
            aspectRatio: 1.91,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
          t.relative,
          t.bgElevated,
        ]}
      >
        <View style={[t.absolute, t.inset0, t.justifyCenter, t.itemsCenter]}>
          <Image
            transition={0}
            source={assetUri}
            cachePolicy="memory-disk"
            style={[t.w12, t.h12, t.roundedLg]}
          />
        </View>
      </View>
    ) : (
      <RemoteImage
        uri={og.image}
        fallbackSource={assetUri}
        containerStyle={[
          {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
        ]}
        style={[
          {
            aspectRatio: 1.91,
          },
        ]}
        fallbackStyleOverrides={[t.w12, t.h12, t.roundedLg]}
        cachePolicy="memory-disk"
        recyclingKey={og.image}
        onError={(error) => {
          DdRum.addAction(
            RumActionType.CUSTOM,
            'image-failed-to-load-on-feed',
            { error, imageUrl: og.image },
          );
        }}
      />
    );
  }, [
    assetUri,
    forceFallbackAsset,
    hasAnyImagesToRender,
    og.image,
    t.absolute,
    t.bgElevated,
    t.h12,
    t.inset0,
    t.itemsCenter,
    t.justifyCenter,
    t.relative,
    t.roundedLg,
    t.w12,
    width,
  ]);

  if (shouldRenderFrameV1Embed) {
    return (
      <View style={[{ width }, t.mT3]}>
        <DeprecatedFrameBanner />
      </View>
    );
  }

  if (
    shouldRenderAppEmbed ||
    shouldRenderChannelEmbed ||
    shouldRenderQuoteTweet ||
    shouldRenderRichWarpcastEmbed ||
    shouldRenderStarterPackEmbed ||
    shouldRenderWarpcastSettingsEmbed ||
    shouldRenderTokenEmbed ||
    shouldRenderNewsArticleEmbed
  ) {
    return null;
  }

  return (
    <Pressable
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexCol,
        t.bgDefault,
        t.overflowHidden,
        {
          height: height,
          width: typeof height !== 'undefined' ? height * 1.91 - 158.5 : width,
        },
      ]}
      onPress={() => {
        if (!disabled) {
          trackCastClick({ type: CastClickType.ExtLink });

          navigateOrOpenUrl({ url: og.url, openExternalInBrowser: true });
        }
      }}
    >
      {image}
      <View
        style={[
          t.overflowHidden,
          t.flexCol,
          t.flexShrink,
          t.p3,
          t.justifyCenter,
          t.borderTHairline,
          t.borderDesignSystemDefault,
        ]}
      >
        <Text style={[t.texts.secondary, ...textStyles]} numberOfLines={1}>
          {domainToRender}
        </Text>
        <Text
          style={[t.texts.primary, ...textStyles]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

export { OpenGraphCastAttachment };
