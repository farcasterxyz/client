import { ApiCastFeedItem, ApiChannel } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { Channel } from '~/components/channels/Channel';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type ChannelPageParams = {
  channelKey: string;
};

type ChannelPageProps = {
  channel: ApiChannel;
  feedItems: ApiCastFeedItem[];
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ChannelPageParams>,
): Promise<GetServerSidePropsResult<ChannelPageProps>> {
  const key = context.params?.channelKey || '';

  try {
    const channel = await fetchAndHandleError(async () => {
      const {
        data: {
          result: { channel },
        },
      } = await apiClient.getChannel({ key });
      return channel;
    });

    const {
      data: {
        result: { items: feedItems },
      },
    } = await apiClient.getOgFeedItems({ feedKey: channel.key });

    return {
      props: { channel, feedItems },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ChannelPage({ channel, feedItems }: ChannelPageProps) {
  return <Channel channel={channel} feedItems={feedItems} />;
}
