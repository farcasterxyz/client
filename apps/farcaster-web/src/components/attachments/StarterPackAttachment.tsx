import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';
import { matchPath } from 'react-router-dom';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { LinkToStarterPack } from '~/components/links/LinkToStarterPack';
import { routes } from '~/constants/routes';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type StarterPackAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
};

const StarterPackAttachment: React.FC<StarterPackAttachmentProps> = ({
  og,
  disabled,
}) => {
  const { trackEvent } = useAnalytics();

  const params = React.useMemo(() => {
    const matched = matchPath(
      routes.starterPackWithUsername.path,
      new URL(og.url).pathname,
    );

    if (!matched || !matched.params.id || !matched.params.username) {
      return undefined;
    }

    return matched.params as {
      username: string;
      id: string;
    };
  }, [og.url]);

  return (
    <div className="relative flex w-full flex-col items-center rounded-lg border border-default">
      {!disabled &&
        (typeof params !== 'undefined' ? (
          <LinkToStarterPack
            className="absolute inset-0 subtle-hover-z"
            title={`Starter Pack / ${og.title}`}
            params={params}
            searchParams={{}}
          />
        ) : (
          <ExternalLink
            className="absolute inset-0 subtle-hover-z"
            href={og.url}
            title={og.url}
            onClick={() => {
              trackEvent(AnalyticsEvent.PressStarterPackOnFeed, {
                starterPackName: og.title || '',
              });
            }}
          />
        ))}
      <Image
        alt="Starter pack"
        className="max-h-[300px] w-full rounded-t-lg object-cover object-left-top"
        src={og.image || NFT_IMAGE_UNAVAILABLE_URL}
        style={{ aspectRatio: 1.91 }}
      />
      <div className="flex w-full flex-col rounded-b-lg border-t p-2 text-sm bg-app border-default text-default">
        <div className="font-semibold">{og.title}</div>
        <div className="text-faint">{og.description}</div>
      </div>
    </div>
  );
};

export { StarterPackAttachment };
