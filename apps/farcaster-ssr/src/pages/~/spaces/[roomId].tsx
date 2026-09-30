import { ApiAudioRoom } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { Space } from '~/components/spaces/Space';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type SpacePageParams = {
  roomId: string;
};

type SpacePageProps = {
  room: ApiAudioRoom;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<SpacePageParams>,
): Promise<GetServerSidePropsResult<SpacePageProps>> {
  const roomId = context.params?.roomId || '';

  if (!roomId) {
    return { notFound: true };
  }

  try {
    const room = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { room },
        },
      } = await apiClient.getAudioRoom({ roomId });
      return room as ApiAudioRoom;
    });

    return {
      props: { room },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function SpacePage({ room }: SpacePageProps) {
  return <Space room={room} />;
}
