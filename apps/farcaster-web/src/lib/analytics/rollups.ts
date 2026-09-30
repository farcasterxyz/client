import { ApiAnalyticsRollup } from 'farcaster-client-data';

export type ChartData = Record<string, string | number>;

export const rollupTotalsToChartData = (
  rollup: ApiAnalyticsRollup,
): ChartData => {
  return rollup.totals.reduce(
    (acc, measure) => {
      acc[measure.name] = measure.value;
      return acc;
    },
    {} as Record<string, number>,
  );
};

export const rollupBreakdownToChartData = (
  rollup: ApiAnalyticsRollup,
): ChartData[] => {
  return (
    rollup.breakdown?.map((item) => {
      const result: ChartData = {};

      for (const slice of item.slices) {
        result[slice.dimension] = slice.values.join(',');
      }

      for (const measure of item.measures) {
        result[measure.name] = measure.value;
      }

      return result;
    }) ?? []
  );
};
