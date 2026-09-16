import { PinIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
  ApiMediaV2,
} from 'farcaster-client-data';
import { processMediasForRendering } from 'farcaster-client-hooks';
import React from 'react';

import { Image as ImageRenderer } from '~/components/images/Image';
import { ImageLightboxModal } from '~/components/modals/ImageLightboxModal';
import { useDirectCastCheckmarks } from '~/hooks/directCasts/useDirectCastCheckmarks';
import { useDirectCastFormattedTimestamp } from '~/hooks/directCasts/useDirectCastFormattedTimestamp';

type DirectCastImageEmbedProps = {
  conversation: ApiDirectCastConversationInfoV3;
  directCast: ApiDirectCastMessageV3;
  mediaEmbeds: ApiMediaV2[];
  shouldRenderMetadataFooter: boolean;
  shouldShowUserDisplayName: boolean;
  senderFid: number;
  senderUsername?: string;
  senderDisplayName: string;
  selfDirectCast: boolean;
  onExpandedStateChange?: (expanded: boolean) => void;
  wrapperHasContentAboveEmbed: boolean;
};

const DirectCastImageEmbed: React.FC<DirectCastImageEmbedProps> = React.memo(
  ({
    selfDirectCast,
    conversation,
    directCast,
    mediaEmbeds,
    shouldRenderMetadataFooter,
    onExpandedStateChange,
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

    const [expanded, setExpanded] = React.useState<boolean>(false);

    React.useEffect(() => {
      onExpandedStateChange?.(expanded);
    }, [expanded, onExpandedStateChange]);

    const imageToRender = React.useMemo(() => {
      const medias = mediaEmbeds;
      // Hard-code web client pixel density to 3 for now since users are
      // reporting some blurry rendering with pixelDensity of < 3.
      const images = processMediasForRendering({ medias, pixelDensity: 3 });

      if (images.length === 0) {
        return undefined;
      }

      return {
        thumbnail: images[0].thumbnail,
        original: images[0].original,
        aspectRatio: images[0].aspectRatio,
        width: images[0].width,
      };
    }, [mediaEmbeds]);

    if (typeof imageToRender === 'undefined') {
      return null;
    }

    return (
      <div
        className={classNames(
          'relative flex flex-col bg-direct-cast ',
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
      >
        <ImageRenderer
          className={classNames(
            'object-top-left relative max-h-[500px] cursor-pointer object-cover bg-overlay-light active:opacity-90',
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
          src={imageToRender.original}
          alt={'Direct cast image embed'}
          onClick={() => {
            setExpanded(true);
          }}
          style={{
            width: imageToRender.width,
            aspectRatio: imageToRender.aspectRatio,
          }}
        />
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
                'absolute h-full w-full',
              )}
              style={{
                background:
                  'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 78.82%, rgba(0, 0, 0, 0.40) 100%)',
              }}
              onClick={() => {
                setExpanded(true);
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
        {expanded && (
          <ImageLightboxModal
            title={'Direct cast image'}
            imageUrls={[imageToRender.original]}
            initialIndex={0}
            onClose={() => {
              setExpanded(false);
            }}
          />
        )}
      </div>
    );
  },
);

export { DirectCastImageEmbed };
