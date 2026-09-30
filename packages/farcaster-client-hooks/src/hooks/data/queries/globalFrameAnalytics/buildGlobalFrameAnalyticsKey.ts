import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGlobalFrameAnalyticsKey = ({
  start,
  end,
}: {
  start?: string;
  end?: string;
}) => compactQueryKey(['globalFrameAnalytics', start, end]);

export { buildGlobalFrameAnalyticsKey };
