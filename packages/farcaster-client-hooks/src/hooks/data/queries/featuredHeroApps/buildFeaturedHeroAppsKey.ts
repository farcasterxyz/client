import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildFeaturedHeroAppsKey = ({
  skip,
  limit,
}: {
  skip?: number;
  limit?: number;
} = {}) => compactQueryKey(['featuredHeroApps', skip, limit]);

export { buildFeaturedHeroAppsKey };
