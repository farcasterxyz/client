export type FeedSourceOn = 'home' | 'following';

export const getFeedSourceOn = (
  on: string | undefined,
): FeedSourceOn | undefined => {
  if (on === 'home' || on === 'following') {
    return on;
  }

  return undefined;
};
