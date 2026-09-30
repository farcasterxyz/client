import { ApiAMA } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { AMA } from '~/components/amas/AMA';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type AMAPageParams = {
  fname: string;
};

type AMAPageProps = {
  ama: ApiAMA;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<AMAPageParams>,
): Promise<GetServerSidePropsResult<AMAPageProps>> {
  const fname = context.params?.fname || '';

  try {
    const ama = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { ama },
        },
      } = await apiClient.getAMA({ fname });
      return ama;
    });

    return {
      props: { ama },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function AMAPage({ ama }: AMAPageProps) {
  return <AMA ama={ama} />;
}
