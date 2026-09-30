import { PinIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import React from 'react';

import { VideoAttachment } from '~/components/attachments/VideoAttachment';
import { Image as ImageRenderer } from '~/components/images/Image';
import { useDirectCastCheckmarks } from '~/hooks/directCasts/useDirectCastCheckmarks';
import { useDirectCastFormattedTimestamp } from '~/hooks/directCasts/useDirectCastFormattedTimestamp';

import { PlayIcon } from './DirectCastVideoPlayIcon';

type DirectCastVideoEmbedProps = {
  conversation: ApiDirectCastConversationInfoV3;
  directCast: ApiDirectCastMessageV3;
  shouldRenderMetadataFooter: boolean;
  shouldShowUserDisplayName: boolean;
  senderFid: number;
  senderUsername?: string;
  senderDisplayName: string;
  selfDirectCast: boolean;
  onExpandedStateChange?: (expanded: boolean) => void;
  wrapperHasContentAboveEmbed: boolean;
};

const DirectCastVideoEmbed: React.FC<DirectCastVideoEmbedProps> = React.memo(
  ({
    selfDirectCast,
    conversation,
    directCast,
    shouldRenderMetadataFooter,
    wrapperHasContentAboveEmbed,
  }) => {
    const checkmarks = useDirectCastCheckmarks({
      directCast,
      conversation,
      applyInboxStyles: false,
      applyImageOnlyDirectCastStyles: true,
    });

    const formattedTimestamp = useDirectCastFormattedTimestamp({
      selfDirectCast,
      timestamp: directCast.serverTimestamp,
      hasUnread: false,
      applyInboxStyles: false,
      muted: false,
      applyImageOnlyDirectCastStyles: true,
    });

    const videoToRender = React.useMemo(() => {
      const videos =
        typeof directCast.metadata !== 'undefined' &&
        typeof directCast.metadata.videos !== 'undefined'
          ? directCast.metadata.videos
          : [];

      if (videos.length === 0) {
        return undefined;
      }

      return videos[0];
    }, [directCast.metadata]);

    const controlledVideoPlayerRef = React.useRef<{
      enterFullscreen: () => void;
    }>(null);

    const onVideoAttachmentClick = React.useCallback(() => {
      controlledVideoPlayerRef.current?.enterFullscreen();
    }, []);

    if (
      typeof videoToRender === 'undefined' ||
      typeof videoToRender.height === 'undefined' ||
      typeof videoToRender.width === 'undefined' ||
      typeof videoToRender.thumbnailUrl === 'undefined'
    ) {
      return null;
    }

    return (
      <div
        className={classNames(
          'relative flex cursor-pointer flex-col bg-direct-cast',
          wrapperHasContentAboveEmbed
            ? 'rounded-t-0 rounded-b-[10px]'
            : 'rounded-b-[10px]',
          !wrapperHasContentAboveEmbed &&
            shouldRenderMetadataFooter &&
            '!rounded-lg',
          !wrapperHasContentAboveEmbed &&
            !shouldRenderMetadataFooter &&
            '!rounded-lg rounded-b-[10px]',
        )}
        onClick={onVideoAttachmentClick}
      >
        <ImageRenderer
          className={classNames(
            'object-top-left relative max-h-[500px] w-full cursor-pointer object-cover bg-overlay-light active:opacity-90',
            'border border-default',
            wrapperHasContentAboveEmbed
              ? 'rounded-t-0 rounded-b-[10px]'
              : 'rounded-b-[10px]',
            !wrapperHasContentAboveEmbed &&
              shouldRenderMetadataFooter &&
              '!rounded-lg',
            !wrapperHasContentAboveEmbed &&
              !shouldRenderMetadataFooter &&
              '!rounded-lg rounded-b-[10px]',
          )}
          src={videoToRender.thumbnailUrl}
          alt={'Direct cast video embed'}
          style={{
            aspectRatio: getImageAspectRatio({
              w: videoToRender.width,
              h: videoToRender.height,
            }),
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center rounded-full bg-black/50 p-2">
            <PlayIcon size="64" />
          </div>
        </div>
        <div className="h-0 opacity-0">
          <VideoAttachment
            autoPlay={false}
            mode="cast"
            url={videoToRender.url}
            videoHeight={0}
            videoWidth={0}
            controlledVideoPlayerRef={controlledVideoPlayerRef}
          />
        </div>
        {shouldRenderMetadataFooter && (
          <>
            <div
              className={classNames(
                wrapperHasContentAboveEmbed
                  ? 'rounded-t-0 rounded-b-[10px]'
                  : 'rounded-b-[10px]',
                !wrapperHasContentAboveEmbed &&
                  shouldRenderMetadataFooter &&
                  '!rounded-lg',
                !wrapperHasContentAboveEmbed &&
                  !shouldRenderMetadataFooter &&
                  '!rounded-lg rounded-b-[10px]',
                'absolute h-full w-full',
              )}
              style={{
                background:
                  'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 78.82%, rgba(0, 0, 0, 0.40) 100%)',
              }}
            />
            <div
              className={classNames([
                'absolute bottom-0 right-0 mb-2 mr-1 flex w-min flex-row items-center rounded-full pl-1',
              ])}
            >
              <div className="ml-2 mr-1 inline-flex">
                {directCast.isPinned && (
                  <div className="mr-0.5 flex flex-row items-center">
                    <PinIcon size={10} />
                  </div>
                )}
                {formattedTimestamp}
                {checkmarks}
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);

export { DirectCastVideoEmbed };
