import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildShareViaDcKey = ({
  maxTargets,
  fresh,
  overrideFid,
}: {
  maxTargets?: number;
  fresh?: boolean;
  overrideFid?: number;
}) => compactQueryKey(['shareViaDc', maxTargets, fresh, overrideFid]);

export { buildShareViaDcKey };
