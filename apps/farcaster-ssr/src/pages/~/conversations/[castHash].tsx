import { ApiCast } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { Conversation } from '~/components/conversations/Conversation';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';
import { getHost } from '~/utils/requestUtils';

type ConversationPageParams = {
  castHash: string;
};

type ConversationPageProps = {
  casts: ApiCast[];
  focusedCast: ApiCast;
  host: string | undefined;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ConversationPageParams>,
): Promise<GetServerSidePropsResult<ConversationPageProps>> {
  const host = getHost(context);
  const castHash = context.params?.castHash || '';

  try {
    const casts = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { casts },
        },
      } = await apiClient.getThread({ castHash, limit: 20 });
      return casts;
    });

    const focusedCast =
      casts.find((cast) => cast.hash === castHash) || casts[0]!;

    return {
      props: { casts, focusedCast, host },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ConversationPage({
  casts,
  focusedCast,
}: ConversationPageProps) {
  return <Conversation casts={casts} focusedCast={focusedCast} />;
}
