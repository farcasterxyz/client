import {
  Paragraph,
  RoundedRect,
  Skia,
  SkTypefaceFontProvider,
  TextAlign,
} from '@shopify/react-native-skia';
import { ApiOnchainTokenChartPeriod } from 'farcaster-client-data';
import { formatShorthandAmountWorklet } from 'farcaster-client-hooks';
import React from 'react';
import { Platform } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { formatBalanceWorklet } from '../../../../../utils';
import { colors, ensureBoundedX, sizes, TouchPoint } from '../utils';

const height = 36;

export const TokenLineChartAnnotationLabel = React.memo(
  ({
    symbol,
    period,
    touchPoint,
    chartColors,
    skiaFontManager: fontManager,
  }: {
    symbol: string;
    period: ApiOnchainTokenChartPeriod;
    touchPoint: SharedValue<TouchPoint | null>;
    chartColors: {
      textSecondary: string;
      backgroundSecondary: string;
      borderSecondary: string;
    };
    skiaFontManager: SkTypefaceFontProvider | null;
  }) => {
    const width = React.useMemo(() => {
      if (symbol.length > 5) {
        return 100;
      }
      return 80;
    }, [symbol]);

    const paragraphContent = useDerivedValue(() => {
      if (
        (Platform.OS === 'web' && !fontManager) ||
        !touchPoint.value?.annotation
      ) {
        return null;
      }

      const builder = fontManager
        ? Skia.ParagraphBuilder.Make(
            { textAlign: TextAlign.Center },
            fontManager,
          )
        : Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center });

      const isSelfSell = touchPoint.value.annotation.type === 'self-sell';

      const sign = isSelfSell ? '-' : '+';
      const quantity = formatShorthandAmountWorklet(
        touchPoint.value.annotation.quantity.float,
      );
      const valueUsd = formatBalanceWorklet(
        touchPoint.value.annotation.quantity.valueUsd,
      );

      builder.pushStyle({
        color: Skia.Color(isSelfSell ? colors.red : colors.green),
        fontSize: 12,
        fontStyle: {
          weight: 600,
        },
      });
      builder.addText(`${sign}${valueUsd}`);

      if (symbol.length > 5) {
        symbol = symbol.slice(0, 5) + '…';
      }

      builder.pushStyle({
        color: Skia.Color(chartColors.textSecondary),
        fontSize: 11,
        heightMultiplier: 1.25,
      });
      builder.addText(`\n${quantity} ${symbol}`);

      return builder.build();
    }, [fontManager, touchPoint, period, chartColors.textSecondary]);

    const boundedX = useDerivedValue(() => {
      if (!touchPoint.value?.annotation) {
        return 0;
      }

      return ensureBoundedX(touchPoint.value.x, width);
    }, [touchPoint, sizes.width, width]);

    const backgroundRect = useDerivedValue(() => {
      if (!touchPoint.value?.annotation) {
        // Return an invisible rectangle instead of null
        return Skia.RRectXY(
          { x: -1000, y: -1000, width: 0, height: 0 },
          0, // rx
          0, // ry
        );
      }

      const rect = Skia.RRectXY(
        {
          x: boundedX.value,
          y: sizes.height,
          width: width,
          height: height,
        },
        6, // rx
        6, // ry
      );

      return rect;
    }, [boundedX, width]);

    return (
      <>
        {/* Background */}
        <RoundedRect
          rect={backgroundRect}
          color={chartColors.backgroundSecondary}
        />

        {/* Border */}
        <RoundedRect
          rect={backgroundRect}
          color={chartColors.borderSecondary}
          style="stroke"
          strokeWidth={1}
        />

        {/* Text */}
        <Paragraph
          x={boundedX}
          y={sizes.height + 6}
          width={width}
          paragraph={paragraphContent}
        />
      </>
    );
  },
);
