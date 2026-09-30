import {
  ApiCast,
  ApiCastEmbeds,
  ApiCastUrlEmbed,
  ApiMediaV2,
  ApiTokenLinkCore,
} from 'farcaster-client-data';
import {
  ClientProcessedMedia,
  getCastEmbedLayout,
  isSnapEmbed,
  processMediasForRendering,
  useCastAttachmentCache,
  useTelemetry,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React, { ReactNode, useCallback, useMemo } from 'react';

import { FrameEmbedAttachment } from '~/components/attachments/FrameEmbedAttachment';
import { GroupInviteAttachment } from '~/components/attachments/GroupInviteAttachment';
import { ImageAttachments } from '~/components/attachments/ImageAttachments';
import { OpenGraphAttachment } from '~/components/attachments/OpenGraphAttachment';
import { QuoteCast } from '~/components/attachments/QuoteCast';
import { RichOpenGraphCastAttachment } from '~/components/attachments/RichOpenGraphAttachment';
import { SnapEmbedAttachment } from '~/components/attachments/SnapEmbedAttachment';
import {
  extractSpaceUrl,
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/attachments/SpaceEmbedAttachment';
import { UnsupportedEmbed } from '~/components/attachments/UnsupportedEmbed';
import { VideoAttachment } from '~/components/attachments/VideoAttachment';
import { ImageLightboxModal } from '~/components/modals/ImageLightboxModal';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { getRenderableEmbeds } from '~/utils/castUtils';

type CastBody = {
  nonLinkfiedText: string;
  text: ReactNode;
  isTruncatedCastText: boolean;

  hasAttachments: boolean;
  hasNonCarouselAttachments: boolean;
  needsCarousel: boolean;
  carouselMaxHeight: number | undefined;
  castAttachment: React.ReactNode;
  nonCarouselAttachments: React.ReactNode;
};

const TRUNCATE_SHOW_MORE_BUFFER = 10;

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
  isFocusedCast,
  draggingRef,
  onMiniAppLaunch,
}: {
  cast: ApiCast;
  text: string;
  isFocusedCast: boolean;
  embeds?: ApiCastEmbeds;
  draggingRef: React.RefObject<boolean>;
  onMiniAppLaunch?: () => void;
}) => {
  const telemetry = useTelemetry();
  const renderableEmbeds = getRenderableEmbeds({
    castText: text,
    embeds,
  });

  const carouselEligibleEmbeds = React.useMemo(() => {
    return renderableEmbeds.filter(
      (o) => o.type === 'image' || o.type === 'video' || o.type === 'og',
    );
  }, [renderableEmbeds]);

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

  const renderUrlEmbedNonSnap = useCallback(
    ({
      embed,
      cast,
      width,
      height,
      spaceWidth,
    }: {
      embed: ApiCastUrlEmbed;
      cast: ApiCast;
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
            key={openGraphAttachment.url}
            cast={cast}
            frameEmbed={openGraphAttachment.frameEmbedNext}
            onLaunchMiniApp={onMiniAppLaunch}
            height={height}
            width={width}
          />
        );
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
        <OpenGraphAttachment
          key={openGraphAttachment.url}
          embed={embed}
          attachment={openGraphAttachment}
          height={height}
          width={width}
          snapContext={false}
        />
      );
    },
    [onMiniAppLaunch],
  );

  const renderUrlEmbedSnap = useCallback(
    ({
      embed,
      cast,
      width,
      height,
      snapWidth,
      spaceWidth,
    }: {
      embed: ApiCastUrlEmbed;
      cast: ApiCast;
      height?: number;
      width?: number;
      snapWidth?: number;
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
            key={openGraphAttachment.url}
            cast={cast}
            frameEmbed={openGraphAttachment.frameEmbedNext}
            onLaunchMiniApp={onMiniAppLaunch}
            height={height}
            width={width}
          />
        );
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
            key={openGraphAttachment.url}
            embed={embed}
            cast={cast}
            width={snapWidth ?? width}
            height={height}
            onMiniAppLaunch={onMiniAppLaunch}
            enableLiftOnInteraction={true}
          />
        );
      }

      return (
        <OpenGraphAttachment
          key={openGraphAttachment.url}
          embed={embed}
          attachment={openGraphAttachment}
          height={height}
          width={width}
          snapContext={true}
        />
      );
    },
    [onMiniAppLaunch],
  );

  return useMemo(() => {
    let bodyTextOverride: string = text.trimEnd();
    let castAttachment: ReactNode = null;
    let nonCarouselAttachments: React.ReactNode = null;
    let hasFallbackSpaceAttachment = false;

    if (typeof embeds === 'undefined') {
      const spaceUrl = extractSpaceUrl(text);
      if (typeof spaceUrl !== 'undefined') {
        bodyTextOverride = removeTrailingSpaceUrl({ text, spaceUrl });
        castAttachment = <SpaceEmbedAttachment url={spaceUrl} />;
        hasFallbackSpaceAttachment = true;
      }

      return {
        bodyTextOverride,
        hasAttachments: hasFallbackSpaceAttachment || hasAttachments,
        hasNonCarouselAttachments,
        castAttachment,
        nonCarouselAttachments,
        needsCarousel: false,
        carouselMaxHeight: undefined,
      };
    }

    const carouselHasNonMedia =
      carouselEligibleEmbeds.findIndex((o) => o.type === 'og') !== -1;

    const layout = getCastEmbedLayout({
      embeds,
      platform: 'web',
      isFocused: isFocusedCast,
      renderingCarousel: needsCarousel,
      carouselHasNonMedia,
    });

    const { width, height, effectiveAR, carouselMaxHeight, mediaTileHeight } =
      layout;

    if (
      renderableEmbeds.filter((o) => o.type === 'image').length !== 0 &&
      text.endsWith(
        renderableEmbeds.filter((o) => o.type === 'image')[0].data.sourceUrl,
      )
    ) {
      bodyTextOverride = text
        .replace(
          renderableEmbeds.filter((o) => o.type === 'image')[0].data.sourceUrl,
          '',
        )
        .trimEnd();
    }

    if (typeof embeds !== 'undefined' && embeds.urls.length !== 0) {
      // processedCastText is derived from the source-language cast; skip it when
      // showing a translation (castText !== cast.text).
      if (
        typeof embeds.processedCastText !== 'undefined' &&
        text === cast.text
      ) {
        bodyTextOverride = embeds.processedCastText;
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
        bodyTextOverride = removeTrailingSpaceUrl({
          text: bodyTextOverride,
          spaceUrl,
        });
        castAttachment = <SpaceEmbedAttachment url={spaceUrl} />;
        hasFallbackSpaceAttachment = true;
      }
    }

    const mediaImageEmbeds = renderableEmbeds
      .filter((o) => o.type === 'image')
      .map(({ data: image }) => {
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

    const startTime = Date.now();
    const imagesToRender = processMediasForRendering({
      medias: mediaImageEmbeds,
      pixelDensity: 3,
      blockAnimated: false,
      useLowQualityImages: false,
    });

    const endTime = Date.now();
    telemetry.maybeAddFrameDroppingAction(
      'farcaster-web.useCastBody.processMediasForRendering',
      endTime - startTime,
    );

    if (!hasFallbackSpaceAttachment) {
      castAttachment =
        layout.mode === 'non-snap' ? (
          <>
            {renderableEmbeds
              .filter((o) => o.type === 'video')
              .map(({ data: video }, videoIndex) => {
                return (
                  <VideoAttachment
                    key={videoIndex}
                    url={video.url}
                    videoWidth={video.width!}
                    videoHeight={video.height!}
                    thumbnailUrl={video.thumbnailUrl}
                    mode="cast"
                    autoPlay={true}
                    maxHeight={height}
                    maxWidth={width}
                    renderWidth={
                      videoIndex === 0 &&
                      !needsCarousel &&
                      effectiveAR !== 'vertical-media'
                        ? width
                        : undefined
                    }
                    renderHeight={height}
                  />
                );
              })}
            <FullScreenImagesProvider
              draggingRef={draggingRef}
              imagesToRender={imagesToRender}
            >
              {renderableEmbeds
                .filter((o) => o.type === 'image')
                .map(({ data: image }, imageIndex) => {
                  return (
                    <ImageAttachments
                      key={imageIndex}
                      images={[image]}
                      height={
                        imageIndex === 0 &&
                        !needsCarousel &&
                        effectiveAR !== 'vertical-media'
                          ? undefined
                          : (mediaTileHeight ?? height)
                      }
                      width={undefined}
                      maxWidth={
                        imageIndex === 0 &&
                        renderableEmbeds.filter((o) => o.type === 'video')
                          .length === 0
                          ? width
                          : undefined
                      }
                      ignoreAspectRatio={carouselHasNonMedia}
                      carouselIndex={imageIndex}
                      snapContext={false}
                    />
                  );
                })}
            </FullScreenImagesProvider>
            {renderableEmbeds
              .filter((o) => o.type === 'og')
              .map(({ data: embed }) =>
                renderUrlEmbedNonSnap({
                  embed,
                  height: needsCarousel ? height : undefined,
                  width: needsCarousel ? undefined : width,
                  spaceWidth: width,
                  cast,
                }),
              )}
          </>
        ) : (
          <>
            {renderableEmbeds
              .filter((o) => o.type === 'og')
              .filter((o) => isSnapEmbed(o.data))
              .map(({ data: embed }) =>
                renderUrlEmbedSnap({
                  embed,
                  height: needsCarousel ? height : undefined,
                  width: needsCarousel ? undefined : width,
                  snapWidth: width,
                  spaceWidth: width,
                  cast,
                }),
              )}
            {renderableEmbeds
              .filter((o) => o.type === 'video')
              .map(({ data: video }, videoIndex) => {
                return (
                  <VideoAttachment
                    key={videoIndex}
                    url={video.url}
                    videoWidth={video.width!}
                    videoHeight={video.height!}
                    thumbnailUrl={video.thumbnailUrl}
                    mode="cast"
                    autoPlay={true}
                    maxHeight={height}
                    maxWidth={width}
                    renderWidth={
                      videoIndex === 0 &&
                      !needsCarousel &&
                      effectiveAR !== 'vertical-media'
                        ? width
                        : undefined
                    }
                    renderHeight={height}
                  />
                );
              })}
            <FullScreenImagesProvider
              draggingRef={draggingRef}
              imagesToRender={imagesToRender}
            >
              {renderableEmbeds
                .filter((o) => o.type === 'image')
                .map(({ data: image }, imageIndex) => {
                  return (
                    <ImageAttachments
                      key={imageIndex}
                      images={[image]}
                      height={
                        imageIndex === 0 &&
                        !needsCarousel &&
                        effectiveAR !== 'vertical-media'
                          ? undefined
                          : (mediaTileHeight ?? height)
                      }
                      width={carouselHasNonMedia ? width : undefined}
                      maxWidth={
                        carouselHasNonMedia
                          ? width
                          : imageIndex === 0 &&
                              renderableEmbeds.filter((o) => o.type === 'video')
                                .length === 0
                            ? width
                            : undefined
                      }
                      ignoreAspectRatio={carouselHasNonMedia}
                      carouselIndex={imageIndex}
                      noShrink={needsCarousel}
                      snapContext={true}
                    />
                  );
                })}
            </FullScreenImagesProvider>
            {renderableEmbeds
              .filter((o) => o.type === 'og')
              .filter((o) => !isSnapEmbed(o.data))
              .map(({ data: embed }) =>
                renderUrlEmbedSnap({
                  embed,
                  height: needsCarousel ? height : undefined,
                  width: needsCarousel ? undefined : width,
                  snapWidth: width,
                  spaceWidth: width,
                  cast,
                }),
              )}
          </>
        );
    }

    if (hasNonCarouselAttachments) {
      nonCarouselAttachments = (
        <div className="flex w-full flex-col gap-2">
          {renderableEmbeds
            .filter((o) => o.type === 'quote')
            .map(({ data: cast }, index) => (
              <div key={index} className="w-full">
                <QuoteCast cast={cast} />
              </div>
            ))}
          {renderableEmbeds
            .filter((o) => o.type === 'non-carousel-bunched-og')
            .map(({ data: embed }, index) => (
              <RichOpenGraphCastAttachment
                key={index}
                cast={cast}
                attachment={embed.openGraph}
                embed={embed}
                disabled={false}
              />
            ))}
          {renderableEmbeds
            .filter((o) => o.type === 'unsupported')
            .map(({ source }, index) => (
              <UnsupportedEmbed key={index} source={source} />
            ))}
          {renderableEmbeds
            .filter((o) => o.type === 'groupInvite')
            .map(({ data: groupInvite }) => (
              <div>
                <GroupInviteAttachment groupInvite={groupInvite} />
              </div>
            ))}
        </div>
      );
    }

    return {
      bodyTextOverride,
      hasAttachments: hasFallbackSpaceAttachment || hasAttachments,
      hasNonCarouselAttachments,
      castAttachment,
      nonCarouselAttachments,
      needsCarousel,
      carouselMaxHeight,
    };
  }, [
    carouselEligibleEmbeds,
    cast,
    draggingRef,
    embeds,
    hasAttachments,
    hasNonCarouselAttachments,
    isFocusedCast,
    needsCarousel,
    renderUrlEmbedNonSnap,
    renderUrlEmbedSnap,
    renderableEmbeds,
    text,
    telemetry,
  ]);
};

const useCastAttachmentDebug = useCastAttachment;

const useCastBody = ({
  cast,
  castText = cast.text,
  isFocusedCast,
  truncateCastText,
  draggingRef,
  onMiniAppLaunch,
}: {
  cast: ApiCast;
  castText?: string;
  isFocusedCast: boolean;
  truncateCastText: boolean;
  draggingRef: React.RefObject<boolean>;
  onMiniAppLaunch?: () => void;
}): CastBody => {
  const castAttachmentCache = useCastAttachmentCache();
  useTrackCastClick();

  const cachedValue = castAttachmentCache({
    fid: cast.author.fid,
    hash: cast.hash,
  });

  const embeds = cast.embeds || cachedValue?.embeds;

  const {
    bodyTextOverride,
    castAttachment,
    nonCarouselAttachments,
    hasNonCarouselAttachments,
    hasAttachments,
    needsCarousel,
    carouselMaxHeight,
  } = useCastAttachment({
    cast,
    text: castText,
    embeds,
    isFocusedCast: isFocusedCast,
    draggingRef: draggingRef,
    onMiniAppLaunch,
  });

  const bodyText = bodyTextOverride;

  const { regularCastByteLimit } = useUserAppContext();

  const shouldTruncate = useMemo(() => {
    // One could argue that we should probably be using the byte len check here.
    // For the first iteration of the release we are okay giving more content on home
    // feed instead of being really strict since mentions and URLs are also part of the
    // cast text length here.
    return (
      truncateCastText &&
      !isFocusedCast &&
      bodyText.length > regularCastByteLimit + TRUNCATE_SHOW_MORE_BUFFER
    );
  }, [bodyText, isFocusedCast, regularCastByteLimit, truncateCastText]);

  const textToLinkify = useMemo(() => {
    return shouldTruncate
      ? `${bodyText.slice(0, regularCastByteLimit)}...`
      : bodyText;
  }, [bodyText, regularCastByteLimit, shouldTruncate]);

  const tokenMentions = useMemo(() => {
    if (typeof cast.embeds !== 'undefined' && cast.embeds.urls.length !== 0) {
      const possibleTokenEmbeds = cast.embeds.urls.map(({ token }) => token);
      const mentions: string[] = [];
      for (const pte of possibleTokenEmbeds) {
        if (typeof pte !== 'undefined') {
          mentions.push(pte.ca);
        }
      }
      return mentions;
    }

    return [];
  }, [cast.embeds]);

  const tokenMentionsV2 = useMemo(() => {
    if (typeof cast.embeds !== 'undefined' && cast.embeds.urls.length !== 0) {
      const possibleTokenEmbeds = cast.embeds.urls.map(
        ({ tokenV2 }) => tokenV2,
      );
      const mentions: ApiTokenLinkCore[] = [];
      for (const pte of possibleTokenEmbeds) {
        if (typeof pte !== 'undefined') {
          mentions.push(pte);
        }
      }
      return mentions;
    }

    return [];
  }, [cast.embeds]);

  const linkifiedCastBodyText = (
    <LinkifiedText
      key="cast-text"
      content={textToLinkify}
      mentions={cast.mentions}
      channelMentions={cast.channelMentions}
      tokenMentions={tokenMentions}
      tokenMentionsV2={tokenMentionsV2}
      castAuthorFid={cast.author.fid}
    />
  );

  return {
    nonLinkfiedText: bodyTextOverride,
    text: linkifiedCastBodyText,
    isTruncatedCastText: shouldTruncate,
    castAttachment: castAttachment,
    nonCarouselAttachments: nonCarouselAttachments,
    hasNonCarouselAttachments: hasNonCarouselAttachments,
    hasAttachments: hasAttachments,
    needsCarousel: needsCarousel,
    carouselMaxHeight: carouselMaxHeight,
  };
};

type FullScreenImagesProviderContextValue = {
  open: ({ initialIndex }: { initialIndex: number }) => void;
};

const FullScreenImagesProviderContext =
  React.createContext<FullScreenImagesProviderContextValue>({} as never);

type FullScreenImagesProviderProps = React.PropsWithChildren<{
  draggingRef: React.RefObject<boolean>;
  imagesToRender: ClientProcessedMedia[];
}>;

function FullScreenImagesProvider({
  draggingRef,
  imagesToRender,
  children,
}: FullScreenImagesProviderProps) {
  const [visibleIndex, setVisibleIndex] = React.useState<number | undefined>(
    undefined,
  );

  const open = React.useCallback(
    ({ initialIndex }: { initialIndex: number }) => {
      if (draggingRef.current !== true) {
        setVisibleIndex(initialIndex);
      }
    },
    [draggingRef],
  );

  return (
    <FullScreenImagesProviderContext value={{ open }}>
      {children}
      {typeof visibleIndex !== 'undefined' && (
        <ImageLightboxModal
          title={'Image embeds on cast'}
          imageUrls={imagesToRender.map(({ original }) => original)}
          initialIndex={visibleIndex}
          onClose={() => {
            setVisibleIndex(undefined);
          }}
        />
      )}
    </FullScreenImagesProviderContext>
  );
}

export const useFullScreenImages = () => {
  return React.useContext(FullScreenImagesProviderContext);
};

export { useCastAttachmentDebug, useCastBody };
