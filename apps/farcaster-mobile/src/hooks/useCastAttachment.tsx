import {
  ApiCast,
  ApiCastEmbeds,
  ApiCastUrlEmbed,
  isDomainOrSubdomain,
} from 'farcaster-client-data';
import {
  getCastEmbedLayout,
  isSnapEmbed,
  useTelemetry,
} from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { Dimensions, View } from 'react-native';

import { FrameEmbedAttachment } from '~/components/casts/CastAttachments/FrameAttachment';
import { GroupInviteAttachment } from '~/components/casts/CastAttachments/GroupInviteAttachment';
import { ImageAttachments } from '~/components/casts/CastAttachments/ImageAttachments';
import { OpenGraphCastAttachment } from '~/components/casts/CastAttachments/OpenGraphCastAttachment';
import { QuoteCast } from '~/components/casts/CastAttachments/QuoteCast';
import { RichOpenGraphCastAttachment } from '~/components/casts/CastAttachments/RichOpenGraphCastAttachments';
import { UnsupportedEmbed } from '~/components/casts/CastAttachments/UnsupportedEmbed';
import { VideoAttachment } from '~/components/casts/CastAttachments/VideoAttachment';
import { SnapEmbedAttachment } from '~/components/Snap/SnapEmbedAttachment';
import {
  extractSpaceUrl,
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/spaces/SpaceEmbedAttachment';
import { useTheme } from '~/contexts/ThemeProvider';
import { getRenderableEmbeds } from '~/utils/EmbedRenderingUtils';
import { getOpenGraphType } from '~/utils/UrlUtils';

type UseCastAttachmentReturnValue = {
  bodyTextOverride: string;

  hasAttachments: boolean;
  hasNonCarouselAttachments: boolean;
  needsCarousel: boolean;
  carouselMaxHeight: number | undefined;
  carouselItemWidth: number | undefined;
  preCarouselAttachments: React.ReactNode;
  castAttachment: React.ReactNode;
  nonCarouselAttachments: React.ReactNode;
  hasPreCarouselAttachments: boolean;
};

const removeTrailingSpaceUrl = ({
  text,
  spaceUrl,
}: {
  text: string;
  spaceUrl: string;
}) => {
  const trimmed = text.trimEnd();
  if (!trimmed.endsWith(spaceUrl)) {
    return trimmed;
  }

  return trimmed.slice(0, -spaceUrl.length).trimEnd();
};

const useCastAttachment = ({
  cast,
  text,
  embeds,
  focusedCastMode,
  composerMode,
  onMiniAppLaunch,
}: {
  cast: ApiCast;
  text: string;
  embeds?: ApiCastEmbeds;
  focusedCastMode: boolean;
  composerMode: boolean;
  onMiniAppLaunch?: () => void;
}): UseCastAttachmentReturnValue => {
  const t = useTheme();
  const telemetry = useTelemetry();

  const rawRenderableEmbeds = React.useMemo(
    () =>
      getRenderableEmbeds({
        castText: text,
        embeds,
      }),
    [text, embeds],
  );

  // If the cast already has `cast.token` populated, skip rendering any token
  // URL OG embed to avoid showing the same token preview twice.
  const renderableEmbeds = React.useMemo(() => {
    if (typeof cast.token === 'undefined') {
      return rawRenderableEmbeds;
    }

    return rawRenderableEmbeds.filter((embed) => {
      if (embed.type !== 'non-carousel-bunched-og') {
        return true;
      }

      return (
        getOpenGraphType({
          domain: embed.data.openGraph.domain,
          url: embed.data.openGraph.url,
        }) !== 'token'
      );
    });
  }, [cast.token, rawRenderableEmbeds]);

  const carouselSourceEmbeds = React.useMemo(() => {
    return renderableEmbeds.filter(
      (o) => o.type === 'image' || o.type === 'video' || o.type === 'og',
    );
  }, [renderableEmbeds]);

  const snapEmbedsToRenderBeforeCarousel = React.useMemo(() => {
    const snapEmbeds = carouselSourceEmbeds.filter(
      (o): o is { type: 'og'; data: ApiCastUrlEmbed } =>
        o.type === 'og' && isSnapEmbed(o.data),
    );

    return carouselSourceEmbeds.length > 1 ? snapEmbeds : [];
  }, [carouselSourceEmbeds]);

  const renderableEmbedsForCarousel = React.useMemo(() => {
    if (snapEmbedsToRenderBeforeCarousel.length === 0) {
      return renderableEmbeds;
    }

    return renderableEmbeds.filter(
      (o) => !(o.type === 'og' && isSnapEmbed(o.data)),
    );
  }, [renderableEmbeds, snapEmbedsToRenderBeforeCarousel.length]);

  const carouselEligibleEmbeds = React.useMemo(() => {
    return renderableEmbedsForCarousel.filter(
      (o) => o.type === 'image' || o.type === 'video' || o.type === 'og',
    );
  }, [renderableEmbedsForCarousel]);

  const needsCarousel = React.useMemo(() => {
    if (!embeds) {
      return false;
    }

    return carouselEligibleEmbeds.length > 1;
  }, [carouselEligibleEmbeds.length, embeds]);

  const hasAttachments = React.useMemo(() => {
    if (!embeds) {
      return false;
    }

    return carouselEligibleEmbeds.length > 0;
  }, [carouselEligibleEmbeds.length, embeds]);

  const hasPreCarouselAttachments = React.useMemo(() => {
    if (!embeds) {
      return false;
    }

    return snapEmbedsToRenderBeforeCarousel.length > 0;
  }, [embeds, snapEmbedsToRenderBeforeCarousel.length]);

  const hasNonCarouselAttachments = React.useMemo(() => {
    if (!embeds) {
      return false;
    }

    const carouselIneligibleEmbeds = renderableEmbeds.filter(
      (o) =>
        o.type === 'quote' ||
        o.type === 'non-carousel-bunched-og' ||
        o.type === 'groupInvite' ||
        o.type === 'unsupported',
    );

    return carouselIneligibleEmbeds.length > 0;
  }, [embeds, renderableEmbeds]);

  const renderUrlEmbedNonSnap = React.useCallback(
    ({
      embed,
      height,
      width,
      spaceWidth,
    }: {
      embed: ApiCastUrlEmbed;
      height?: number;
      width?: number;
      spaceWidth?: number;
    }) => {
      const openGraphAttachment = embed.openGraph;

      if (
        openGraphAttachment &&
        openGraphAttachment.frameEmbedNext &&
        openGraphAttachment.frameEmbedNext.frameEmbed
      ) {
        return (
          <FrameEmbedAttachment
            key={embed.openGraph.url}
            cast={cast}
            frameEmbed={openGraphAttachment.frameEmbedNext}
            onLaunchMiniApp={onMiniAppLaunch}
            height={height}
            width={width}
            disabled={composerMode}
          />
        );
      }

      if (embed.token) {
        return null;
      } else if (
        openGraphAttachment.domain &&
        (isDomainOrSubdomain(openGraphAttachment.domain, 'warpcast.com') ||
          isDomainOrSubdomain(openGraphAttachment.domain, 'farcaster.xyz')) &&
        openGraphAttachment.url.indexOf('~/ca/') !== -1
      ) {
        return null;
      }

      if (matchSpaceUrl(openGraphAttachment.url)) {
        return (
          <SpaceEmbedAttachment
            key={openGraphAttachment.url}
            url={openGraphAttachment.url}
            width={spaceWidth ?? width}
          />
        );
      }

      return (
        <OpenGraphCastAttachment
          key={embed.openGraph.url}
          urlEmbed={embed}
          height={height}
          width={width}
          disabled={composerMode}
        />
      );
    },
    [cast, composerMode, onMiniAppLaunch],
  );

  const renderUrlEmbedSnap = React.useCallback(
    ({
      embed,
      height,
      width,
      spaceWidth,
    }: {
      embed: ApiCastUrlEmbed;
      height?: number;
      width?: number;
      spaceWidth?: number;
    }) => {
      const openGraphAttachment = embed.openGraph;

      if (
        openGraphAttachment &&
        openGraphAttachment.frameEmbedNext &&
        openGraphAttachment.frameEmbedNext.frameEmbed
      ) {
        return (
          <FrameEmbedAttachment
            key={embed.openGraph.url}
            cast={cast}
            frameEmbed={openGraphAttachment.frameEmbedNext}
            onLaunchMiniApp={onMiniAppLaunch}
            height={height}
            width={width}
            disabled={composerMode}
          />
        );
      }

      if (embed.token) {
        return null;
      } else if (
        openGraphAttachment.domain &&
        (isDomainOrSubdomain(openGraphAttachment.domain, 'warpcast.com') ||
          isDomainOrSubdomain(openGraphAttachment.domain, 'farcaster.xyz')) &&
        openGraphAttachment.url.indexOf('~/ca/') !== -1
      ) {
        return null;
      }

      if (matchSpaceUrl(openGraphAttachment.url)) {
        return (
          <SpaceEmbedAttachment
            key={openGraphAttachment.url}
            url={openGraphAttachment.url}
            width={spaceWidth ?? width}
          />
        );
      }

      if (isSnapEmbed(embed)) {
        return (
          <SnapEmbedAttachment
            key={embed.openGraph.url}
            embed={embed}
            castHash={cast.hash}
            castAuthorFid={cast.author.fid}
            height={height}
            width={width}
            enableLiftOnInteraction={true}
          />
        );
      }

      return (
        <OpenGraphCastAttachment
          key={embed.openGraph.url}
          urlEmbed={embed}
          height={height}
          width={width}
          disabled={composerMode}
        />
      );
    },
    [cast, composerMode, onMiniAppLaunch],
  );

  return useMemo(() => {
    const startTime = Date.now();
    let bodyTextOverride: string = text.trimEnd();
    let preCarouselAttachments: React.ReactNode = null;
    let castAttachment: React.ReactNode = null;
    let nonCarouselAttachments: React.ReactNode = null;
    let hasFallbackSpaceAttachment = false;

    if (typeof embeds === 'undefined') {
      const spaceUrl = extractSpaceUrl(text);
      if (typeof spaceUrl !== 'undefined') {
        const { width: screenWidth } = Dimensions.get('window');
        const postWidth = screenWidth - (focusedCastMode ? 26 : 86);
        bodyTextOverride = removeTrailingSpaceUrl({ text, spaceUrl });
        castAttachment = (
          <SpaceEmbedAttachment url={spaceUrl} width={postWidth} />
        );
        hasFallbackSpaceAttachment = true;
      }

      return {
        bodyTextOverride,
        preCarouselAttachments,
        castAttachment,
        nonCarouselAttachments,
        needsCarousel: false,
        carouselMaxHeight: undefined,
        carouselItemWidth: undefined,
        hasAttachments: hasFallbackSpaceAttachment || hasAttachments,
        hasPreCarouselAttachments,
        hasNonCarouselAttachments,
      };
    }

    if (
      embeds.images.length !== 0 &&
      text.endsWith(embeds.images[0].sourceUrl)
    ) {
      bodyTextOverride = text.replace(embeds.images[0].sourceUrl, '').trimEnd();
    }

    if (embeds.urls.length !== 0) {
      // processedCastText is derived from the source-language cast; skip it when
      // showing a translation (text !== cast.text).
      if (
        typeof embeds.processedCastText !== 'undefined' &&
        text === cast.text
      ) {
        bodyTextOverride = embeds.processedCastText.trimEnd();
      } else if (
        text.endsWith(embeds.urls[embeds.urls.length - 1].openGraph.url)
      ) {
        bodyTextOverride = text
          .replace(embeds.urls[embeds.urls.length - 1].openGraph.url, '')
          .trimEnd();
      }
    }

    if (carouselEligibleEmbeds.length === 0) {
      const spaceUrl = extractSpaceUrl(text);
      if (typeof spaceUrl !== 'undefined') {
        const { width: screenWidth } = Dimensions.get('window');
        const postWidth = screenWidth - (focusedCastMode ? 26 : 86);
        bodyTextOverride = removeTrailingSpaceUrl({
          text: bodyTextOverride,
          spaceUrl,
        });
        castAttachment = (
          <SpaceEmbedAttachment url={spaceUrl} width={postWidth} />
        );
        hasFallbackSpaceAttachment = true;
      }
    }

    const carouselHasNonMedia =
      carouselEligibleEmbeds.findIndex((o) => o.type === 'og') !== -1;

    const { width: screenWidth } = Dimensions.get('window');
    const postWidth = screenWidth - (focusedCastMode ? 26 : 86);
    const carouselLayoutEmbeds =
      snapEmbedsToRenderBeforeCarousel.length === 0
        ? embeds
        : {
            ...embeds,
            urls: embeds.urls.filter((urlEmbed) => !isSnapEmbed(urlEmbed)),
            snap: [],
          };

    const layout = getCastEmbedLayout({
      embeds: carouselLayoutEmbeds,
      platform: 'mobile',
      isFocused: focusedCastMode,
      renderingCarousel: needsCarousel,
      carouselHasNonMedia,
      postWidth,
    });

    const { width, height, effectiveAR, carouselMaxHeight } = layout;

    if (snapEmbedsToRenderBeforeCarousel.length > 0) {
      preCarouselAttachments = (
        <View style={[t.flex1, t.wFull, t.flexCol, { gap: 8 }]}>
          {snapEmbedsToRenderBeforeCarousel.map(({ data: embed }) =>
            renderUrlEmbedSnap({
              embed,
              width: postWidth,
            }),
          )}
        </View>
      );
    }

    const carouselVideos = renderableEmbedsForCarousel.filter(
      (o) => o.type === 'video',
    );
    const carouselImages = renderableEmbedsForCarousel
      .filter((o) => o.type === 'image')
      .map(({ data: image }) => image);
    const carouselOgs = renderableEmbedsForCarousel.filter(
      (o) => o.type === 'og',
    );

    const renderVideoList = (videos: typeof carouselVideos) =>
      videos.map(({ data: video }, videoIndex) => (
        <VideoAttachment
          key={videoIndex}
          focusedCastMode={focusedCastMode}
          quoteCastMode={false}
          castHash={cast.hash}
          videoIndex={videoIndex}
          video={video}
          height={height}
          maxHeight={height}
          maxWidth={width}
          renderWidth={
            videoIndex === 0 &&
            !needsCarousel &&
            effectiveAR !== 'vertical-media'
              ? width
              : undefined
          }
        />
      ));

    const renderImageAttachments = () => (
      <ImageAttachments
        images={carouselImages}
        castHash={cast.hash}
        focusedCastMode={focusedCastMode}
        height={
          !needsCarousel && effectiveAR !== 'vertical-media'
            ? undefined
            : height
        }
        width={
          !needsCarousel && effectiveAR !== 'vertical-media' ? width : undefined
        }
        maxWidth={carouselVideos.length === 0 ? width : undefined}
        maxWidthToApplyForHighAr={width}
        ignoreAspectRatio={carouselHasNonMedia}
      />
    );

    if (!hasFallbackSpaceAttachment) {
      castAttachment =
        layout.mode === 'non-snap' ? (
          <>
            {renderVideoList(carouselVideos)}
            {renderImageAttachments()}
            {carouselOgs.map(({ data: embed }) =>
              renderUrlEmbedNonSnap({
                embed,
                height: needsCarousel ? height : undefined,
                width: needsCarousel ? undefined : width,
                spaceWidth: width,
              }),
            )}
          </>
        ) : (
          <>
            {carouselOgs
              .filter((o) => isSnapEmbed(o.data))
              .map(({ data: embed }) =>
                renderUrlEmbedSnap({
                  embed,
                  height: needsCarousel ? height : undefined,
                  width: needsCarousel ? undefined : width,
                  spaceWidth: width,
                }),
              )}
            {renderVideoList(carouselVideos)}
            {renderImageAttachments()}
            {carouselOgs
              .filter((o) => !isSnapEmbed(o.data))
              .map(({ data: embed }) =>
                renderUrlEmbedSnap({
                  embed,
                  height: needsCarousel ? height : undefined,
                  width: needsCarousel ? undefined : width,
                  spaceWidth: width,
                }),
              )}
          </>
        );
    }

    if (hasNonCarouselAttachments) {
      const quoteEmbeds = renderableEmbeds.filter((o) => o.type === 'quote');
      const bunchedOgEmbeds = renderableEmbeds.filter(
        (o) => o.type === 'non-carousel-bunched-og',
      );
      const unsupportedEmbeds = renderableEmbeds.filter(
        (o) => o.type === 'unsupported',
      );
      const groupInviteEmbeds = renderableEmbeds.filter(
        (o) => o.type === 'groupInvite',
      );

      nonCarouselAttachments = (
        <View style={[t.flex1, t.wFull, t.flexCol, { gap: 8 }]}>
          {quoteEmbeds.map(({ data: cast }, index) => (
            <View
              key={index}
              style={[
                { borderRadius: 12 },
                { borderColor: t.colors.feed.threadLine },
                t.border,
                t.wFull,
              ]}
            >
              <QuoteCast cast={cast} />
            </View>
          ))}
          {bunchedOgEmbeds.map(({ data: embed }, index) => (
            <RichOpenGraphCastAttachment
              key={index}
              urlEmbed={embed}
              disabled={composerMode}
              variant={'default'}
            />
          ))}
          {unsupportedEmbeds.map(({ source }, index) => (
            <UnsupportedEmbed key={index} source={source} />
          ))}
          {groupInviteEmbeds.map(({ data: groupInvite }) => (
            <View key={groupInvite.inviteCode}>
              <GroupInviteAttachment groupInvite={groupInvite} />
            </View>
          ))}
        </View>
      );
    }

    telemetry.maybeAddFrameDroppingAction(
      'farcaster-mobile.useCastAttachment',
      Date.now() - startTime,
      {
        castHash: cast.hash,
      },
    );

    return {
      bodyTextOverride,
      preCarouselAttachments,
      castAttachment,
      needsCarousel,
      carouselMaxHeight,
      // Stride used by AttachmentsCarousel.handleScroll to map
      // contentOffset.x → visible index. Each embed is narrower than the
      // viewport (peek-of-next on the side), so the viewport width is the
      // wrong divisor and skips the last index.
      carouselItemWidth: needsCarousel ? width : undefined,
      nonCarouselAttachments,
      hasAttachments: hasFallbackSpaceAttachment || hasAttachments,
      hasPreCarouselAttachments,
      hasNonCarouselAttachments,
    };
  }, [
    carouselEligibleEmbeds,
    cast.hash,
    cast.text,
    composerMode,
    embeds,
    focusedCastMode,
    hasAttachments,
    hasPreCarouselAttachments,
    hasNonCarouselAttachments,
    needsCarousel,
    renderUrlEmbedNonSnap,
    renderUrlEmbedSnap,
    renderableEmbedsForCarousel,
    renderableEmbeds,
    snapEmbedsToRenderBeforeCarousel,
    t.border,
    t.colors.feed.threadLine,
    t.flex1,
    t.flexCol,
    t.wFull,
    telemetry,
    text,
  ]);
};

export { useCastAttachment };
