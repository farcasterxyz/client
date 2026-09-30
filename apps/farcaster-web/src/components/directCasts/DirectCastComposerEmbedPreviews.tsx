import {
  ApiDirectCastMessageMetadata,
  ApiDirectCastUrlEmbedDisplayMode,
} from 'farcaster-client-data';
import {
  isSnapEmbed,
  sleep,
  useProcessDirectCastMessageMetadata,
} from 'farcaster-client-hooks';
import { motion } from 'motion/react';
import React from 'react';

import { GroupInviteAttachment } from '~/components/attachments/GroupInviteAttachment';
import { QuoteCast } from '~/components/attachments/QuoteCast';
import { SnapEmbedAttachment } from '~/components/attachments/SnapEmbedAttachment';
import { Image } from '~/components/images/Image';

import { DirectCastsOpenGraphCastAttachment } from './embeds/DirectCastURLEmbedRenderer';
import { PlayIcon } from './embeds/DirectCastVideoPlayIcon';

export type DirectCastComposerEmbedPreviewsInterface = {
  getCurrentMessageMetadata: () => ApiDirectCastMessageMetadata | undefined;
  getBoundingClientRect: () => DOMRect | undefined;
};

type DirectCastsComposerEmbedPreviewsProps = {
  message: string;
  embedPreviewsRef: React.Ref<DirectCastComposerEmbedPreviewsInterface>;
  /** When true, omit URL preview from outgoing metadata (link stays in text). */
  omitUrlPreview: boolean;
  urlEmbedDisplayMode: ApiDirectCastUrlEmbedDisplayMode;
  onResolvedMetadata?: (
    metadata: ApiDirectCastMessageMetadata | undefined,
  ) => void;
};

const DirectCastsComposerEmbedPreviews: React.FC<DirectCastsComposerEmbedPreviewsProps> =
  React.memo(
    ({
      message,
      embedPreviewsRef,
      omitUrlPreview,
      urlEmbedDisplayMode,
      onResolvedMetadata,
    }) => {
      const processDirectCastMessageMetadata =
        useProcessDirectCastMessageMetadata();

      const [fetchingMetadata, setFetchingMetadata] =
        React.useState<boolean>(true);

      const [messageMetadata, setMessageMetadata] = React.useState<
        ApiDirectCastMessageMetadata | undefined
      >();

      const ref = React.useRef<HTMLDivElement>(null);

      React.useImperativeHandle(embedPreviewsRef, () => {
        return {
          getCurrentMessageMetadata: () => {
            if (typeof messageMetadata === 'undefined') {
              return undefined;
            }
            if (omitUrlPreview) {
              const { urls: _urls, ...rest } = messageMetadata;
              return Object.keys(rest).length > 0 ? rest : undefined;
            }
            return {
              ...messageMetadata,
              urlEmbedDisplayMode,
            };
          },
          getBoundingClientRect: () => {
            return ref.current?.getBoundingClientRect();
          },
        };
      }, [messageMetadata, omitUrlPreview, urlEmbedDisplayMode]);

      // Monotonically-increasing request id so out-of-order fetch resolutions
      // (e.g. from a rapidly-changing `message` while typing) cannot overwrite
      // state produced by a newer in-flight request.
      const latestRequestIdRef = React.useRef(0);

      const fetch = React.useCallback(async () => {
        const requestId = ++latestRequestIdRef.current;
        const start = Date.now();

        setFetchingMetadata(true);
        onResolvedMetadata?.(undefined);
        const response = await processDirectCastMessageMetadata({ message });

        if (Date.now() - start < 2_000) {
          await sleep(1_500);
        }

        if (latestRequestIdRef.current !== requestId) {
          return;
        }

        setMessageMetadata(response.result.metadata);
        onResolvedMetadata?.(response.result.metadata);

        setFetchingMetadata(false);
      }, [message, onResolvedMetadata, processDirectCastMessageMetadata]);

      React.useLayoutEffect(() => {
        fetch();
        return () => {
          // Invalidate any in-flight fetch on unmount / message change so
          // its result is dropped.
          latestRequestIdRef.current += 1;
        };
      }, [fetch]);

      const embeds = React.useMemo(() => {
        if (fetchingMetadata) {
          return <span className="text-sm text-muted">Loading preview...</span>;
        }

        if (typeof messageMetadata === 'undefined') {
          return null;
        }

        if (
          typeof messageMetadata.casts !== 'undefined' &&
          messageMetadata.casts.length !== 0
        ) {
          const cast = messageMetadata.casts[0];

          return (
            <div className="-mt-2 w-full">
              <QuoteCast cast={cast} disabled={true} skipBorderStyles={false} />
            </div>
          );
        }

        if (
          typeof messageMetadata.groupInvites !== 'undefined' &&
          messageMetadata.groupInvites.length !== 0
        ) {
          const groupInvite = messageMetadata.groupInvites[0];

          return (
            <div className="-mt-2 w-full">
              <GroupInviteAttachment
                groupInvite={groupInvite}
                disabled={true}
                slim={true}
              />
            </div>
          );
        }

        if (
          !omitUrlPreview &&
          typeof messageMetadata.urls !== 'undefined' &&
          messageMetadata.urls.length !== 0
        ) {
          const embed = messageMetadata.urls[0];
          const attachment = embed.openGraph;

          if (isSnapEmbed(embed)) {
            return (
              <div className="-mt-2 w-full">
                <SnapEmbedAttachment embed={embed} />
              </div>
            );
          }

          return (
            <div className="-mt-2 w-full">
              <DirectCastsOpenGraphCastAttachment
                embed={embed}
                attachment={attachment}
                disabled
                layout={urlEmbedDisplayMode === 'large' ? 'large' : 'compact'}
              />
            </div>
          );
        }

        if (
          omitUrlPreview &&
          typeof messageMetadata.urls !== 'undefined' &&
          messageMetadata.urls.length !== 0
        ) {
          return (
            <span className="text-sm text-muted">
              Link preview removed for send
            </span>
          );
        }

        if (messageMetadata.medias && messageMetadata.medias.length !== 0) {
          const { staticRaster } = messageMetadata.medias[0];
          return (
            <Image
              alt="Preview of direct cast image"
              className="-mt-2 max-h-[100px] w-full object-contain"
              src={staticRaster}
            />
          );
        }

        if (messageMetadata.videos && messageMetadata.videos.length !== 0) {
          const { thumbnailUrl } = messageMetadata.videos[0];
          if (thumbnailUrl) {
            return (
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-black/50 p-2">
                    <PlayIcon size="32" />
                  </div>
                </div>
                <Image
                  alt="Preview of direct cast image"
                  className="-mt-2 max-h-[100px] w-full object-contain"
                  src={thumbnailUrl}
                />
              </div>
            );
          }
        }
      }, [
        fetchingMetadata,
        messageMetadata,
        omitUrlPreview,
        urlEmbedDisplayMode,
      ]);

      if (embeds === null) {
        return null;
      }

      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="flex w-full items-center justify-center"
        >
          {embeds}
        </motion.div>
      );
    },
  );

export { DirectCastsComposerEmbedPreviews };
