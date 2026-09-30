import {
  Paragraph,
  RoundedRect,
  Skia,
  SkTypefaceFontProvider,
  TextAlign,
} from '@shopify/react-native-skia';
import { ApiOnchainTokenChartPeriod } from 'farcaster-client-data';
import React from 'react';
import { Platform } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

import { ensureBoundedX, sizes, TouchPoint } from '../utils';

export const TokenLineChartTimestampLabel = React.memo(
  ({
    period,
    touchPoint,
    chartColors,
    fontManager,
  }: {
    period: ApiOnchainTokenChartPeriod;
    touchPoint: SharedValue<TouchPoint | null>;
    chartColors: {
      textSecondary: string;
      backgroundSecondary: string;
      borderSecondary: string;
    };
    fontManager: SkTypefaceFontProvider | null;
  }) => {
    const paragraphContent = useDerivedValue(() => {
      if ((Platform.OS === 'web' && !fontManager) || !touchPoint.value) {
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

      const text = (() => {
        switch (period) {
          case 'd1':
          case 'h1':
          case 'h6':
            return new Date(touchPoint.value.timestamp).toLocaleTimeString(
              undefined,
              {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              },
            );
          case 'w1':
          case 'm1': {
            const date = new Date(touchPoint.value.timestamp);
            const time = date.toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: date.getMinutes() === 0 ? undefined : '2-digit',
              hour12: true,
            });
            const datePart = date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            return `${datePart} ${time}`;
          }
          default: {
            return new Date(touchPoint.value.timestamp).toLocaleDateString(
              undefined,
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              },
            );
          }
        }
      })();

      builder.addText(text);
      return builder.build();
    }, [fontManager, touchPoint, chartColors.textSecondary, period]);

    const width = useDerivedValue(() => {
      switch (period) {
        case 'd1':
        case 'h1':
        case 'h6':
          return 60;
        default:
          return 84;
      }
    }, [period]);

    const height = useDerivedValue(() => {
      return 20; // Fixed height for the background
    }, []);

    const boundedX = useDerivedValue(() => {
      if (!touchPoint.value) {
        return 0;
      }

      return ensureBoundedX(touchPoint.value.x, width.value);
    }, [touchPoint, sizes.width]);

    const backgroundRect = useDerivedValue(() => {
      if (!touchPoint.value) {
        // Return an invisible rectangle instead of null
        return Skia.RRectXY(
          { x: -1000, y: -1000, width: 0, height: 0 },
          0, // rx
          0, // ry
        );
      }

      const rect = Skia.RRectXY(
        { x: boundedX.value, y: 0, width: width.value, height: height.value },
        6, // rx
        6, // ry
      );

      return rect;
    }, [boundedX, width, height]);

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
          y={3}
          width={width}
          paragraph={paragraphContent}
        />
      </>
    );
  },
);
