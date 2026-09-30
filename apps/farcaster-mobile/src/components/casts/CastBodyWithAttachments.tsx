import { ApiCast } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { useCastBody } from '~/hooks/useCastBody';
import { shouldShowCastReplyingTo } from '~/utils/CastUtils';

import {
  CastAttachmentsSection,
  type CastAttachmentsSectionVariant,
} from './CastAttachmentsSection';
import { CastBody, FeedCastBody } from './CastBody';
import { CastReplyingTo } from './CastReplyingTo';

type CastBodyWithAttachmentsProps = {
  cast: ApiCast;
  variant: CastAttachmentsSectionVariant;
  castText?: string;
  skipTruncate?: boolean;
  composerMode?: boolean;
  onMiniAppLaunch?: () => void;
  expandByDefault?: boolean;
  skipShowMoreCTA?: boolean;
  omitReplyingTo?: boolean;
  avatarDiameter?: number;
  isAppsDialog?: boolean;
  castOpenIncludeReason?: Parameters<
    typeof CastAttachmentsSection
  >[0]['castOpenIncludeReason'];
};

const CastBodyWithAttachments = React.memo(function CastBodyWithAttachments({
  cast,
  variant,
  castText: castTextOverride,
  skipTruncate,
  composerMode = false,
  onMiniAppLaunch,
  expandByDefault = false,
  skipShowMoreCTA = false,
  omitReplyingTo = false,
  avatarDiameter,
  isAppsDialog = false,
  castOpenIncludeReason,
}: CastBodyWithAttachmentsProps) {
  const isFocusedCast = variant === 'focused';

  const {
    castText,
    bodyWithLinks,
    isTruncatedCastText,
    setTruncateDisabled,
    castAttachment,
    needsCarousel,
    carouselMaxHeight,
    carouselItemWidth,
    preCarouselAttachments,
    nonCarouselAttachments,
    hasAttachments,
    hasPreCarouselAttachments,
    hasNonCarouselAttachments,
  } = useCastBody({
    cast,
    castText: castTextOverride,
    isFocusedCast,
    skipTruncate: skipTruncate ?? (variant === 'chat' || expandByDefault),
    composerMode,
    onMiniAppLaunch,
  });

  const onShowMorePressForCastInFeed = React.useCallback(() => {
    setTruncateDisabled(true);
  }, [setTruncateDisabled]);

  const showReplyLabel =
    variant !== 'chat' &&
    shouldShowCastReplyingTo({
      cast,
      isFocusedCast,
      omitReplyingTo,
    });

  const bodyContent = (() => {
    if (variant === 'feed') {
      return (
        <FeedCastBody
          key={cast.hash}
          bodyWithLinks={bodyWithLinks}
          isFocusedCast={false}
          isTruncatedCastText={isTruncatedCastText}
          onShowMorePress={onShowMorePressForCastInFeed}
          skipShowMoreCTA={skipShowMoreCTA}
        />
      );
    }

    return (
      <CastBody
        key={cast.hash}
        bodyWithLinks={bodyWithLinks}
        isFocusedCast={isFocusedCast}
        copyableText={castText}
      />
    );
  })();

  return (
    <>
      {showReplyLabel && <CastReplyingTo cast={cast} />}
      {variant === 'focused' ? (
        <View style={[{ marginHorizontal: 14 }]}>{bodyContent}</View>
      ) : (
        bodyContent
      )}
      <CastAttachmentsSection
        cast={cast}
        variant={variant}
        castText={castText}
        castAttachment={castAttachment}
        preCarouselAttachments={preCarouselAttachments}
        nonCarouselAttachments={nonCarouselAttachments}
        needsCarousel={needsCarousel}
        carouselMaxHeight={carouselMaxHeight}
        carouselItemWidth={carouselItemWidth}
        hasAttachments={hasAttachments}
        hasPreCarouselAttachments={hasPreCarouselAttachments}
        hasNonCarouselAttachments={hasNonCarouselAttachments}
        avatarDiameter={avatarDiameter}
        isAppsDialog={isAppsDialog}
        castOpenIncludeReason={castOpenIncludeReason}
        isFocusedCast={isFocusedCast}
      />
    </>
  );
});

export { CastBodyWithAttachments };
