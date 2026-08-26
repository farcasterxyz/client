import {
  Paragraph,
  Skia,
  SkTypefaceFontProvider,
  TextAlign,
} from '@shopify/react-native-skia';
import { ApiOnchainTokenLineChartPoint } from 'farcaster-client-data';
import React from 'react';
import { Platform } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { formatPriceWorklet } from '../../../../../utils';
import { ensureBoundedX, sizes } from '../utils';

const labelWidth = 90;

export const TokenLineChartMinLabel = React.memo(
  ({
    lineChart,
    animatedPoints,
    chartColors,
    fontManager,
  }: {
    lineChart: ApiOnchainTokenLineChartPoint[];
    animatedPoints: SharedValue<{ x: number; y: number }[]>;
    chartColors: { textSecondary: string };
    fontManager: SkTypefaceFontProvider | null;
  }) => {
    const { price, index } = React.useMemo(() => {
      let price = null;
      let index = null;
      for (let i = 0; i < lineChart.length; i++) {
        const point = lineChart[i];
        if (price === null || point.price < price) {
          price = point.price;
          index = i;
        }
      }

      return {
        price,
        index,
      };
    }, [lineChart]);

    const minPriceParagraphContent = useDerivedValue(() => {
      if ((Platform.OS === 'web' && !fontManager) || !price) {
        return null;
      }

      const builder = fontManager
        ? Skia.ParagraphBuilder.Make(
            { textAlign: TextAlign.Center },
            fontManager,
          )
        : Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center });

      builder.pushStyle({
        color: Skia.Color(chartColors.textSecondary),
        fontSize: 12,
      });

      const text = formatPriceWorklet(price);

      builder.addText(text);
      return builder.build();
    }, [fontManager, chartColors.textSecondary, lineChart]);

    const x = useDerivedValue(() => {
      if (!index || !animatedPoints.value[index]) {
        return 0;
      }

      return ensureBoundedX(animatedPoints.value[index].x, labelWidth);
    }, [animatedPoints, index]);

    return (
      <Paragraph
        x={x}
        y={sizes.height - 13}
        width={labelWidth}
        paragraph={minPriceParagraphContent}
      />
    );
  },
);
