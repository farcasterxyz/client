import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';
import { matchPath } from 'react-router-dom';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { LinkToArticle } from '~/components/links/LinkToArticle';
import { routes } from '~/constants/routes';

type ArticleAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
};

const ArticleAttachment: React.FC<ArticleAttachmentProps> = ({
  og,
  disabled,
}) => {
  const params = React.useMemo(() => {
    const matched = matchPath(routes.news.path, new URL(og.url).pathname);

    if (!matched || !matched.params.id || !matched.params.id) {
      return undefined;
    }

    return matched.params as {
      id: string;
    };
  }, [og.url]);

  return (
    <div className="relative flex w-full flex-col items-center rounded-lg border border-default">
      {!disabled && typeof params !== 'undefined' && (
        <LinkToArticle
          className="absolute inset-0 subtle-hover-z"
          title={`${og.title} / News`}
          params={params}
          searchParams={{}}
        />
      )}
      <Image
        alt="Article"
        className="max-h-[300px] w-full rounded-t-lg object-cover object-left-top"
        src={og.image || NFT_IMAGE_UNAVAILABLE_URL}
        style={{ aspectRatio: 1.91 }}
      />
      <div className="flex w-full flex-col rounded-b-lg border-t p-2 text-sm bg-app border-default text-default">
        <div className="font-semibold">{og.title}</div>
        <div className="line-clamp-2 text-muted">{og.description}</div>
      </div>
    </div>
  );
};

export { ArticleAttachment };
