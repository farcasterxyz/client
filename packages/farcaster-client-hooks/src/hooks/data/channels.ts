import { ApiChannel } from 'farcaster-client-data';

export const apiChannelKeyExtractor = (item: ApiChannel) => {
  return item.key;
};
