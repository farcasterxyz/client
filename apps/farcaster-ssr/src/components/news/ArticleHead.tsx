import { ApiArticle } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getNewsArticleUrl } from '~/utils/newsUtils';

type ArticleHeadProps = {
  article: ApiArticle;
};

const ArticleHead: FC<ArticleHeadProps> = ({ article }) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return `${article.title} on Farcaster`;
  }, [article.title]);

  const description = useMemo(() => {
    return article.description;
  }, [article.description]);

  const url = useMemo(() => {
    return getNewsArticleUrl({ host, publicId: article.publicId });
  }, [article.publicId, host]);

  const imageUrl = useMemo(() => {
    return article.imageUrl;
  }, [article.imageUrl]);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      imageWidth={1200}
      imageHeight={630}
      title={title}
      type="article"
      twitterCard="summary_large_image"
      url={url}
    />
  );
};

ArticleHead.displayName = 'ArticleHead';

export { ArticleHead };
