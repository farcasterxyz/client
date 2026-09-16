import cn from 'classnames';
import { ApiCast } from 'farcaster-client-data';
import React from 'react';

import { PressableTokenFIP2Card } from '~/components/attachments/PressableTokenFIP2Card';
import { mdAvatarDiameter } from '~/constants/avatar';

type CastAttachmentsSectionVariant = 'feed' | 'focused' | 'chat';

type CastAttachmentsSectionProps = {
  cast: ApiCast;
  variant: CastAttachmentsSectionVariant;
  castAttachment: React.ReactNode;
  nonCarouselAttachments: React.ReactNode;
  hasAttachments: boolean;
  hasNonCarouselAttachments: boolean;
  needsCarousel: boolean;
  carouselMaxHeight: number | undefined;
  horizontalDragScrollRef?: React.RefObject<HTMLDivElement | null>;
};

const CastAttachmentsSection = React.memo(function CastAttachmentsSection({
  cast,
  variant,
  castAttachment,
  nonCarouselAttachments,
  hasAttachments,
  hasNonCarouselAttachments,
  needsCarousel,
  carouselMaxHeight,
  horizontalDragScrollRef,
}: CastAttachmentsSectionProps) {
  if (variant === 'chat') {
    return (
      <>
        {hasAttachments && (
          <div
            className={cn(
              'scrollbar-hide mt-2 flex w-full select-none flex-row gap-2',
              needsCarousel
                ? 'cursor-grab overflow-x-auto overflow-y-hidden'
                : 'overflow-x-hidden overflow-y-hidden',
            )}
            style={
              carouselMaxHeight !== undefined
                ? { maxHeight: carouselMaxHeight }
                : undefined
            }
            ref={needsCarousel ? horizontalDragScrollRef : undefined}
          >
            {castAttachment}
          </div>
        )}
        {hasNonCarouselAttachments && (
          <div className="mt-2 flex w-full flex-col gap-2 overflow-hidden">
            {nonCarouselAttachments}
          </div>
        )}
        {typeof cast.token !== 'undefined' && (
          <div className="mt-2 flex w-full flex-col gap-2 overflow-hidden">
            <PressableTokenFIP2Card
              token={cast.token}
              tx={cast.embeds?.transactions?.[0]}
            />
          </div>
        )}
      </>
    );
  }

  if (variant === 'focused') {
    return (
      <>
        {hasAttachments && (
          <div
            className={cn(
              'scrollbar-hide flex w-full flex-row gap-2 pr-3',
              needsCarousel
                ? 'overflow-x-auto overflow-y-hidden'
                : 'overflow-x-hidden overflow-y-hidden',
            )}
            style={
              carouselMaxHeight !== undefined
                ? { maxHeight: carouselMaxHeight }
                : undefined
            }
            ref={needsCarousel ? horizontalDragScrollRef : undefined}
          >
            <div
              style={{
                width: 6,
                minWidth: 6,
              }}
            />
            {castAttachment}
            <div
              style={{
                width: 6,
                minWidth: 6,
              }}
            />
          </div>
        )}
        {hasNonCarouselAttachments && (
          <div
            className={cn(
              'ml-3 flex w-full flex-row items-center',
              hasAttachments && 'mt-3',
            )}
          >
            <div className="mr-3 flex w-full flex-col gap-2 overflow-hidden">
              {nonCarouselAttachments}
            </div>
            <div
              style={{
                width: 12,
                minWidth: 12,
              }}
            />
          </div>
        )}
        {typeof cast.token !== 'undefined' && (
          <div className="ml-3 mt-3 flex w-full flex-row items-center">
            <div className="mr-3 flex w-full flex-col gap-2 overflow-hidden">
              <PressableTokenFIP2Card
                token={cast.token}
                tx={cast.embeds?.transactions?.[0]}
              />
            </div>
            <div
              style={{
                width: 12,
                minWidth: 12,
              }}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {hasAttachments && (
        <div
          className={cn(
            'scrollbar-hide mt-3 flex w-full select-none flex-row gap-2 pr-4',
            needsCarousel
              ? 'cursor-grab overflow-x-auto overflow-y-hidden'
              : 'overflow-x-hidden overflow-y-hidden',
          )}
          style={
            carouselMaxHeight !== undefined
              ? { maxHeight: carouselMaxHeight }
              : undefined
          }
          ref={needsCarousel ? horizontalDragScrollRef : undefined}
        >
          <div
            style={{
              width: mdAvatarDiameter + 16,
              minWidth: mdAvatarDiameter + 16,
            }}
          />
          {castAttachment}
        </div>
      )}
      {hasNonCarouselAttachments && (
        <div className="flex w-full flex-row items-center">
          <div
            style={{
              width: mdAvatarDiameter + 24,
              minWidth: mdAvatarDiameter + 24,
            }}
          />
          <div className="mr-4 mt-3 flex w-full flex-col gap-2 overflow-hidden">
            {nonCarouselAttachments}
          </div>
        </div>
      )}
      {typeof cast.token !== 'undefined' && (
        <div className="flex w-full flex-row items-center">
          <div
            style={{
              width: mdAvatarDiameter + 24,
              minWidth: mdAvatarDiameter + 24,
            }}
          />
          <div className="mr-4 mt-3 flex w-full flex-col gap-2 overflow-hidden">
            <PressableTokenFIP2Card
              token={cast.token}
              tx={cast.embeds?.transactions?.[0]}
            />
          </div>
        </div>
      )}
    </>
  );
});

export { CastAttachmentsSection };
export type { CastAttachmentsSectionVariant };
