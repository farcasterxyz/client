import { ApiGetSyncChannel200Response } from 'farcaster-client-data';

const getLatestMessage = ({
  channelId,
  response,
}: {
  channelId: string;
  response: ApiGetSyncChannel200Response;
}) => {
  const message = response.result.messages[response.result.messages.length - 1];

  if (message) {
    return {
      ...message,
      channelId,
    };
  }

  return message;
};

export { getLatestMessage };
