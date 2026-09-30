import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildImageAspectRatiosCacheKey = ({ imageUrl }: { imageUrl: string }) =>
  compactQueryKey(['imageAspectRatiosCache', imageUrl]);

export { buildImageAspectRatiosCacheKey };
