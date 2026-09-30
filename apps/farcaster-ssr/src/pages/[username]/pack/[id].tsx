import { ApiStarterPack } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { StarterPack } from '~/components/starterPack/StarterPack';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type PageParams = {
  id: string;
};

type StarterPackPageProps = {
  starterPackId: string;
  starterPack: ApiStarterPack;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<PageParams>,
): Promise<GetServerSidePropsResult<StarterPackPageProps>> {
  const id = context.params?.id || '';

  try {
    const starterPack = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { starterPack },
        },
      } = await apiClient.getStarterPack({ id });
      return starterPack;
    });

    return {
      props: { starterPackId: id, starterPack },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function UsernameStarterPackPage({
  starterPack,
  starterPackId,
}: StarterPackPageProps) {
  return (
    <StarterPack starterPack={starterPack} starterPackId={starterPackId} />
  );
}
