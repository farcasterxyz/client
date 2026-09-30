import {
  ApiCast,
  ApiCastCollectibleAuction,
  ApiCastCollectibleAuctionActive,
  ApiCastCollectibleAuctionEnded,
  ApiCastCollectibleAuctionWithTopBid,
  ApiCastCollectibleMinted,
  ApiMediaV2,
} from 'farcaster-client-data';
import { formatUnits } from 'viem';

import {
  DEFAULT_AVATAR_URL,
  getStandardizedAvatarUrl,
  getStandardizedEmbedImageUrl,
  processMediasForRendering,
} from './ImageUtils';
import { resolveUsernameShort } from './ProfileUtils';

export type CastWithActiveAuction = ApiCast & {
  collectible: ApiCastCollectibleAuctionActive | ApiCastCollectibleAuctionEnded;
};

export function isCastWithActiveAuction(
  cast: ApiCast,
): cast is CastWithActiveAuction {
  return (
    cast.collectible?.state === 'auction-active' ||
    cast.collectible?.state === 'auction-ended'
  );
}

export type CastWithMintedCollectible = ApiCast & {
  collectible: ApiCastCollectibleMinted;
};

export function isCastWithMintedCollectible(
  cast: ApiCast,
): cast is CastWithMintedCollectible {
  return cast.collectible?.state === 'minted';
}

export function isCastCollectibleExplorable(cast: ApiCast) {
  return isCastWithActiveAuction(cast) || isCastWithMintedCollectible(cast);
}

export const ARTIFACT_SIZE = 354;
export const ARTIFACT_HEIGHT = ARTIFACT_SIZE;
export const ARTIFACT_WIDTH = ARTIFACT_SIZE;
export const ARTIFACT_BORDER_COLOR = '#EEEBF8';
export const ARTIFACT_BORDER_RADIUS = 33.984;
export const ARTIFACT_BORDER_WIDTH = 2.832;

export const ARTIFACT_EMBED_WIDTH = 42.245;
export const ARTIFACT_EMBED_HEIGHT = 51.262;
export const ARTIFACT_EMBED_SPACING = 14;
export const ARTIFACT_EMBED_BORDER_RADIUS = 5.664;
export const ARTIFACT_EMBED_BORDER_WITH = 1.416;

export const PADDING = 24;
export const AVATAR_RADIUS = 40 / 2;
export const AVATAR_BORDER_WIDTH = 1.467;

export type ArtifactFooterRightSection =
  | {
      type: 'embeds';
      imageUrls: string[];
    }
  | {
      type: 'icon';
      icon: 'video' | 'miniapp';
    };

export type ArtifactFooterRenderData = {
  username: string;
  postedAt: string;
  pfpImageUrl: string;
  castText?: string;
  quotedCasts: Array<{ authorUsername: string }>;
  rightSection: ArtifactFooterRightSection;
};

type ExtendedArtifactRenderData =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image';
      imageUrl: string;
    }
  | {
      type: 'miniapp_embed';
      imageUrl: string;
    };

export type ArtifactRenderData = {
  footer: ArtifactFooterRenderData;
} & ExtendedArtifactRenderData;

