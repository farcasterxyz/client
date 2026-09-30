import {
  ApiCast,
  ApiChannel,
  ApiChannelUser,
  ApiTrendingTopic,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';

export const castKeyExtractor = (cast: ApiCast) => cast.hash;

export const channelKeyExtractor = (channel: ApiChannel) => channel.key;

export const userKeyExtractor = (user: ApiUser | ApiUserMinimal) =>
  String(user.fid);

export const trendingTopicKeyExtractor = (trendingTopics: ApiTrendingTopic[]) =>
  String(trendingTopics.map((x) => x.id).join('|'));

export const channelUsersKeyExtractor = (channelUser: ApiChannelUser) =>
  channelUser.user.fid.toString();
