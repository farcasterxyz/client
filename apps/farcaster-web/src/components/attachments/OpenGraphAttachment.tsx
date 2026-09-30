import cn from 'classnames';
import { ApiCastUrlEmbed, ApiOpenGraphMetadata } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React from 'react';

import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { useOpenGraphAsset } from '~/hooks/openGraph/useOpenGraphAsset';
import { useOpenGraphTitle } from '~/hooks/openGraph/useOpenGraphTitle';
import { useOpenGraphType } from '~/hooks/openGraph/useOpenGraphType';

type OpenGraphAttachmentProps = {
  embed: ApiCastUrlEmbed;
  attachment: ApiOpenGraphMetadata;
  disabled?: boolean;
  skipWrapperStyles?: boolean;
  variant?: 'default' | 'direct-cast';
  height?: number;
  width?: number;
  /**
   * Post-snap CSS + sizing for carousel rows. Pass `false` for pre-snap cast
   * bodies (e27118ec3): full-height inner card + explicit `height` in style.
   */
  snapContext?: boolean;
};

const OpenGraphAttachment: React.FC<OpenGraphAttachmentProps> = ({
  embed,
  attachment,
  disabled = false,
  width,
  height,
  snapContext = false,
}) => {
  const trackCastClick = useTrackCastClick();
  const [didImageFailToLoad, setDidImageFailToLoad] = React.useState(false);

  const type = useOpenGraphType({
    urlEmbed: embed,
  });

  const title = useOpenGraphTitle({ attachment });

  const { imageProps } = useOpenGraphAsset({
    attachment,
    didImageFailToLoad,
  });

  const domain = attachment.domain?.startsWith('www.')
    ? attachment.domain.slice(4)
    : attachment.domain;

  if (
    type === 'channel-attachment' ||
    type === 'explore-channels' ||
    type === 'app-attachment' ||
    type === 'warpcast-settings' ||
    type === 'starter-pack' ||
    type === 'contract-address' ||
    type === 'rich-warpcast-attachment' ||
    type === 'token' ||
    type === 'news'
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative rounded-[12px] border border-default',
        snapContext && 'self-start',
      )}
    >
      {!disabled && (
        <ExternalLink
          className="absolute inset-0 subtle-hover-z"
          href={attachment.url}
          title={attachment.url}
          onClick={() => {
            trackCastClick({ type: CastClickType.ExtLink });
          }}
        />
      )}
      <div
        title={attachment.url}
        className={cn(
          `relative flex ${snapContext ? 'w-full' : 'h-full w-full'} cursor-pointer flex-col rounded-[12px] text-sm text-inherit bg-app`,
        )}
        style={{
          ...(snapContext
            ? {
                width:
                  typeof height !== 'undefined' ? height * 1.91 - 132 : width,
              }
            : {
                height,
                width:
                  typeof height !== 'undefined' ? height * 1.91 - 132 : width,
              }),
        }}
      >
        {imageProps.src && (
          <Image
            alt={attachment.title || 'OpenGraph image'}
            className={cn(
              'bg-[#efefef] object-cover dark:bg-[#101010]',
              'aspect-opengraph w-full rounded-t-[12px]',
              (didImageFailToLoad ||
                imageProps.src.startsWith('/~/images/og')) &&
                '!object-scale-down',
            )}
            {...imageProps}
            onError={() => setDidImageFailToLoad(true)}
          />
        )}
        <div
          className={cn(
            'flex h-[66px] w-full flex-col justify-start overflow-hidden rounded-b-[12px] border-t px-3 py-3 border-default',
          )}
        >
          <div className="text-xs text-muted">{domain}</div>
          <div className="line-clamp-1 font-semibold">{title}</div>
        </div>
      </div>
    </div>
  );
};

OpenGraphAttachment.displayName = 'OpenGraphAttachment';

export { OpenGraphAttachment };
