import {
  ApiCastUrlEmbed,
  ApiOnchainTokenMinimal,
  ApiTokenLinkCore,
  isDomainOrSubdomain,
  isExactDomain,
} from 'farcaster-client-data';
import React, { useMemo } from 'react';

import { PressableTokenFIP2Card } from '~/components/PressableTokenFIP2Card';
import { getOpenGraphType } from '~/utils/UrlUtils';

import { AppAttachment } from './AppAttachment';
import { ArticleAttachment } from './ArticleAttachment';
import { ChannelAttachment } from './ChannelAttachment';
import { DeprecatedFrameBanner } from './DeprecatedFrameBanner';
import { QuoteTweet } from './QuoteTweet';
import { RichWarpcastAttachment } from './RichWarpcastAttachment';
import { StarterPackAttachment } from './StarterPackAttachment';
import { WarpcastSettingsAttachment } from './WarpcastSettingsAttachment';

function adaptTokenV2ToOnchainTokenMinimal(
  token: ApiTokenLinkCore,
): ApiOnchainTokenMinimal {
  return {
    ca: token.ca,
    chain: token.chain,
    decimals: token.decimals ?? 0,
    imageUrl: token.imageUrl,
    name: token.name,
    priceUsd: Number(token.priceUsd ?? 0),
    symbol: token.ticker,
    marketCap: token.marketCap,
    priceChangePct: token.priceChangePct?.h6,
    volumeH6: token.volume?.h6,
  };
}

function RichOpenGraphCastAttachment({
  urlEmbed,
  disabled,
  variant,
}: {
  urlEmbed: ApiCastUrlEmbed;
  disabled: boolean;
  variant: 'direct-cast' | 'default';
}) {
  const og = urlEmbed.openGraph;
  const ogType = getOpenGraphType({ domain: og.domain, url: og.url });

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
      typeof og.frameEmbedNext === 'undefined'
    );
  }, [og.frame, og.frameEmbedNext]);

  if (shouldRenderChannelEmbed) {
    return <ChannelAttachment og={og} disabled={disabled} variant={variant} />;
  }

  if (shouldRenderQuoteTweet) {
    return (
      <QuoteTweet
        title={og.title!}
        url={og.url}
        tweet={og.description!}
        variant={variant}
        tweetPayload={urlEmbed.tweet}
        disabled={disabled}
      />
    );
  }

  if (shouldRenderAppEmbed) {
    return <AppAttachment og={og} variant={variant} />;
  }

  if (shouldRenderNewsArticleEmbed) {
    return <ArticleAttachment og={og} disabled={disabled} />;
  }

  if (shouldRenderWarpcastSettingsEmbed) {
    return <WarpcastSettingsAttachment og={og} disabled={disabled} />;
  }

  if (shouldRenderStarterPackEmbed) {
    return (
      <StarterPackAttachment
        og={og}
        disabled={disabled}
        skipWrapperStyles={false}
      />
    );
  }

  if (shouldRenderRichWarpcastEmbed) {
    return (
      <RichWarpcastAttachment
        og={og}
        disabled={disabled}
        skipWrapperStyles={false}
      />
    );
  }

  if (shouldRenderTokenEmbed) {
    if (typeof urlEmbed.tokenV2 === 'undefined') {
      return null;
    }

    return (
      <PressableTokenFIP2Card
        token={adaptTokenV2ToOnchainTokenMinimal(urlEmbed.tokenV2)}
        tx={undefined}
        disabled={disabled}
      />
    );
  }

  if (shouldRenderFrameV1Embed && typeof og.frame !== 'undefined') {
    return <DeprecatedFrameBanner />;
  }

  return null;
}

export { RichOpenGraphCastAttachment };
