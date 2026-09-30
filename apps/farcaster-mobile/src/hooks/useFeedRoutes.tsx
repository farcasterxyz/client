import { ApiChannel } from 'farcaster-client-data';

export type FeedRoute = Pick<
  ApiChannel,
  'type' | 'key' | 'name' | 'imageUrl' | 'sectionRank'
> & {
  viewerContext?: {
    hasUnseenItems?: boolean;
    favoritePosition: number;
    activityRank?: number;
  };
};
