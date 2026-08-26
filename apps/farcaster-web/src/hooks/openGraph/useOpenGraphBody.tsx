import cn from 'classnames';
import { ApiCastUrlEmbed, ApiOpenGraphMetadata } from 'farcaster-client-data';
import { useMemo } from 'react';

import { AppAttachment } from '~/components/attachments/AppAttachment';
import { ArticleAttachment } from '~/components/attachments/ArticleAttachment';
import { ChannelAttachment } from '~/components/attachments/ChannelAttachment';
import { ExploreChannelsAttachment } from '~/components/attachments/ExploreChannelsAttachment';
import { QuoteTweet } from '~/components/attachments/QuoteTweet';
import { RichWarpcastAttachment } from '~/components/attachments/RichWarpcastAttachment';
import { StarterPackAttachment } from '~/components/attachments/StarterPackAttachment';
import { TokenEmbed } from '~/components/attachments/Token';
import { WarpcastSettingsAttachment } from '~/components/attachments/WarpcastSettingsAttachment';
import { Image } from '~/components/images/Image';
import { OpenGraphRenderType } from '~/hooks/openGraph/useOpenGraphType';

const useOpenGraphBody = ({
  embed,
  attachment,
  imageProps,
  setDidImageFailToLoad,
  title,
  type,
  disabled,
  skipWrapperStyles = false,
  variant = 'default',
}: {
  embed: ApiCastUrlEmbed;
  attachment: ApiOpenGraphMetadata;
  imageProps: { src: string; srcSet?: string };
  setDidImageFailToLoad: (didImageFailToLoad: boolean) => void;
  title: string;
  type: OpenGraphRenderType;
  disabled: boolean;
  skipWrapperStyles?: boolean;
  variant?: 'default' | 'direct-cast';
}) => {
  return useMemo(() => {
    switch (type) {
      case 'explore-channels':
        return <ExploreChannelsAttachment og={attachment} />;
      case 'news':
        return <ArticleAttachment og={attachment} disabled={disabled} />;
      case 'channel-attachment':
        return (
          <ChannelAttachment
            og={attachment}
            disabled={disabled}
            variant={variant}
          />
        );
      case 'app-attachment':
        return <AppAttachment og={attachment} disabled={disabled} />;
      case 'warpcast-settings':
        return (
          <WarpcastSettingsAttachment og={attachment} disabled={disabled} />
        );
      case 'starter-pack':
        return <StarterPackAttachment og={attachment} disabled={disabled} />;
      case 'rich-warpcast-attachment':
        return <RichWarpcastAttachment og={attachment} disabled={disabled} />;
      case 'quote-tweet':
        return (
          <QuoteTweet
            embed={embed}
            url={attachment.url}
            title={attachment.title || ''}
            tweet={attachment.description || ''}
            skipWrapperStyles={skipWrapperStyles}
          />
        );
      case 'contract-address': {
        return null;
      }
      case 'token': {
        if (typeof embed.tokenV2 === 'undefined') {
          return null;
        }

        return (
          <TokenEmbed
            token={embed.tokenV2}
            disabled={disabled}
            location="feed"
          />
        );
      }
      case 'url':
      default:
        return (
          <>
            {imageProps.src && (
              <Image
                alt={attachment.title || 'OpenGraph image'}
                className={cn(
                  'bg-[#efefef] object-cover dark:bg-[#101010]',
                  'aspect-opengraph w-full rounded-t-[12px]',
                )}
                {...imageProps}
                onError={() => setDidImageFailToLoad(true)}
              />
            )}
            <div
              className={cn(
                'flex w-full flex-col justify-center overflow-hidden rounded-b-[12px] border-t p-2 border-default',
              )}
            >
              <div className="text-xs text-muted">{attachment.domain}</div>
              <div className="line-clamp-2 font-semibold">{title}</div>
            </div>
          </>
        );
    }
  }, [
    attachment,
    disabled,
    embed,
    imageProps,
    setDidImageFailToLoad,
    skipWrapperStyles,
    title,
    type,
    variant,
  ]);
};

export { useOpenGraphBody };
