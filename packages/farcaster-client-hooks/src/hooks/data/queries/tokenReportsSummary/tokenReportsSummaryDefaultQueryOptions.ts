import { NetworkMode } from '@tanstack/react-query';

const tokenReportsSummaryDefaultQueryOptions = {
  networkMode: 'offlineFirst' as NetworkMode,
  staleTime: 1000 * 60,
};

export { tokenReportsSummaryDefaultQueryOptions };
