import cn from 'classnames';
import {
  ApiCast,
  ApiCastUrlEmbed,
  ApiOpenGraphMetadata,
} from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React from 'react';

import { DeprecatedFrameBanner } from '~/components/attachments/DeprecatedFrameBanner';
import { ExternalLink } from '~/components/links/ExternalLink';
import { useOpenGraphAsset } from '~/hooks/openGraph/useOpenGraphAsset';
import { useOpenGraphBody } from '~/hooks/openGraph/useOpenGraphBody';
import { useOpenGraphTitle } from '~/hooks/openGraph/useOpenGraphTitle';
import { useOpenGraphType } from '~/hooks/openGraph/useOpenGraphType';
import { getOpenGraphImageUrl } from '~/utils/openGraphUtils';

type RichOpenGraphAttachmentProps = {
  cast: ApiCast;
  embed: ApiCastUrlEmbed;
  attachment: ApiOpenGraphMetadata;
  disabled?: boolean;
  skipWrapperStyles?: boolean;
  variant?: 'default' | 'direct-cast';
};

const RichOpenGraphCastAttachment: React.FC<RichOpenGraphAttachmentProps> = ({
  cast: _cast,
  embed,
  attachment,
  disabled = false,
  skipWrapperStyles = false,
  variant = 'default',
}) => {
  const [didImageFailToLoad, setDidImageFailToLoad] = React.useState(false);

  const type = useOpenGraphType({
    urlEmbed: embed,
  });

  const title = useOpenGraphTitle({ attachment });

  const trackCastClick = useTrackCastClick();

  const { imageProps } = useOpenGraphAsset({
    attachment,
    didImageFailToLoad,
  });

  const body = useOpenGraphBody({
    embed,
    attachment,
    imageProps,
    setDidImageFailToLoad,
    title,
    type,
    disabled,
    skipWrapperStyles,
    variant,
  });

  const imageUrl = React.useMemo(
    () => getOpenGraphImageUrl({ attachment }),
    [attachment],
  );

  React.useLayoutEffect(() => {
    setDidImageFailToLoad(false);
    if (!imageUrl) {
      return undefined;
    }

    // Let's go ahead and attempt a prefetch for this remote URL and
    // depending we will fallback to different render styles for the OG.
    const image = new Image();
    let isCurrent = true;

    image.onerror = () => {
      if (isCurrent) {
        setDidImageFailToLoad(true);
      }
    };

    image.src = imageUrl;

    return () => {
      isCurrent = false;
      image.onerror = null;
    };
  }, [imageUrl]);

  if (disabled) {
    return (
      <div
        className={cn(
          `relative mt-2 flex cursor-default rounded-lg text-sm text-inherit bg-app`,
          !didImageFailToLoad
            ? 'w-full flex-col'
            : type === 'url'
              ? 'w-full flex-row border p-2 border-default'
              : 'w-full flex-row',
        )}
      >
        {body}
      </div>
    );
  }

  // These attachment types come with native in-app navigation to cast convos hence
  // we are shortcutting the OG rendering.
  if (
    type === 'channel-attachment' ||
    type === 'explore-channels' ||
    type === 'app-attachment' ||
    type === 'warpcast-settings' ||
    type === 'starter-pack' ||
    type === 'contract-address' ||
    type === 'rich-warpcast-attachment' ||
    type === 'quote-tweet' ||
    type === 'token' ||
    type === 'news'
  ) {
    return (
      <div className="relative">
        {!disabled && type !== 'token' && type !== 'news' && (
          <ExternalLink
            className="absolute inset-0 subtle-hover-z"
            href={attachment.url}
            title={attachment.url}
            onClick={() => {
              trackCastClick({ type: CastClickType.ExtLink });
            }}
          />
        )}
        {body}
      </div>
    );
  }

  if (
    typeof attachment.frame !== 'undefined' &&
    typeof attachment.domain !== 'undefined' &&
    typeof attachment.frameEmbedNext === 'undefined'
  ) {
    return <DeprecatedFrameBanner />;
  }

  return null;
};

RichOpenGraphCastAttachment.displayName = 'RichOpenGraphCastAttachment';

export { RichOpenGraphCastAttachment };
