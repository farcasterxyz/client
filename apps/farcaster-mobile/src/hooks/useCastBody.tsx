import { ApiCast, ApiTokenLinkCore } from 'farcaster-client-data';
import { useCastAttachmentCache } from 'farcaster-client-hooks';
import compact from 'lodash/compact';
import { ReactNode, useMemo, useRef, useState } from 'react';

import { useUserAppContext } from '~/contexts/UserAppContextProvider';

import { useCastAttachment } from './useCastAttachment';
import { useLinkifyText } from './useLinkifyText';

const MAX_LINES_FOR_SHOW_MORE = 15;

const TRUNCATE_SHOW_MORE_BUFFER = 10;

type UseCastBodyReturnValue = {
  castText: string;
  bodyWithLinks: ReactNode;
  castAttachment: ReactNode;
  needsCarousel: boolean;
  carouselMaxHeight: number | undefined;
  carouselItemWidth: number | undefined;
  preCarouselAttachments: ReactNode;
  nonCarouselAttachments: ReactNode;
  hasAttachments: boolean;
  hasPreCarouselAttachments: boolean;
  hasNonCarouselAttachments: boolean;
  isTruncatedCastText: boolean;
  setTruncateDisabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const useCastBody = ({
  cast,
  castText = cast.text,
  isFocusedCast,
  skipTruncate,
  composerMode,
  onMiniAppLaunch,
}: {
  cast: ApiCast;
  castText?: string;
  isFocusedCast: boolean;
  skipTruncate: boolean;
  composerMode: boolean;
  onMiniAppLaunch?: () => void;
}): UseCastBodyReturnValue => {
  const castAttachmentCache = useCastAttachmentCache();

  const cachedValue = castAttachmentCache({
    fid: cast.author.fid,
    hash: cast.hash,
  });

  const [truncateDisabled, setTruncateDisabled] = useState<boolean>(false);

  // Reset expansion when a recycled cell is reassigned to a different cast.
  // Done during render (not in useEffect) so the first render of the new
  // cast doesn't flash the previous cast's expanded body.
  const previousHashRef = useRef(cast.hash);
  if (previousHashRef.current !== cast.hash) {
    previousHashRef.current = cast.hash;
    setTruncateDisabled(false);
  }

  const embeds = cast.embeds || cachedValue?.embeds;

  const {
    bodyTextOverride,
    castAttachment,
    needsCarousel,
    carouselMaxHeight,
    carouselItemWidth,
    preCarouselAttachments,
    nonCarouselAttachments,
    hasAttachments,
    hasPreCarouselAttachments,
    hasNonCarouselAttachments,
  } = useCastAttachment({
    cast,
    text: castText,
    embeds,
    focusedCastMode: isFocusedCast,
    composerMode: composerMode,
    onMiniAppLaunch,
  });

  const bodyText = bodyTextOverride;

  const { regularCastByteLimit } = useUserAppContext();

  const shouldTruncate = useMemo(() => {
    if (truncateDisabled || isFocusedCast || skipTruncate) {
      return false;
    }

    const lineCount = bodyText.split(/\r?\n/).length;
    const exceedsLineLimit = lineCount >= MAX_LINES_FOR_SHOW_MORE;

    const exceedsByteLimit =
      bodyText.length > regularCastByteLimit + TRUNCATE_SHOW_MORE_BUFFER;

    return exceedsLineLimit || exceedsByteLimit;
  }, [
    bodyText,
    isFocusedCast,
    regularCastByteLimit,
    skipTruncate,
    truncateDisabled,
  ]);

  const textToLinkify = useMemo(() => {
    return shouldTruncate
      ? `${bodyText.slice(0, regularCastByteLimit)}...`
      : bodyText;
  }, [bodyText, regularCastByteLimit, shouldTruncate]);

  const mentions = cast.mentions;

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

  const { linkifiedText, hasOnlyImages } = useLinkifyText({
    text: textToLinkify,
    mentions: compact(mentions?.map((mention) => mention.username)),
    channelMentions: cast.channelMentions?.map(({ key }) => key),
    tokenMentions: tokenMentions,
    tokenMentionsV2: tokenMentionsV2,
    castAuthorFid: cast.author.fid,
    options: {
      cacheKey: `${cast.hash}|t:${shouldTruncate ? 1 : 0}|til:1|cf:${cast.author.fid}|orig:${castText === cast.text ? 1 : 0}`,
      treatImageUrlsAsLinks: true,
      telemetryContext: {
        castHash: cast.hash,
        cache: true,
      },
    },
  });

  return useMemo(() => {
    return {
      castText: bodyText,
      bodyWithLinks: hasOnlyImages ? null : linkifiedText,
      castAttachment: castAttachment,
      needsCarousel,
      carouselMaxHeight,
      carouselItemWidth,
      preCarouselAttachments,
      nonCarouselAttachments,
      isTruncatedCastText: shouldTruncate && !hasOnlyImages,
      setTruncateDisabled,
      hasAttachments,
      hasPreCarouselAttachments,
      hasNonCarouselAttachments,
    };
  }, [
    bodyText,
    carouselItemWidth,
    carouselMaxHeight,
    castAttachment,
    hasAttachments,
    hasPreCarouselAttachments,
    hasNonCarouselAttachments,
    hasOnlyImages,
    linkifiedText,
    needsCarousel,
    nonCarouselAttachments,
    preCarouselAttachments,
    shouldTruncate,
  ]);
};

export { useCastBody };
