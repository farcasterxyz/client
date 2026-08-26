import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildEngagementRingCandidatesKey = ({ fid }: { fid?: number }) =>
  compactQueryKey(['engagementRingCandidates', fid]);

export { buildEngagementRingCandidatesKey };
