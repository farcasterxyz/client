import { ApiArticle } from 'farcaster-client-data';
import { FC } from 'react';

import { ArticleHead } from './ArticleHead';

type ArticleProps = {
  article: ApiArticle;
};

const Article: FC<ArticleProps> = ({ article }: ArticleProps) => {
  return (
    <>
      <ArticleHead article={article} />
      <div>{article.title}</div>
      <div>{article.description}</div>
    </>
  );
};

Article.displayName = 'Article';

export { Article };
