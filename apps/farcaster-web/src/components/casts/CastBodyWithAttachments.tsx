import { ApiCast } from 'farcaster-client-data';
import React from 'react';

import {
  CastAttachmentsSection,
  type CastAttachmentsSectionVariant,
} from '~/components/casts/CastAttachmentsSection';
import { useCastBody } from '~/hooks/casts/useCastBody';
import { useHorizontalDragScroll } from '~/utils/castUtils';

type CastBodyWithAttachmentsProps = {
  cast: ApiCast;
  variant: CastAttachmentsSectionVariant;
  castText?: string;
  truncateCastText?: boolean;
  onMiniAppLaunch?: () => void;
};

const CastBodyWithAttachments = React.memo(function CastBodyWithAttachments({
  cast,
  variant,
  castText,
  truncateCastText = false,
  onMiniAppLaunch,
}: CastBodyWithAttachmentsProps) {
  const { ref: horizontalDragScrollRef, draggingRef } =
    useHorizontalDragScroll<HTMLDivElement>();
  const isFocusedCast = variant === 'focused';

  const {
    text: bodyWithLinks,
    castAttachment,
    nonCarouselAttachments,
    hasAttachments,
    hasNonCarouselAttachments,
    needsCarousel,
    carouselMaxHeight,
  } = useCastBody({
    cast,
    castText,
    isFocusedCast,
    truncateCastText,
    draggingRef,
    onMiniAppLaunch,
  });

  return (
    <>
      <div>{bodyWithLinks}</div>
      <CastAttachmentsSection
        cast={cast}
        variant={variant}
        castAttachment={castAttachment}
        nonCarouselAttachments={nonCarouselAttachments}
        hasAttachments={hasAttachments}
        hasNonCarouselAttachments={hasNonCarouselAttachments}
        needsCarousel={needsCarousel}
        carouselMaxHeight={carouselMaxHeight}
        horizontalDragScrollRef={horizontalDragScrollRef}
      />
    </>
  );
});

export { CastBodyWithAttachments };
