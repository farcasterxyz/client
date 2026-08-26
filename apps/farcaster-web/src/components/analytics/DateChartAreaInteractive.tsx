import { FC, memo, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import { ChartData } from '~/lib/analytics/rollups';

const formatDateInLATimezone = (dateString: string) => {
  // If it's a date string in YYYY-MM-DD format, parse it in LA time
  const laDate = new Date(`${dateString}T00:00:00-07:00`);
  return laDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
};

const getDateInLATimezone = (dateInput: string | number | Date) => {
  if (typeof dateInput === 'string') {
    // If it's a date string in YYYY-MM-DD format, parse it in LA time
    return new Date(`${dateInput}T00:00:00-07:00`);
  }
  const date = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  return new Date(
    date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
  );
};

type ChartStyle = 'area' | 'line-with-dots';

const DateChartAreaInteractive: FC<{
  data: ChartData[];
  measureName: string;
  measureLabel: string;
  chartStyle?: ChartStyle;
  zeroAsNull?: boolean;
}> = memo(
  ({ data, measureName, measureLabel, chartStyle = 'area', zeroAsNull }) => {
    const chartConfig = {
      [measureName]: {
        label: measureLabel,
        color: '#2563eb',
      },
      date: {
        label: 'Date',
        color: '#60a5fa',
      },
    } satisfies ChartConfig;

    const referenceDate = useMemo(() => {
      return data.reduce(
        (acc, item) => {
          const date = getDateInLATimezone(item.date);
          if (date > acc) {
            return date;
          }
          return acc;
        },
        getDateInLATimezone(data[0]?.date || ''),
      );
    }, [data]);

    const [timeRange, setTimeRange] = useState('28d');
    const filteredData = data
      .filter((item) => {
        const date = getDateInLATimezone(item.date);
        let daysToSubtract = 28;
        if (timeRange === '28d') {
          daysToSubtract = 28;
        } else if (timeRange === '14d') {
          daysToSubtract = 14;
        } else if (timeRange === '7d') {
          daysToSubtract = 7;
        }
        const startDate = getDateInLATimezone(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return date >= startDate;
      })
      .map((item) =>
        item[measureName] === 0 && zeroAsNull
          ? {
              ...item,
              [measureName]: null,
            }
          : item,
      )
      .sort(
        (a, b) =>
          new Date(a.date as string).getTime() -
          new Date(b.date as string).getTime(),
      );

    return (
      <Card>
        <CardHeader className="relative">
          <CardTitle>{measureLabel}</CardTitle>
          <CardDescription>
            <span className="@[540px]/card:block hidden">
              Total for the last {timeRange}
            </span>
            <span className="@[540px]/card:hidden">Last {timeRange}</span>
          </CardDescription>
          <div className="absolute right-4 top-4">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="@[767px]/card:flex hidden"
            >
              <ToggleGroupItem value="28d" className="h-8 px-2.5">
                Last 28 days
              </ToggleGroupItem>
              <ToggleGroupItem value="14d" className="h-8 px-2.5">
                Last 14 days
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" className="h-8 px-2.5">
                Last 7 days
              </ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="@[767px]/card:hidden flex w-40"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="28d" className="rounded-lg">
                  Last 28 days
                </SelectItem>
                <SelectItem value="14d" className="rounded-lg">
                  Last 14 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full text-action-purple"
          >
            {chartStyle === 'area' ? (
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillMeasure" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="currentColor"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="currentColor"
                      stopOpacity={0.6}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatDateInLATimezone}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={formatDateInLATimezone}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey={measureName}
                  type="natural"
                  fill="url(#fillMeasure)"
                  stroke="currentColor"
                  stackId="a"
                />
              </AreaChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatDateInLATimezone}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={formatDateInLATimezone}
                      indicator="dot"
                    />
                  }
                />
                <Line
                  dataKey={measureName}
                  type="linear"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={{ fill: 'currentColor', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    );
  },
);

export { DateChartAreaInteractive };
export type { ChartStyle };
