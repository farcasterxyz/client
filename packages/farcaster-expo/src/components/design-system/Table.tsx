import React from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { useTheme } from '../../contexts/ThemeContext';
import { Text2 } from './Text';

export interface TableRow {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
  color?: string;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export interface TableProps {
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  rows: TableRow[];
  style?: StyleProp<ViewStyle>;
  alternating?: boolean;
  dashed?: boolean;
  rowLabelStyle?: StyleProp<TextStyle>;
}

export function Table({
  title,
  rows,
  style,
  titleStyle,
  rowStyle,
  rowLabelStyle,
  alternating = true,
  dashed = false,
}: TableProps) {
  const t = useTheme();
  return (
    <View
      style={[
        t.flexCol,
        {
          paddingVertical: 12,
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
          alignSelf: 'stretch',
        },
        style,
      ]}
    >
      {!!title && (
        <Text2
          size="lg"
          weight="medium"
          style={[
            {
              paddingHorizontal: 6,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text2>
      )}
      <View style={{ width: '100%' }}>
        {rows.map((row, index) => (
          <View
            style={[
              t.flexRow,
              dashed ? t.itemsCenter : t.itemsStart,
              t.justifyBetween,
              {
                padding: 6,
                gap: 12,
                alignSelf: 'stretch',
                borderRadius: 6,
                minHeight: 32,
              },
              {
                backgroundColor:
                  !alternating || index % 2 === 0
                    ? undefined
                    : t.colors.background.secondary,
              },
              rowStyle,
            ]}
            key={typeof row.label === 'string' ? row.label : index}
          >
            {typeof row.label === 'string' ? (
              <Text2
                color="secondary"
                size="base"
                style={[rowLabelStyle, row.labelStyle]}
              >
                {row.label}
              </Text2>
            ) : (
              row.label
            )}
            {dashed && <DashedLine />}
            {typeof row.value === 'string' ? (
              <Text2
                weight="medium"
                size="base"
                style={[
                  { color: row.color ?? t.colors.text.primary },
                  row.valueStyle,
                ]}
              >
                {row.value}
              </Text2>
            ) : (
              row.value
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function DashedLine() {
  const t = useTheme();

  const height = 1;

  return (
    <View style={[{ height }, t.flex1]}>
      <Svg height={height} width="100%">
        <Line
          x1="0"
          y1={height / 2}
          x2="100%"
          y2={height / 2}
          stroke={t.dark ? t.colors.gray850 : t.colors.gray200}
          strokeWidth={height}
          strokeDasharray="4,2"
        />
      </Svg>
    </View>
  );
}
