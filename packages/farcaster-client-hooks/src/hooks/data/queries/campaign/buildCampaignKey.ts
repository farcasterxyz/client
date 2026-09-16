import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCampaignKey = ({ id }: { id: string }) =>
  compactQueryKey(['campaign', id]);

export { buildCampaignKey };
