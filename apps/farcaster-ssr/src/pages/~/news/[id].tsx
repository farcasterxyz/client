import { ApiArticle } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { Article } from '~/components/news/Article';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type PageParams = {
  id: string;
};

type ArticlePageProps = {
  article: ApiArticle;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<PageParams>,
): Promise<GetServerSidePropsResult<ArticlePageProps>> {
  const id = context.params?.id || '';

  try {
    const article = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { article },
        },
      } = await apiClient.getArticle({ publicId: id });
      return article;
    });

    return {
      props: { article },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ArticlePage({ article }: ArticlePageProps) {
  return <Article article={article} />;
}
