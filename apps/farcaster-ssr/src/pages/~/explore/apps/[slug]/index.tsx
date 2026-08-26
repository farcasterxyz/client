import { ApiDiscoveryApp } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { App } from '~/components/apps/App';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type ExploreAppsAppPageParams = {
  slug: string;
};

type ExploreAppsAppPageProps = {
  app: ApiDiscoveryApp;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ExploreAppsAppPageParams>,
): Promise<GetServerSidePropsResult<ExploreAppsAppPageProps>> {
  const slug = context.params?.slug || '';

  try {
    const app = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { app },
        },
      } = await apiClient.getDiscoveryApp({ slug });
      return app;
    });

    return {
      props: { app },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ExploreAppsAppPage({ app }: ExploreAppsAppPageProps) {
  return <App app={app} />;
}
