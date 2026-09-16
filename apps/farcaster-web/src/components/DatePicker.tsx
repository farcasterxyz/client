import {
  CalendarDate,
  getLocalTimeZone,
  now,
  parseTime,
  Time,
  toCalendarDate,
  ZonedDateTime,
} from '@internationalized/date';
import { ChevronLeftIcon, ChevronRightIcon } from '@primer/octicons-react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import React from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Group,
  Heading,
  TimeField,
} from 'react-aria-components';

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const time = new Time(hour, minute);
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    value: time.toString(),
    label: (
      <>
        <div>
          {displayHour}:{minute.toString().padStart(2, '0')}
        </div>
        <div>{hour < 12 ? 'AM' : 'PM'}</div>
      </>
    ),
  };
});

const TimeOption = ({
  timeOption,
  value,
  disabled,
}: {
  timeOption: (typeof TIME_OPTIONS)[number];
  value: string;
  disabled: boolean;
}) => {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (timeOption.value === value) {
      ref.current?.scrollIntoView({ behavior: 'instant' });
    }
    // we actually only want this to run on initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RadioGroup.Item
      ref={ref}
      value={timeOption.value}
      key={timeOption.value}
      id={timeOption.value}
      className="focus-visible:ring-focus-ring outline-hidden flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm
      tabular-nums
      text-default 
      hover:bg-overlay-light 
      focus-visible:z-10
      focus-visible:ring-2
      focus-visible:ring-inset
      data-[disabled]:cursor-not-allowed
      data-[disabled]:text-muted
      data-[state=checked]:bg-overlay-medium
      data-[state=checked]:text-default
      data-[disabled]:hover:bg-transparent"
      disabled={disabled}
    >
      {timeOption.label}
    </RadioGroup.Item>
  );
};

export const roundToNextTimeOption = (date: ZonedDateTime): ZonedDateTime => {
  const minutes = date.minute;
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  return date.set({
    minute: roundedMinutes >= 60 ? 0 : roundedMinutes,
    hour: roundedMinutes >= 60 ? date.hour + 1 : date.hour,
    second: 0,
    millisecond: 0,
  });
};

interface DatePickerProps {
  value: ZonedDateTime | null;
  onChange: (date: ZonedDateTime | null) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [focusedValue, setFocusedValue] = React.useState<
    ZonedDateTime | CalendarDate | null
  >(value);

  const nowDateTime = now(getLocalTimeZone());
  const minDate = toCalendarDate(nowDateTime);

  return (
    <AriaDatePicker
      value={value}
      onChange={(value) => {
        onChange(value);
        setFocusedValue(value);
      }}
      granularity="day"
      aria-label="Date"
      minValue={minDate}
      isDateUnavailable={(date) => {
        const today = toCalendarDate(nowDateTime);
        return date.compare(today) < 0;
      }}
    >
      <div className="flex gap-6">
        <div className="flex max-h-[320px] flex-col gap-4">
          <Group>
            <DateInput className="flex flex-row justify-center gap-1 rounded-md border bg-background px-4 py-2 tabular-nums border-faint text-default">
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className="rounded-xs outline-hidden px-2 data-[focused]:bg-overlay-medium data-[focused]:text-default"
                />
              )}
            </DateInput>
          </Group>

          <Calendar
            className="flex flex-col gap-4 text-default"
            focusedValue={focusedValue}
            onFocusChange={(focusedValue) => {
              setFocusedValue(focusedValue);
            }}
          >
            <header className="flex flex-row items-center justify-between gap-1 py-2">
              <Button
                slot="previous"
                className="focus-visible:ring-focus-ring outline-hidden rounded-md p-2 text-[0] text-default hover:bg-overlay-light focus-visible:ring-2 data-[pressed]:bg-overlay-medium"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Heading className="text-default" />
              <Button
                slot="next"
                className="focus-visible:ring-focus-ring outline-hidden rounded-md p-2 text-[0] text-default hover:bg-overlay-light focus-visible:ring-2 data-[pressed]:bg-overlay-medium"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </header>
            <CalendarGrid>
              {(date) => (
                <CalendarCell
                  date={date}
                  className="data-[disabled]:text-disabled focus-visible:ring-focus-ring outline-hidden flex size-8 items-center
                      justify-center
                      rounded-md
                      tabular-nums
                      text-default
                      hover:bg-overlay-light focus-visible:z-10
                      focus-visible:ring-2
                      data-[unavailable]:cursor-not-allowed
                      data-[outside-month]:text-muted
                      data-[unavailable]:text-muted
                      data-[pressed]:bg-overlay-medium
                      data-[selected]:bg-overlay-medium
                      data-[selected]:text-default
                      data-[unavailable]:hover:bg-transparent"
                />
              )}
            </CalendarGrid>
          </Calendar>
        </div>

        <div className="flex max-h-[320px] w-[128px] flex-col gap-4">
          <div>
            <TimeField
              granularity="minute"
              hourCycle={12}
              value={value ? new Time(value.hour, value.minute) : null}
              onChange={(time) => {
                if (time) {
                  onChange(
                    value?.set({
                      hour: time.hour,
                      minute: time.minute,
                    }) ?? null,
                  );
                }
              }}
              isDisabled={true}
              aria-label="Time"
              hideTimeZone={true}
            >
              <DateInput className="flex flex-row justify-center gap-1 rounded-md border bg-background px-4 py-2 tabular-nums border-faint text-default">
                {(segment) => (
                  <DateSegment
                    segment={segment}
                    className="rounded-xs outline-hidden px-0.5 data-[focused]:bg-overlay-medium data-[focused]:text-default"
                  />
                )}
              </DateInput>
            </TimeField>
          </div>

          <RadioGroup.Root
            className="flex flex-1 flex-col overflow-y-auto scroll-smooth"
            value={
              value
                ? new Time(value.hour, value.minute).toString()
                : new Time(0, 0).toString()
            }
            onValueChange={(timeSerialized: string) => {
              if (value) {
                const time = parseTime(timeSerialized);
                onChange(
                  value.set({
                    hour: time.hour,
                    minute: time.minute,
                  }),
                );
              }
            }}
          >
            {TIME_OPTIONS.map((time) => {
              return (
                <TimeOption
                  key={time.value}
                  timeOption={time}
                  disabled={
                    time.value
                      ? new Time(nowDateTime.hour, nowDateTime.minute).compare(
                          parseTime(time.value),
                        ) > 0
                      : false
                  }
                  value={
                    value
                      ? new Time(value.hour, value.minute).toString()
                      : new Time(0, 0).toString()
                  }
                />
              );
            })}
          </RadioGroup.Root>
        </div>
      </div>
    </AriaDatePicker>
  );
};
