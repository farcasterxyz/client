import { NavigationContext } from '@react-navigation/native';
import subDays from 'date-fns/subDays';
import subHours from 'date-fns/subHours';
import subMinutes from 'date-fns/subMinutes';
import subWeeks from 'date-fns/subWeeks';
import {
  ApiChain,
  ApiOnchainTokenCandlestickChart,
  ApiOnchainTokenCandlestickChartPoint,
  ApiOnchainTokenChartAnnotation,
  ApiOnchainTokenChartPeriod,
  ApiOnchainTokenChartResolution,
  ApiOnchainTokenLineChart,
  ApiOnchainTokenLineChartPoint,
  ApiTokenLink,
  ApiWebSocketTokenChartUpdateData,
} from 'farcaster-client-data';
import {
  MILLIS_PER_SECOND,
  useFarcasterApiClient,
  useMergeIntoGloballyCachedTokenCandlestickChart,
  useMergeIntoGloballyCachedTokenLineChart,
  useOnchainTokenCandlestickChart,
  useOnchainTokenLineChart,
  usePrefetchOnchainTokenCandlestickChart,
  usePrefetchOnchainTokenLineChart,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { defaultTokenChartPeriod } from '../../../../constants/';
import { useCachedOrQueryToken } from '../../../../hooks';
import { useOnTokenChartUpdateEffect } from '../../../../hooks/charts/useOnTokenChartUpdateEffect';
import {
  useCandlestickPeriodPreference,
  useChartTypePreference,
} from '../../../../hooks/useWalletPreferences';
import {
  getAnnotationPeriod,
  getCandlestickResolution,
  getCandleStickTimeRange,
} from '../../../../utils/WalletUtils';
import { TouchPoint } from './utils';

type TokenChartContextType = {
  chartType: 'candlestick' | 'line';
  setChartType: (chartType: 'candlestick' | 'line') => void;
  lineChartPeriod: ApiOnchainTokenChartPeriod;
  candlestickPeriod: ApiOnchainTokenChartPeriod;
  setPeriod: (period: ApiOnchainTokenChartPeriod) => void;
  onPreSetPeriod: (period: ApiOnchainTokenChartPeriod) => void;
  chain: ApiChain;
  ca: string;
  token?: ApiTokenLink;
  lineChart: ApiOnchainTokenLineChartPoint[];
  candlestickChart: ApiOnchainTokenCandlestickChartPoint[];
  annotations: ApiOnchainTokenChartAnnotation[];
  isLoading: boolean;
  transitioningProgress: SharedValue<number>;
  touchPoint: SharedValue<TouchPoint | null>;
  activeCandleData: SharedValue<ApiOnchainTokenCandlestickChartPoint | null>;
  loadMoreHistoricalData: (
    forceLoad?: boolean,
  ) => Promise<{ addedCount: number; success: boolean }>;
  isLoadingMore: boolean;
  hasMoreHistoricalData: boolean;
};

const TokenChartContext = React.createContext<
  TokenChartContextType | undefined
>(undefined);

const DEFAULT_TRANSITIONING_DURATION = 100;

export function TokenChartProvider({
  fid,
  chain,
  ca,
  children,
}: {
  fid: number | undefined;
  chain: ApiChain;
  ca: string;
  children: React.ReactNode;
}) {
  const [chartTypePreference, setChartTypePreference] =
    useChartTypePreference();
  const [candlestickPeriodPreference, setCandlestickPeriodPreference] =
    useCandlestickPeriodPreference();
  const mergeIntoGloballyCachedTokenLineChart =
    useMergeIntoGloballyCachedTokenLineChart();
  const mergeIntoGloballyCachedTokenCandlestickChart =
    useMergeIntoGloballyCachedTokenCandlestickChart();

  const [chartType, setChartTypeState] = React.useState<'candlestick' | 'line'>(
    () => {
      if (chartTypePreference === 'candlestick') {
        return 'candlestick';
      }
      return 'line';
    },
  );
  const [lineChartPeriod, setLineChartPeriod] =
    React.useState<ApiOnchainTokenChartPeriod>(defaultTokenChartPeriod);
  const [candlestickPeriod, setCandlestickPeriod] =
    React.useState<ApiOnchainTokenChartPeriod>(
      (candlestickPeriodPreference as ApiOnchainTokenChartPeriod) || 'cs_5m',
    );
  const navigation = React.useContext(NavigationContext);
  const [isFocused, setIsFocused] = React.useState<boolean>(() => {
    if (!navigation?.isFocused) {
      return true;
    }
    return navigation.isFocused();
  });
  const transitioningProgress = useSharedValue(0);
  const transitionStartTime = useSharedValue<number | null>(null);

  const [historicalDataRanges, setHistoricalDataRanges] = React.useState<
    Array<{
      from: number;
      to: number;
      data: ApiOnchainTokenCandlestickChartPoint[];
    }>
  >([]);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMoreHistoricalData, setHasMoreHistoricalData] =
    React.useState(true);

  const setChartType = React.useCallback(
    (type: 'candlestick' | 'line') => {
      setChartTypeState(type);
      setChartTypePreference(type);
    },
    [setChartTypePreference],
  );

  const setPeriod = React.useCallback(
    (p: ApiOnchainTokenChartPeriod) => {
      // Save candlestick period preference
      if (p.startsWith('cs_')) {
        setCandlestickPeriodPreference(p);
        transitioningProgress.value = 0;
        transitionStartTime.value = Date.now();
        // Reset pagination state when changing period
        setHistoricalDataRanges([]);
        setHasMoreHistoricalData(true);
        setCandlestickPeriod(p);
      } else {
        setLineChartPeriod(p);
      }
    },
    [
      setCandlestickPeriodPreference,
      transitioningProgress,
      transitionStartTime,
    ],
  );

  const candlestickResolution = React.useMemo(
    (): ApiOnchainTokenChartResolution =>
      getCandlestickResolution(candlestickPeriod),
    [candlestickPeriod],
  );

  const latestCandleStickTimeUpdate = useRef<number | null>(null);

  // Memoize time range to prevent infinite loops - only recalculate when period or chartType changes
  const timeRange = React.useMemo(() => {
    if (chartType !== 'candlestick') {
      // Return a stable default when not in candlestick mode
      return { from: 0, to: 0, countback: 0 };
    }

    return getCandleStickTimeRange(
      candlestickPeriod,
      latestCandleStickTimeUpdate.current,
    );
  }, [candlestickPeriod, chartType]);
  const onDataUpdate = useCallback(
    ({
      data,
    }: {
      chain: ApiChain;
      ca: string;
      data: ApiWebSocketTokenChartUpdateData[];
    }) => {
      for (const update of data) {
        if (
          update.period.startsWith('cs_') &&
          candlestickPeriod === update.period
        ) {
          mergeIntoGloballyCachedTokenCandlestickChart({
            chain,
            ca,
            res: candlestickResolution,
            from: timeRange.from,
            to: timeRange.to,
            countback: timeRange.countback,
            fid,
            updates: update,
          });
        } else if (!update.period.startsWith('cs_')) {
          mergeIntoGloballyCachedTokenLineChart({
            chain,
            ca,
            updates: update,
            fid,
          });
        }
      }
    },
    [
      mergeIntoGloballyCachedTokenCandlestickChart,
      chain,
      ca,
      fid,
      mergeIntoGloballyCachedTokenLineChart,
      candlestickResolution,
      timeRange.from,
      timeRange.to,
      timeRange.countback,
      candlestickPeriod,
    ],
  );
  useOnTokenChartUpdateEffect({
    chain,
    ca,
    onUpdate: onDataUpdate,
  });

  const prefetchOnchainTokenLineChart = usePrefetchOnchainTokenLineChart();
  const { prefetchOnchainTokenCandlestickChart } =
    usePrefetchOnchainTokenCandlestickChart();

  useEffect(() => {
    if (chartType === 'candlestick') {
      transitioningProgress.value = withTiming(1, {
        duration: DEFAULT_TRANSITIONING_DURATION,
      });
    }
  }, [chartType, transitioningProgress]);

  const onPreSetPeriod = React.useCallback(
    (p: ApiOnchainTokenChartPeriod) => {
      if (chartType === 'line') {
        const annotationPeriod = getAnnotationPeriod({
          chartType,
          lineChartPeriod: p,
          candlestickPeriod,
        });
        prefetchOnchainTokenLineChart({
          chain,
          ca,
          fid,
          period: annotationPeriod,
        });
      } else {
        latestCandleStickTimeUpdate.current = Date.now();
        const prefetchTimeRange = getCandleStickTimeRange(
          p,
          latestCandleStickTimeUpdate.current,
        );
        const res = getCandlestickResolution(p);
        prefetchOnchainTokenCandlestickChart({
          chain,
          ca,
          res,
          from: prefetchTimeRange.from,
          to: prefetchTimeRange.to,
          countback: prefetchTimeRange.countback,
        });
      }
    },
    [
      chartType,
      prefetchOnchainTokenLineChart,
      chain,
      ca,
      fid,
      candlestickPeriod,
      prefetchOnchainTokenCandlestickChart,
    ],
  );

  React.useEffect(() => {
    if (!navigation?.addListener) {
      setIsFocused(true);
      return;
    }

    setIsFocused(navigation.isFocused?.() ?? true);

    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsFocused(true);
    });
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsFocused(false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const touchPoint = useSharedValue<TouchPoint | null>(null);
  const activeCandleData =
    useSharedValue<ApiOnchainTokenCandlestickChartPoint | null>(null);

  const { data: token } = useCachedOrQueryToken({
    chain,
    ca,
    query: {
      staleTime: 15 * MILLIS_PER_SECOND,
      refetchInterval: 15 * MILLIS_PER_SECOND,
    },
  });

  // Map candlestick periods to line chart periods for annotations
  // Use wider time ranges to ensure we capture all annotations in the candlestick view
  const annotationPeriod = React.useMemo(
    (): ApiOnchainTokenChartPeriod =>
      getAnnotationPeriod({
        chartType,
        lineChartPeriod,
        candlestickPeriod,
      }),
    [lineChartPeriod, candlestickPeriod, chartType],
  );

  const { data: lineChartData, isLoading: isLineChartLoading } =
    useOnchainTokenLineChart({
      params: {
        fid,
        chain,
        ca,
        period: annotationPeriod,
      },
      query: {
        // Always fetch to get annotations
        staleTime: 15 * MILLIS_PER_SECOND,
        refetchInterval:
          chartType !== 'line' ||
          lineChartPeriod === 'h6' ||
          lineChartPeriod === 'h1'
            ? 15 * MILLIS_PER_SECOND
            : undefined,
        enabled: chartType === 'line',
      },
    });

  const { data: candlestickChartData, isLoading: isCandlestickChartLoading } =
    useOnchainTokenCandlestickChart({
      params: {
        chain,
        ca,
        res: candlestickResolution,
        from: timeRange.from,
        to: timeRange.to,
        countback: timeRange.countback,
      },
      query: {
        enabled: chartType === 'candlestick',
        staleTime: 15 * MILLIS_PER_SECOND,
        refetchInterval: 15 * MILLIS_PER_SECOND,
      },
    });

  const lineCharDatatRef = React.useRef<ApiOnchainTokenLineChart>({
    points: [],
    annotations: [],
  });

  const candlestickChartDataRef = React.useRef<ApiOnchainTokenCandlestickChart>(
    {
      points: [],
      annotations: [],
    },
  );

  const { lineChart, candlestickChart, annotations } = React.useMemo(() => {
    // Process line chart data
    let lineData = lineChartData?.chart;
    if (!lineData || isLineChartLoading) {
      lineData = lineCharDatatRef.current;
    } else {
      lineCharDatatRef.current = lineData;
    }

    const lineChart = [...lineData.points]
      .filter((point) => point)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!isFocused) {
      return {
        lineChart: [],
        candlestickChart: [],
        annotations: [],
      };
    }

    // Process candlestick chart data - merge main data with historical paginated data
    let candlestickData = candlestickChartData?.chart;

    // When chart is undefined (no data), use empty ref to show empty state
    if (!candlestickData || isCandlestickChartLoading) {
      candlestickData = candlestickChartDataRef.current;
    } else {
      candlestickChartDataRef.current = candlestickData;
    }

    // Merge main data with all historical data ranges
    const allCandlestickPoints: ApiOnchainTokenCandlestickChartPoint[] = [
      ...candlestickData.points,
    ];

    for (const range of historicalDataRanges) {
      allCandlestickPoints.push(...range.data);
    }

    // Deduplicate by timestamp (in case of overlaps) and sort
    const uniquePoints = new Map<
      number,
      ApiOnchainTokenCandlestickChartPoint
    >();
    for (const point of allCandlestickPoints) {
      if (point) {
        uniquePoints.set(point.timestamp, point);
      }
    }

    const candlestickChart = Array.from(uniquePoints.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    // Process annotations based on chart type
    let finalAnnotations: ApiOnchainTokenChartAnnotation[] = [];

    if (chartType === 'candlestick') {
      // For candlestick charts, use annotations from candlestick data
      // Map annotations to the nearest candlestick timestamp
      const annotationsArray: ApiOnchainTokenChartAnnotation[] = [];

      for (const annotation of candlestickData.annotations) {
        if (candlestickChart.length === 0) {
          continue;
        }

        let nearest = candlestickChart[0];
        let minDist = Math.abs(nearest.timestamp - annotation.timestamp);
        for (let i = 1; i < candlestickChart.length; i++) {
          const dist = Math.abs(
            candlestickChart[i].timestamp - annotation.timestamp,
          );
          if (dist < minDist) {
            nearest = candlestickChart[i];
            minDist = dist;
          }
        }

        annotationsArray.push({
          ...annotation,
          timestamp: nearest.timestamp,
        });
      }

      finalAnnotations = annotationsArray.sort(
        (a, b) => a.timestamp - b.timestamp,
      );
    } else {
      // For line charts, use annotations from line chart data
      const annotationsArray: ApiOnchainTokenChartAnnotation[] = [];

      for (const annotation of lineData.annotations) {
        if (lineChart.length === 0) {
          continue;
        }

        let nearest = lineChart[0];
        let minDist = Math.abs(nearest.timestamp - annotation.timestamp);
        for (let i = 1; i < lineChart.length; i++) {
          const dist = Math.abs(lineChart[i].timestamp - annotation.timestamp);
          if (dist < minDist) {
            nearest = lineChart[i];
            minDist = dist;
          }
        }

        annotationsArray.push({
          ...annotation,
          timestamp: nearest.timestamp,
        });
      }

      finalAnnotations = annotationsArray.sort(
        (a, b) => a.timestamp - b.timestamp,
      );
    }

    return {
      lineChart,
      candlestickChart,
      annotations: finalAnnotations,
    };
  }, [
    chartType,
    lineChartData,
    candlestickChartData,
    isLineChartLoading,
    isCandlestickChartLoading,
    isFocused,
    historicalDataRanges,
  ]);

  // Load more historical candlestick data for pagination
  const { apiClient } = useFarcasterApiClient();

  const loadMoreHistoricalData = React.useCallback(
    async (forceLoad = false) => {
      if (
        !forceLoad &&
        (!hasMoreHistoricalData || isLoadingMore || chartType !== 'candlestick')
      ) {
        return { addedCount: 0, success: false };
      }

      if (candlestickChart.length === 0) {
        return { addedCount: 0, success: false };
      }

      setIsLoadingMore(true);

      try {
        // Get the oldest candlestick's timestamp
        const oldestCandle = candlestickChart[0];
        const oldestTimestamp = oldestCandle.timestamp;
        let fetchCount: number;
        let fromTimestamp: number;
        const toTimestamp = oldestTimestamp;
        const toDate = new Date(toTimestamp);

        switch (candlestickPeriod) {
          case 'cs_1m':
            fetchCount = 200; // Fetch 200 more 1-minute candles (~3.3 hours)
            fromTimestamp = subMinutes(toDate, fetchCount).getTime();
            break;
          case 'cs_5m':
            fetchCount = 200; // Fetch 200 more 5-minute candles (~16.7 hours)
            fromTimestamp = subMinutes(toDate, fetchCount * 5).getTime();
            break;
          case 'cs_15m':
            fetchCount = 200; // Fetch 200 more 15-minute candles (~2 days)
            fromTimestamp = subMinutes(toDate, fetchCount * 15).getTime();
            break;
          case 'cs_1h':
            fetchCount = 200; // Fetch 200 more 1-hour candles (~8.3 days)
            fromTimestamp = subHours(toDate, fetchCount).getTime();
            break;
          case 'cs_4h':
            fetchCount = 200; // Fetch 200 more 4-hour candles (~33 days)
            fromTimestamp = subHours(toDate, fetchCount * 4).getTime();
            break;
          case 'cs_1d':
            fetchCount = 200; // Fetch 200 more daily candles (~6.7 months)
            fromTimestamp = subDays(toDate, fetchCount).getTime();
            break;
          case 'cs_1w':
            fetchCount = 200; // Fetch 200 more weekly candles (~3.8 years)
            fromTimestamp = subWeeks(toDate, fetchCount).getTime();
            break;
          default:
            setIsLoadingMore(false);
            return { addedCount: 0, success: false };
        }

        const requestParams = {
          chain,
          ca,
          res: candlestickResolution,
          from: fromTimestamp,
          to: toTimestamp,
          countback: fetchCount,
        };

        const response =
          await apiClient.getOnchainTokenCandlestickChart(requestParams);
        const newPoints = response.data.result.chart?.points || [];

        if (newPoints.length === 0) {
          // No more historical data available
          setHasMoreHistoricalData(false);
          setIsLoadingMore(false);
          return { addedCount: 0, success: true };
        }

        // Calculate actual from/to range from received data
        const sortedNewPoints = [...newPoints].sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        const actualFrom = sortedNewPoints[0].timestamp;
        const actualTo = sortedNewPoints[sortedNewPoints.length - 1].timestamp;

        // Add to historical ranges
        setHistoricalDataRanges((prev) => [
          ...prev,
          { from: actualFrom, to: actualTo, data: newPoints },
        ]);

        setIsLoadingMore(false);
        return { addedCount: newPoints.length, success: true };
      } catch (error) {
        setIsLoadingMore(false);
        return { addedCount: 0, success: false };
      }
    },
    [
      hasMoreHistoricalData,
      isLoadingMore,
      chartType,
      candlestickPeriod,
      candlestickChart,
      apiClient,
      chain,
      ca,
      candlestickResolution,
    ],
  );

  // End transition after data loads + 2 seconds
  React.useEffect(() => {
    if (
      transitioningProgress.value !== 1 &&
      transitionStartTime.value &&
      candlestickChart.length > 0 &&
      !isCandlestickChartLoading
    ) {
      // const elapsedTime = Date.now() - transitionStartTime.value;
      transitioningProgress.value = withTiming(1, {
        duration: DEFAULT_TRANSITIONING_DURATION,
      });
    }
  }, [
    transitionStartTime,
    candlestickChart.length,
    isCandlestickChartLoading,
    transitioningProgress,
  ]);

  const isLoading = React.useMemo(() => {
    return (
      (isLineChartLoading && lineChart.length === 0) ||
      (isCandlestickChartLoading && candlestickChart.length === 0) ||
      !isFocused
    );
  }, [
    isLineChartLoading,
    lineChart.length,
    isCandlestickChartLoading,
    candlestickChart.length,
    isFocused,
  ]);

  const contextValue = React.useMemo(
    () => ({
      chain,
      ca,
      chartType,
      setChartType,
      lineChartPeriod,
      candlestickPeriod,
      setPeriod,
      onPreSetPeriod,
      lineChart,
      candlestickChart,
      annotations,
      token,
      isLoading,
      transitioningProgress,
      touchPoint,
      activeCandleData,
      loadMoreHistoricalData,
      isLoadingMore,
      hasMoreHistoricalData,
    }),
    [
      chain,
      ca,
      chartType,
      setChartType,
      lineChartPeriod,
      candlestickPeriod,
      setPeriod,
      onPreSetPeriod,
      lineChart,
      candlestickChart,
      annotations,
      token,
      isLoading,
      touchPoint,
      activeCandleData,
      loadMoreHistoricalData,
      isLoadingMore,
      hasMoreHistoricalData,
      transitioningProgress,
    ],
  );

  return (
    <TokenChartContext.Provider value={contextValue}>
      {children}
    </TokenChartContext.Provider>
  );
}

export function useTokenChart() {
  const context = React.useContext(TokenChartContext);
  if (context === undefined) {
    throw new Error('useTokenChart must be used within a TokenChartProvider');
  }
  return context;
}
