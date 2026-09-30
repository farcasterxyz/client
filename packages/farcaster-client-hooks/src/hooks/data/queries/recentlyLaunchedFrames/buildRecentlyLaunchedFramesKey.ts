import { compactQueryKey } from '../../../../utils';

export const buildRecentlyLaunchedFramesKey = ({
  filterToNotAdded,
}: {
  filterToNotAdded?: boolean;
}) => compactQueryKey(['recentlyLaunchedFrames', filterToNotAdded]);
