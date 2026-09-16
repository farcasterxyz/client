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

import { ArticleAttachment } from '~/components/casts/CastAttachments/ArticleAttachment';
import { DeprecatedFrameBanner } from '~/components/casts/CastAttachments/DeprecatedFrameBanner';
import { QuoteTweet } from '~/components/casts/CastAttachments/QuoteTweet';
import { StarterPackAttachment } from '~/components/casts/CastAttachments/StarterPackAttachment';
import { TokenEmbed } from '~/components/casts/CastAttachments/Token';
import { RemoteImage } from '~/components/RemoteImage';
import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/spaces/SpaceEmbedAttachment';
import { Text } from '~/components/Text';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';
import { getOpenGraphImageTypeAndHeight } from '~/utils/CastUtils';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import { getOpenGraphType } from '~/utils/UrlUtils';

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
  layout?: 'large' | 'compact';
}

const DirectCastsOpenGraphCastAttachment: FC<OpenGraphCastAttachmentProps> = ({
  urlEmbed,
  height,
  width,
  disabled = false,
  layout = 'large',
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

  // When the large embed is rendered without an explicit width, fall back to
  // a sensible intrinsic width so the aspect-ratio-driven image does not
  // collapse to zero height in the conversation feed.
  const fallbackPlaceholderStyle = useMemo(() => {
    return width
      ? { width: width - 2 }
      : { alignSelf: 'stretch' as const, width: '100%' as const };
  }, [width]);

  const largeContainerSize = useMemo(() => {
    if (typeof height !== 'undefined') {
      return { height, width: height * 1.91 - 158.5 };
    }
    if (typeof width !== 'undefined') {
      return { width };
    }
    return { alignSelf: 'stretch' as const, width: '100%' as const };
  }, [height, width]);

  const image = useMemo(() => {
    if (!hasAnyImagesToRender) {
      return (
        <View
          style={[
            fallbackPlaceholderStyle,
            {
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
          fallbackPlaceholderStyle,
          {
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
          ...(width
            ? []
            : [
                {
                  alignSelf: 'stretch' as const,
                  width: '100%' as const,
                },
              ]),
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
    fallbackPlaceholderStyle,
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
  const spaceMatch = matchSpaceUrl(urlEmbed.openGraph.url);

  if (spaceMatch) {
    return (
      <View pointerEvents={disabled ? 'none' : 'auto'}>
        <SpaceEmbedAttachment url={urlEmbed.openGraph.url} width={width} />
      </View>
    );
  }

  if (shouldRenderFrameV1Embed) {
    return (
      <View style={[{ width }, t.mT3]}>
        <DeprecatedFrameBanner />
      </View>
    );
  }

  if (shouldRenderTokenEmbed) {
    if (typeof urlEmbed.tokenV2 === 'undefined') {
      return null;
    } else {
      return (
        <View
          style={
            layout === 'compact'
              ? { maxHeight: 120, overflow: 'hidden' }
              : undefined
          }
        >
          <TokenEmbed
            disabled={false}
            token={urlEmbed.tokenV2}
            location="direct-casts"
          />
        </View>
      );
    }
  }

  if (shouldRenderNewsArticleEmbed) {
    if (layout === 'compact') {
      return (
        <Pressable
          style={[
            t.flex,
            t.flexRow,
            t.overflowHidden,
            { borderRadius: 12 },
            t.borderDesignSystemDefault,
            t.border,
            t.bgDefault,
          ]}
          onPress={() => {
            if (!disabled) {
              trackCastClick({ type: CastClickType.ExtLink });
              navigateOrOpenUrl({ url: og.url, openExternalInBrowser: true });
            }
          }}
        >
          {og.image ? (
            <RemoteImage
              uri={og.image}
              fallbackSource={assetUri}
              containerStyle={[{ width: 72, height: 72 }]}
              style={[{ width: 72, height: 72 }]}
              cachePolicy="memory-disk"
              recyclingKey={og.image}
            />
          ) : null}
          <View
            style={[
              t.flex1,
              t.p3,
              t.justifyCenter,
              og.image ? t.borderLHairline : undefined,
              og.image ? t.borderDesignSystemDefault : undefined,
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
    }
    return <ArticleAttachment og={og} disabled={disabled} />;
  }

  if (shouldRenderStarterPackEmbed) {
    return (
      <StarterPackAttachment
        og={og}
        disabled={disabled}
        skipWrapperStyles={true}
      />
    );
  }

  if (shouldRenderQuoteTweet) {
    return (
      <QuoteTweet
        title={og.title!}
        url={og.url}
        tweet={og.description!}
        variant={'direct-cast'}
        tweetPayload={urlEmbed.tweet}
        disabled={disabled}
      />
    );
  }

  if (
    shouldRenderAppEmbed ||
    shouldRenderChannelEmbed ||
    shouldRenderRichWarpcastEmbed ||
    shouldRenderWarpcastSettingsEmbed
  ) {
    return null;
  }

  if (layout === 'compact') {
    const thumbUri = og.image || og.logo;
    return (
      <Pressable
        style={[
          t.flex,
          t.flexRow,
          t.overflowHidden,
          { borderRadius: 12 },
          t.borderDesignSystemDefault,
          t.border,
          t.bgDefault,
        ]}
        onPress={() => {
          if (!disabled) {
            trackCastClick({ type: CastClickType.ExtLink });
            navigateOrOpenUrl({ url: og.url, openExternalInBrowser: true });
          }
        }}
      >
        <View style={[{ width: 72, height: 72 }, t.bgElevated]}>
          {thumbUri ? (
            <RemoteImage
              uri={thumbUri}
              fallbackSource={assetUri}
              containerStyle={[{ width: 72, height: 72 }]}
              style={[{ width: 72, height: 72 }]}
              cachePolicy="memory-disk"
              recyclingKey={thumbUri}
            />
          ) : (
            <View style={[t.flex1, t.itemsCenter, t.justifyCenter]}>
              <Image
                transition={0}
                source={assetUri}
                cachePolicy="memory-disk"
                style={[t.w12, t.h12, t.roundedLg]}
              />
            </View>
          )}
        </View>
        <View
          style={[
            t.flex1,
            t.p3,
            t.justifyCenter,
            thumbUri ? t.borderLHairline : undefined,
            thumbUri ? t.borderDesignSystemDefault : undefined,
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
        largeContainerSize,
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

DirectCastsOpenGraphCastAttachment.displayName =
  'DirectCastsOpenGraphCastAttachment';

export { DirectCastsOpenGraphCastAttachment };
