import cn from 'classnames';
import { ApiCastUrlEmbed, ApiOpenGraphMetadata } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React from 'react';

import { ArticleAttachment } from '~/components/attachments/ArticleAttachment';
import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/attachments/SpaceEmbedAttachment';
import { TokenEmbed } from '~/components/attachments/Token';
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
  /** Compact thumbnail + text row; large uses the tall open-graph card. */
  layout?: 'large' | 'compact';
};

const DirectCastsOpenGraphCastAttachment: React.FC<
  OpenGraphAttachmentProps
> = ({
  embed,
  attachment,
  disabled = false,
  width,
  height,
  layout = 'large',
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
  const spaceMatch = matchSpaceUrl(attachment.url);

  if (spaceMatch) {
    return (
      <div className={cn(disabled && 'pointer-events-none')}>
        <SpaceEmbedAttachment url={attachment.url} />
      </div>
    );
  }

  if (
    type === 'channel-attachment' ||
    type === 'explore-channels' ||
    type === 'app-attachment' ||
    type === 'warpcast-settings' ||
    type === 'starter-pack' ||
    type === 'contract-address' ||
    type === 'rich-warpcast-attachment'
  ) {
    return null;
  }

  if (type === 'news') {
    if (layout === 'compact') {
      return (
        <div className="relative flex w-full max-w-full flex-row overflow-hidden rounded-[12px] border bg-app border-default">
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
          {attachment.image && (
            <div className="relative h-[72px] w-[72px] shrink-0">
              <Image
                alt={attachment.title || 'Article'}
                className="h-full w-full object-cover"
                src={attachment.image}
              />
            </div>
          )}
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col justify-center px-3 py-2',
              attachment.image && 'border-l border-default',
            )}
          >
            <div className="text-xs text-muted">{attachment.domain}</div>
            <div className="line-clamp-2 text-sm font-semibold">{title}</div>
          </div>
        </div>
      );
    }
    return (
      <div className="relative min-w-[300px]">
        <ArticleAttachment og={attachment} disabled={disabled} />
      </div>
    );
  }

  if (type === 'token') {
    if (typeof embed.tokenV2 === 'undefined') {
      return null;
    }

    return (
      <div
        className={cn(
          'relative',
          layout === 'compact' ? 'max-w-full' : 'min-w-[300px]',
        )}
      >
        <TokenEmbed
          token={embed.tokenV2}
          disabled={disabled}
          location="direct-casts"
        />
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div
        title={attachment.url}
        className={cn(
          'relative flex w-full max-w-full flex-row overflow-hidden rounded-[12px] border bg-app border-default',
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
        {imageProps.src && (
          <div className="relative h-[72px] w-[72px] shrink-0">
            <Image
              alt={attachment.title || 'OpenGraph image'}
              className={cn(
                'h-full w-full object-cover',
                (didImageFailToLoad ||
                  imageProps.src.startsWith('/~/images/og')) &&
                  'bg-[#efefef] object-contain dark:bg-[#101010]',
              )}
              {...imageProps}
              onError={() => setDidImageFailToLoad(true)}
            />
          </div>
        )}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col justify-center px-3 py-2',
            imageProps.src && 'border-l border-default',
          )}
        >
          <div className="text-xs text-muted">{attachment.domain}</div>
          <div className="line-clamp-2 text-sm font-semibold">{title}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-[12px] border border-default">
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
          `relative flex h-full w-full cursor-pointer flex-col rounded-[12px] text-sm text-inherit bg-app`,
        )}
        style={{
          height,
          width: typeof height !== 'undefined' ? height * 1.91 - 132 : width,
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
          <div className="text-xs text-muted">{attachment.domain}</div>
          <div className="line-clamp-1 font-semibold">{title}</div>
        </div>
      </div>
    </div>
  );
};

DirectCastsOpenGraphCastAttachment.displayName =
  'DirectCastsOpenGraphCastAttachment';

export { DirectCastsOpenGraphCastAttachment };
