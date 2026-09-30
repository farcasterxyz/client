import {
  Group,
  Paragraph,
  Path,
  Skia,
  SkTypefaceFontProvider,
  TextAlign,
} from '@shopify/react-native-skia';
import {
  ApiOnchainTokenChartAnnotation,
  ApiOnchainTokenLineChartPoint,
} from 'farcaster-client-data';
import React from 'react';
import { Platform } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { colors, sizes } from '../utils';

export const TokenLineChartAnnotationPoints = React.memo(
  ({
    annotations,
    animatedPoints,
    lineChart,
    chartColors,
    skiaFontManager,
  }: {
    annotations: ApiOnchainTokenChartAnnotation[];
    animatedPoints: SharedValue<{ x: number; y: number }[]>;
    lineChart: ApiOnchainTokenLineChartPoint[];
    chartColors: {
      background: string;
    };
    skiaFontManager: SkTypefaceFontProvider | null;
  }) => {
    return (
      <>
        {annotations.map((annotation, i) => (
          <TokenLineChartAnnotation
            key={i}
            animatedPoints={animatedPoints}
            annotation={annotation}
            lineChart={lineChart}
            chartColors={chartColors}
            skiaFontManager={skiaFontManager}
          />
        ))}
      </>
    );
  },
);

const TokenLineChartAnnotation = React.memo(
  ({
    animatedPoints,
    annotation,
    lineChart,
    chartColors,
    skiaFontManager: fontManager,
  }: {
    animatedPoints: SharedValue<{ x: number; y: number }[]>;
    annotation: ApiOnchainTokenChartAnnotation;
    lineChart: ApiOnchainTokenLineChartPoint[];
    chartColors: {
      background: string;
    };
    skiaFontManager: SkTypefaceFontProvider | null;
  }) => {
    const innerCirclePath = useDerivedValue(() => {
      const p = Skia.Path.Make();
      const innerRadius = 6;

      if (!animatedPoints.value.length) {
        return p;
      }

      let minDist = Infinity;
      let index = 0;

      for (let i = 0; i < lineChart.length; i++) {
        const point = lineChart[i];
        const dist = Math.abs(point.timestamp - annotation.timestamp);
        if (dist < minDist) {
          minDist = dist;
          index = i;
        }
      }

      const closestPoint = animatedPoints.value[index];

      if (!closestPoint) {
        return p;
      }

      p.addCircle(closestPoint.x, closestPoint.y, innerRadius);
      return p;
    }, [sizes.width, animatedPoints, lineChart, annotation]);

    const symbolParagraph = useDerivedValue(() => {
      if (Platform.OS === 'web' && !fontManager) {
        return null;
      }

      const builder = fontManager
        ? Skia.ParagraphBuilder.Make(
            {
              textAlign: TextAlign.Center,
            },
            fontManager,
          )
        : Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center });

      const symbol = annotation.type === 'self-buy' ? '+' : '-';

      builder.pushStyle({
        color: Skia.Color(chartColors.background),
        fontSize: 10,
        fontStyle: {
          weight: 700,
        },
      });
      builder.addText(symbol);

      return builder.build();
    }, [fontManager, annotation.type, chartColors.background]);

    const symbolPositionX = useDerivedValue(() => {
      if (!animatedPoints.value.length) {
        return 0;
      }

      let minDist = Infinity;
      let index = 0;

      for (let i = 0; i < lineChart.length; i++) {
        const point = lineChart[i];
        const dist = Math.abs(point.timestamp - annotation.timestamp);
        if (dist < minDist) {
          minDist = dist;
          index = i;
        }
      }

      const closestPoint = animatedPoints.value[index];

      if (!closestPoint) {
        return 0;
      }

      // Center the text on the circle
      // Since the paragraph has width=12 and we want it centered,
      // we need to offset by half the width and adjust for text height
      return closestPoint.x - 6; // Half of paragraph width (12/2)
    }, [animatedPoints, lineChart, annotation]);

    const symbolPositionY = useDerivedValue(() => {
      if (!animatedPoints.value.length) {
        return 0;
      }

      let minDist = Infinity;
      let index = 0;

      for (let i = 0; i < lineChart.length; i++) {
        const point = lineChart[i];
        const dist = Math.abs(point.timestamp - annotation.timestamp);
        if (dist < minDist) {
          minDist = dist;
          index = i;
        }
      }

      const closestPoint = animatedPoints.value[index];

      if (!closestPoint) {
        return 0;
      }

      // Center the text on the circle
      // Since the paragraph has width=12 and we want it centered,
      // we need to offset by half the width and adjust for text height
      return closestPoint.y - 7;
    }, [animatedPoints, lineChart, annotation]);

    return (
      <Group>
        <Path
          path={innerCirclePath}
          color={chartColors.background}
          style="stroke"
          strokeWidth={3}
        />
        <Path
          path={innerCirclePath}
          color={annotation.type === 'self-buy' ? colors.green : colors.red}
          style="fill"
          opacity={1}
        />
        <Paragraph
          width={12}
          paragraph={symbolParagraph}
          x={symbolPositionX}
          y={symbolPositionY}
        />
      </Group>
    );
  },
);
