import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserChannelsForCategoryKey = ({
  fid,
  category,
}: {
  fid?: number;
  category: string;
}) => compactQueryKey(['userChannelsForCategory', category, fid]);

export { buildUserChannelsForCategoryKey };
