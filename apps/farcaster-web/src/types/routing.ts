import { routes } from '~/constants/routes';
import { ValueOf } from '~/utils/typeUtils';

export type Route = ValueOf<typeof routes>;
export type RouteName = keyof typeof routes;
export type Routes = typeof routes;

export type FollowsTab = 'following' | 'followers' | 'followersYouKnow';
export type ChannelFollowersTab =
  | 'channelFollowers'
  | 'channelFollowersYouKnow'
  | 'channelMembers';
export type ProfileTab =
  | 'casts'
  | 'assets'
  | 'snaps'
  | 'castsAndReplies'
  | 'likes'
  | 'starterPacks';
export type ExploreTab = 'forYou' | 'channels' | 'apps';
export type SearchTab = 'top' | 'channels' | 'users' | 'recent' | 'miniApps';
export type FeedTab = 'home' | 'following';
export type ChannelEditSection =
  | 'owner'
  | 'members'
  | 'banned-users'
  | 'invite'
  | 'details'
  | 'who-can-cast'
  | 'rituals';
export type StarterPackTab = 'users' | 'feed';

export type RightSideBarMode = 'normal' | 'collapsed';
