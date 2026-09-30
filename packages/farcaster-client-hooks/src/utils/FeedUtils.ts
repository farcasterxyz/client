import { ApiChannel } from 'farcaster-client-data';

import { formatShorthandNumber } from './NumberUtils';

export function getChannelDefaultFeed(channel: ApiChannel): string {
  return (channel.feeds || [])[0]?.type ?? 'default';
}

// Adds a word joiner so the slash stays with the name
export function renderChannelKey(key: string) {
  return `/\u2060${key}`;
}

export function formatChannelFollowerCount(followerCount: number) {
  return `${formatShorthandNumber(followerCount)} ${followerCount === 1 ? 'follower' : 'followers'}`;
}

export function formatChannelMemberCount(memberCount: number) {
  return `${formatShorthandNumber(memberCount)} ${memberCount === 1 ? 'member' : 'members'}`;
}
