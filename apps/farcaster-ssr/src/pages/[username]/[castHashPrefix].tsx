import { ApiCast } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { Conversation } from '~/components/conversations/Conversation';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type ConversationPageParams = {
  castHashPrefix: string;
  username: string;
};

type ConversationPageProps = {
  cast: ApiCast;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ConversationPageParams>,
): Promise<GetServerSidePropsResult<ConversationPageProps>> {
  const username = context.params?.username || '';
  const castHashPrefix = context.params?.castHashPrefix || '';

  // Skip API call for invalid paths
  if (username === '~' && !castHashPrefix?.startsWith('0x')) {
    return { notFound: true };
  }

  try {
    const cast = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { cast },
        },
      } = await apiClient.getUserCast({
        hashPrefix: castHashPrefix,
        username,
        scope: 'pages.castHashPrefix',
        userAgent: context.req.headers['user-agent'],
      });
      if (!cast || !cast.author) {
        throw new HttpError(404, 'Cast not found');
      }
      return cast;
    });

    return {
      props: { cast },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ConversationPage({ cast }: ConversationPageProps) {
  return <Conversation casts={[cast]} focusedCast={cast} />;
}
