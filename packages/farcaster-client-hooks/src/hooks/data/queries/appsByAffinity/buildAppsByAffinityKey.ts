import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAppsByAffinityKey = ({
  fidOverride,
  limit,
}: {
  fidOverride?: number;
  limit?: number;
}) => compactQueryKey(['appsByAffinity', fidOverride, limit]);

export { buildAppsByAffinityKey };
