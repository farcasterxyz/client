import { isUsdc } from 'farcaster-client-data';
import React from 'react';

import { useTheme } from '../../../../../contexts/ThemeContext';
import { convertHexToRGBA } from '../../../../../theme';
import { useTokenChart } from '../TokenChartProvider';
import { colors } from '../utils';

export type TokenLineChartColors = {
  bgChartAreaStart: string;
  bgChartAreaEnd: string;
  touchLinePath: string;
  outerCircle: string;
  innerCircle: string;
  overlay: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  backgroundSecondary: string;
  borderSecondary: string;
};

export function useTokenLineChartColors() {
  const t = useTheme();
  const { ca, lineChart, token } = useTokenChart();

  const firstPrice = lineChart.length > 0 ? (lineChart[0]?.price ?? 0) : 0;
  const lastPrice =
    lineChart.length > 0 ? (lineChart[lineChart.length - 1]?.price ?? 0) : 0;
  const lineChartLength = lineChart.length;

  const color = React.useMemo(() => {
    if (isUsdc(ca)) {
      return colors.blue;
    }

    const delta =
      lineChartLength > 0 ? lastPrice - firstPrice : token?.priceChangePct?.h6;
    if (delta === undefined) {
      return t.colors.background.default;
    }

    if (delta < 0) {
      return colors.red;
    }

    return colors.green;
  }, [
    firstPrice,
    lastPrice,
    lineChartLength,
    ca,
    t.colors.background.default,
    token,
  ]);

  const lineChartColors = React.useMemo(() => {
    return {
      bgChartAreaStart: convertHexToRGBA(color, 0.2),
      bgChartAreaEnd: convertHexToRGBA(color, 0),
      touchLinePath: color,
      outerCircle: color,
      innerCircle: color,
      overlay: convertHexToRGBA(t.colors.background.default, 0.8),
      background: t.colors.background.default,
      textPrimary: t.colors.text.primary,
      textSecondary: t.colors.text.secondary,
      textTertiary: t.colors.text.tertiary,
      backgroundSecondary: t.colors.background.secondary,
      borderSecondary: t.colors.border.secondary,
    };
  }, [
    color,
    t.colors.background.default,
    t.colors.background.secondary,
    t.colors.border.secondary,
    t.colors.text.primary,
    t.colors.text.secondary,
    t.colors.text.tertiary,
  ]);

  return lineChartColors;
}