export function getRenderData({
  cast,
  pixelDensity,
}: {
  cast: ApiCast;
  pixelDensity: number;
}): ArtifactRenderData {
  const embedImages = (() => {
    const embeds: Array<{
      type: 'image' | 'video' | 'miniapp_embed';
      imageUrl: string;
    }> = [];

    if (cast.embeds) {
      const miniAppEmbed = cast.embeds?.urls.find(
        (url) => !!url.openGraph.frameEmbedNext?.frameEmbed?.imageUrl,
      );
      if (
        miniAppEmbed &&
        miniAppEmbed.openGraph.frameEmbedNext?.frameEmbed?.imageUrl
      ) {
        embeds.push({
          type: 'miniapp_embed',
          imageUrl: miniAppEmbed.openGraph.frameEmbedNext.frameEmbed.imageUrl,
        });
      }

      if (cast.embeds.videos) {
        cast.embeds.videos.forEach((video) => {
          if (video.thumbnailUrl) {
            embeds.push({
              type: 'video',
              imageUrl: getStandardizedEmbedImageUrl({
                url: video.thumbnailUrl,
                width: ARTIFACT_SIZE,
                height: ARTIFACT_SIZE,
                pixelDensity,
              }),
            });
          }
        });
      }

      const mediaImageEmbeds = cast.embeds.images.map((image) => {
        if (typeof image.media !== 'undefined') {
          return image.media as ApiMediaV2;
        }

        return {
          version: '2',
          staticRaster: image.url,
          height: 1000,
          width: 1000,
        } satisfies ApiMediaV2;
      });

      const imagesToRender = processMediasForRendering({
        medias: mediaImageEmbeds,
        pixelDensity,
        blockAnimated: false,
        useLowQualityImages: false,
      });

      imagesToRender.forEach((image) => {
        embeds.push({
          type: 'image',
          imageUrl: image.thumbnail,
        });
      });
    }

    return embeds;
  })();

  const extendedData: ExtendedArtifactRenderData = (() => {
    if (embedImages.length) {
      if (embedImages[0].type === 'miniapp_embed') {
        return {
          type: 'miniapp_embed',
          imageUrl: embedImages[0].imageUrl,
        };
      }

      return {
        type: 'image',
        imageUrl: embedImages[0].imageUrl,
      };
    }

    return {
      type: 'text',
      text: cast.text,
    };
  })();

  const footerCastText = (() => {
    if (
      extendedData.type === 'image' ||
      extendedData.type === 'miniapp_embed'
    ) {
      return cast.text.replaceAll(/\n\s*\n/g, '\n');
    }
  })();

  const pfpImageUrl = (() => {
    if (cast.author.pfp?.url) {
      return getStandardizedAvatarUrl({
        url: cast.author.pfp?.url as string,
        diameter: Math.round(AVATAR_RADIUS * 2),
        pixelDensity,
      });
    }

    return DEFAULT_AVATAR_URL;
  })();

  const rightSection: ArtifactFooterRightSection = (() => {
    if (embedImages.length) {
      if (embedImages[0].type === 'video') {
        return {
          type: 'icon',
          icon: 'video',
        };
      }

      if (embedImages[0].type === 'miniapp_embed') {
        return {
          type: 'icon',
          icon: 'miniapp',
        };
      }
    }

    return {
      type: 'embeds',
      imageUrls: embedImages.slice(1).map((embed) => embed.imageUrl),
    };
  })();

  const postedDate = new Date(cast.timestamp);
  const postedAt = postedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const quotedCasts = cast.embeds?.casts
    ? cast.embeds.casts.map((cast) => ({
        authorUsername: resolveUsernameShort(cast.author),
      }))
    : [];

  return {
    ...extendedData,
    footer: {
      username: resolveUsernameShort(cast.author),
      pfpImageUrl,
      postedAt,
      castText: footerCastText,
      quotedCasts,
      rightSection,
    },
  };
}

export function calculateMinBid(
  auction: ApiCastCollectibleAuction | ApiCastCollectibleAuctionWithTopBid,
) {
  const minBid =
    auction.minBid && auction.minBid !== '0'
      ? parseFloat(formatUnits(BigInt(auction.minBid), 6))
      : 1;

  if (!('topBid' in auction) || !auction.topBid) {
    return Math.ceil(minBid).toString();
  }

  const topBid = auction.topBid;

  const incrementAmount =
    (topBid.value * Number(auction.minBidIncrement)) / 10000;

  const additionalBidAmount = Math.max(Number(minBid), incrementAmount);
  const bidAmount = topBid.value + additionalBidAmount;

  return Math.ceil(bidAmount).toString();
}

export function formatBidValue(value: number) {
  return `$${value}`;
}
