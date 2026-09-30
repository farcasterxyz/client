import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  KebabHorizontalIcon,
  TrashIcon,
} from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import classNames from 'classnames';
import parser from 'cron-parser';
import { ApiCastBody, ApiCastDraft, ApiChannel } from 'farcaster-client-data';
import {
  useDiscardDraftCast,
  useDraftCastsWithRefreshOnMount,
  useStoreDraftCast,
} from 'farcaster-client-hooks';
import React from 'react';

import { RitualsIcon } from '~/components/casts/actions/icons/RitualsIcon';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { MenuItem } from '~/components/popovers/MenuItem';
import { Tooltip } from '~/components/Tooltip';
import { Composer } from '~/lazy/components';
import { CastComposerIntent } from '~/types';
import { dayjs } from '~/utils/dayjs';

type RitualsModalNavigationProps = {
  title: string;
  onBackClick: () => void;
};

const RitualsModalNavigation: React.FC<RitualsModalNavigationProps> =
  React.memo(({ onBackClick, title }) => {
    return (
      <div
        className={classNames(
          'justitfy-center relative flex w-full flex-row items-center py-4',
        )}
      >
        <div
          className="absolute left-2 mr-1 flex cursor-pointer flex-col items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default"
          onClick={onBackClick}
        >
          <ArrowLeftIcon size={20} />
        </div>
        <span className="w-full text-center text-xl font-semibold">
          {title}
        </span>
      </div>
    );
  });

type RitualsModalContentProps = {
  channel: ApiChannel;
  onClose: () => void;
};

const RitualsModalContent: React.FC<RitualsModalContentProps> = React.memo(
  ({ channel, onClose }) => {
    const [createRitualFlowActive, setCreateRitualFlowActive] =
      React.useState<boolean>(false);
    const [activeRitualDraft, setActiveRitualDraft] = React.useState<
      ApiCastDraft | undefined
    >(undefined);
    const [activeRitualCast, setActiveRitualCast] = React.useState<
      ApiCastBody | undefined
    >(undefined);

    const onCreateClick = React.useCallback(() => {
      setCreateRitualFlowActive(true);

      setActiveRitualCast(undefined);
    }, []);

    const onScheduleClick = React.useCallback(
      ({ cast }: { cast: ApiCastBody }) => {
        setCreateRitualFlowActive(false);

        setActiveRitualCast(cast);
      },
      [],
    );

    const onEditClick = React.useCallback(
      ({ draft }: { draft: ApiCastDraft }) => {
        setActiveRitualDraft(draft);
      },
      [],
    );

    const navigationTitle = React.useMemo(() => {
      return createRitualFlowActive || typeof activeRitualCast !== 'undefined'
        ? 'Create a ritual'
        : 'Rituals';
    }, [activeRitualCast, createRitualFlowActive]);

    const onNavigationBackClick = React.useCallback(() => {
      if (createRitualFlowActive) {
        setCreateRitualFlowActive(false);
      } else if (typeof activeRitualCast !== 'undefined') {
        onCreateClick();
      } else if (typeof activeRitualDraft !== 'undefined') {
        setActiveRitualDraft(undefined);
      } else {
        onClose();
      }
    }, [
      activeRitualCast,
      activeRitualDraft,
      createRitualFlowActive,
      onClose,
      onCreateClick,
    ]);

    const onSaveClick = React.useCallback(() => {
      setCreateRitualFlowActive(false);

      setActiveRitualCast(undefined);

      setActiveRitualDraft(undefined);
    }, []);

    return (
      <React.Suspense
        fallback={
          <span className="flex h-[200px] w-full flex-row items-center justify-center py-8">
            <LoadingIndicator />
          </span>
        }
      >
        <RitualsModalNavigation
          title={navigationTitle}
          onBackClick={onNavigationBackClick}
        />
        {createRitualFlowActive && typeof activeRitualDraft === 'undefined' && (
          <CreateRitual channel={channel} onScheduleClick={onScheduleClick} />
        )}
        {typeof activeRitualDraft !== 'undefined' &&
          typeof activeRitualCast === 'undefined' && (
            <EditRitual
              draft={activeRitualDraft}
              channel={channel}
              onScheduleClick={onScheduleClick}
            />
          )}
        {!createRitualFlowActive && typeof activeRitualCast !== 'undefined' && (
          <ScheduleRitual
            cast={activeRitualCast}
            onSaveClick={onSaveClick}
            existingDraftId={activeRitualDraft?.draftId}
          />
        )}
        {!createRitualFlowActive &&
          typeof activeRitualCast === 'undefined' &&
          typeof activeRitualDraft === 'undefined' && (
            <Rituals
              channel={channel}
              onCreateClick={onCreateClick}
              onEditClick={onEditClick}
            />
          )}
      </React.Suspense>
    );
  },
);

type EditRitualProps = {
  draft: ApiCastDraft;
  channel: ApiChannel;
  onScheduleClick: ({ cast }: { cast: ApiCastBody }) => void;
};

const EditRitual: React.FC<EditRitualProps> = React.memo(
  ({ draft, onScheduleClick }) => {
    const composerIntent: CastComposerIntent = React.useMemo(() => {
      return {
        text: draft.cast.text,
        embeds: draft.cast.embeds,
        channelKey: draft.cast.channelKey,
      };
    }, [draft.cast.embeds, draft.cast.channelKey, draft.cast.text]);

    const onComposerActionClick = React.useCallback(
      ({ cast }: { cast: ApiCastBody }) => {
        onScheduleClick({ cast });
      },
      [onScheduleClick],
    );

    const composerActionOverride = React.useMemo(() => {
      return {
        label: 'Schedule',
        onClick: onComposerActionClick,
      };
    }, [onComposerActionClick]);

    return (
      <div className="flex min-h-[200px] flex-col border-t pb-2 border-default">
        <div className="flex flex-col space-y-1 border-b px-4 py-2 border-default">
          <span className="font-semibold text-default">Write a prompt</span>
          <span className="text-sm text-faint">
            Try asking a question to get a discussion going.
          </span>
        </div>
        <div className="px-4 py-2">
          <Composer
            placeholder="Start typing a new cast here..."
            intent={composerIntent}
            actionOverride={composerActionOverride}
          />
        </div>
      </div>
    );
  },
);

type CreateRitualProps = {
  channel: ApiChannel;
  onScheduleClick: ({ cast }: { cast: ApiCastBody }) => void;
};

const CreateRitual: React.FC<CreateRitualProps> = React.memo(
  ({ channel, onScheduleClick }) => {
    const composerIntent: CastComposerIntent = React.useMemo(() => {
      return {
        channelKey: channel.key,
      };
    }, [channel.key]);

    const onComposerActionClick = React.useCallback(
      ({ cast }: { cast: ApiCastBody }) => {
        onScheduleClick({ cast });
      },
      [onScheduleClick],
    );

    const composerActionOverride = React.useMemo(() => {
      return {
        label: 'Schedule',
        onClick: onComposerActionClick,
      };
    }, [onComposerActionClick]);

    return (
      <div className="flex min-h-[200px] flex-col border-t pb-2 border-default">
        <div className="flex flex-col space-y-1 border-b px-4 py-2 border-default">
          <span className="font-semibold text-default">Write a prompt</span>
          <span className="text-sm text-faint">
            Try asking a question to get a discussion going.
          </span>
        </div>
        <div className="px-4 py-2">
          <Composer
            placeholder="Start typing a new cast here..."
            intent={composerIntent}
            actionOverride={composerActionOverride}
          />
        </div>
      </div>
    );
  },
);

type ScheduleRitualProps = {
  existingDraftId: string | undefined;
  cast: ApiCastBody;
  onSaveClick: () => void;
};

const RITUAL_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const RITUAL_PST_TIMES = [
  '12:00 AM',
  '01:00 AM',
  '02:00 AM',
  '03:00 AM',
  '04:00 AM',
  '05:00 AM',
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
  '11:00 PM',
] as const;

type RitualDay = (typeof RITUAL_DAYS)[number];

type RitualPSTTime = (typeof RITUAL_PST_TIMES)[number];

const buildCron = ({ day, time }: { day: RitualDay; time: RitualPSTTime }) => {
  const hour = parseInt(time.split(':')[0], 10);
  const minute = parseInt(time.split(' ')[0].split(':')[1], 10);
  const amPm = time.split(' ')[1];
  let cronHour = amPm === 'AM' ? hour : (hour % 12) + 12;
  // Default UTC offset for PDT
  // FIXME: This will break when we move to PST but let's see how the
  // experiment goes for rituals first.
  const utcOffset = 7;

  // Adjust day if time conversion crosses midnight
  let cronDayIndex = RITUAL_DAYS.indexOf(day);
  if (cronHour + utcOffset >= 24) {
    cronDayIndex = (cronDayIndex + 1) % 7;
  }
  cronHour = (cronHour + utcOffset) % 24;

  return `${minute} ${cronHour} * * ${cronDayIndex}`;
};

const ScheduleRitual: React.FC<ScheduleRitualProps> = React.memo(
  ({ existingDraftId, cast, onSaveClick }) => {
    const [selectedDay, setSelectedDay] = React.useState<RitualDay>('Monday');
    const [selectedTime, setSelectedTime] =
      React.useState<RitualPSTTime>('10:00 AM');
    const [isSaving, setIsSaving] = React.useState<boolean>(false);

    const storeDraftCast = useStoreDraftCast();
    const discardDraftCast = useDiscardDraftCast();

    const saveClick = React.useCallback(async () => {
      setIsSaving(true);

      const cron = buildCron({ day: selectedDay, time: selectedTime });

      await storeDraftCast({ cast, cron });

      // TODO: Eventually we want a single UPDATE call but moving fast as Rituals
      // v0 is still an experiment phase.
      if (existingDraftId) {
        await discardDraftCast({
          draftId: existingDraftId,
          castChannelKey: cast.channelKey,
        });
      }

      setIsSaving(false);

      onSaveClick();
    }, [
      cast,
      discardDraftCast,
      existingDraftId,
      onSaveClick,
      selectedDay,
      selectedTime,
      storeDraftCast,
    ]);

    return (
      <div className="flex min-h-[200px] flex-col border-t pb-2 border-default">
        <div className="flex flex-col space-y-1 border-b px-4 py-2 border-default">
          <span className="font-semibold text-default">Schedule</span>
          <span className="text-sm text-faint">
            Rituals automatically get casted on the same time and day every
            week.
          </span>
        </div>
        <div className="flex flex-col space-y-1 px-4 py-2">
          <span className="font-semibold text-default">Pick a day</span>
          <Select.Root
            value={selectedDay}
            onValueChange={(value) => setSelectedDay(value as RitualDay)}
          >
            <Select.Trigger className="z-20 flex w-max flex-row items-center space-x-2 rounded border bg-input p-2 text-sm border-default">
              <Select.Value defaultValue={selectedDay} />
              <Select.Icon className="flex">
                <ChevronDownIcon className="text-muted" size={12} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="shadow-xs z-20 rounded-lg border p-1 text-sm bg-app border-default">
                <Select.Viewport>
                  {RITUAL_DAYS.map((d) => {
                    return (
                      <Select.Item
                        key={d}
                        className="mb-2 flex cursor-pointer flex-row items-center space-x-2 rounded p-2 hover:bg-overlay-light"
                        value={d}
                      >
                        <Select.ItemText>{d}</Select.ItemText>
                        <Select.ItemIndicator className="flex">
                          <CheckIcon size={12} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    );
                  })}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <div className="flex flex-col space-y-1 px-4 py-2">
          <span className="font-semibold text-default">Pick a time</span>
          <Select.Root
            value={selectedTime}
            onValueChange={(value) => setSelectedTime(value as RitualPSTTime)}
          >
            <div className="flex flex-row items-center space-x-2">
              <Select.Trigger className="z-20 flex w-max flex-row items-center space-x-2 rounded border bg-input p-2 text-sm border-default">
                <Select.Value defaultValue={selectedTime} />
                <Select.Icon className="flex">
                  <ChevronDownIcon className="text-muted" size={12} />
                </Select.Icon>
              </Select.Trigger>
              <span className="text-sm text-faint">
                GMT (-7:00) America/Los Angeles
              </span>
            </div>
            <Select.Portal>
              <Select.Content className="shadow-xs  z-20 rounded-lg border p-1 text-sm bg-app border-default">
                <Select.Viewport>
                  {RITUAL_PST_TIMES.map((d) => {
                    return (
                      <Select.Item
                        key={d}
                        className="mb-2 flex cursor-pointer flex-row items-center space-x-2 rounded p-2 hover:bg-overlay-light"
                        value={d}
                      >
                        <Select.ItemText>{d}</Select.ItemText>
                        <Select.ItemIndicator className="flex">
                          <CheckIcon size={12} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    );
                  })}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <div className="flex flex-row-reverse justify-between border-t px-4 pt-2 border-default ">
          <DefaultButton title={'Save'} disabled={isSaving} onClick={saveClick}>
            Save
          </DefaultButton>
        </div>
      </div>
    );
  },
);

type NoRitualsEmptyStateProps = {
  onCreateClick: () => void;
};

const NoRitualsEmptyState: React.FC<NoRitualsEmptyStateProps> = React.memo(
  ({ onCreateClick }) => {
    return (
      <div className="m-auto flex w-[85%] flex-col items-center justify-center space-y-2 py-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="199"
          height="64"
          viewBox="0 0 199 64"
          fill="none"
        >
          <rect
            x="1.5"
            y="4"
            width="123"
            height="56"
            rx="7"
            stroke="url(#paint0_linear_6703_17315)"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <rect
            x="74.5"
            y="4"
            width="123"
            height="56"
            rx="7"
            stroke="url(#paint1_linear_6703_17315)"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <rect
            x="31.5"
            y="1"
            width="136"
            height="62"
            rx="7"
            className="fill-app-light dark:fill-app-dark"
            stroke="url(#paint2_linear_6703_17315)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient
              id="paint0_linear_6703_17315"
              x1="0.5"
              y1="32"
              x2="125.5"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#DEAEEB" />
              <stop offset="0.44" stopColor="#6944BA" />
              <stop offset="1" stopColor="#ACB0ED" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_6703_17315"
              x1="73.5"
              y1="32"
              x2="198.5"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#DEAEEB" />
              <stop offset="0.44" stopColor="#6944BA" />
              <stop offset="1" stopColor="#ACB0ED" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_6703_17315"
              x1="30.5"
              y1="32"
              x2="168.5"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#DEAEEB" />
              <stop offset="0.44" stopColor="#6944BA" />
              <stop offset="1" stopColor="#ACB0ED" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pb-2 text-sm text-faint">
          Rituals are scheduled casts to help you build your channel.
        </div>
        <DefaultButton
          title={'Create a ritual'}
          disabled={false}
          onClick={onCreateClick}
        >
          Create a ritual
        </DefaultButton>
      </div>
    );
  },
);

type RitualsProps = {
  channel: ApiChannel;
  onCreateClick: () => void;
  onEditClick: ({ draft }: { draft: ApiCastDraft }) => void;
};

const Rituals: React.FC<RitualsProps> = React.memo(
  ({ channel, onCreateClick, onEditClick }) => {
    const { data, onEndReached, isFetchingNextPage } =
      useDraftCastsWithRefreshOnMount({
        channelKey: channel.key,
      });

    const rituals = React.useMemo(() => {
      return data?.pages.flatMap((o) => o.result.drafts) || [];
    }, [data?.pages]);

    const ritualKeyExtractor = React.useCallback(
      (item: ApiCastDraft) => item.draftId,
      [],
    );

    const ritualRenderItem = React.useCallback(
      ({ item }: { item: ApiCastDraft }) => {
        return (
          <Ritual
            draft={item}
            onEditClick={() => {
              onEditClick({ draft: item });
            }}
          />
        );
      },
      [onEditClick],
    );

    return (
      <div className="mx-2 flex min-h-[200px] flex-col justify-between border-t pb-2 border-default">
        <FlatList
          data={rituals}
          keyExtractor={ritualKeyExtractor}
          renderItem={ritualRenderItem}
          emptyView={<NoRitualsEmptyState onCreateClick={onCreateClick} />}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          containerClassName="!animate-none max-h-[540px] overflow-y-auto scrollbar-vert"
        />
        {rituals.length !== 0 && (
          <div className="flex flex-row-reverse justify-between border-t px-4 pt-2 border-default ">
            <DefaultButton
              title={'Create new'}
              disabled={false}
              onClick={onCreateClick}
            >
              Create new
            </DefaultButton>
          </div>
        )}
      </div>
    );
  },
);

type RitualProps = {
  draft: ApiCastDraft;
  onEditClick: () => void;
};

const Ritual: React.FC<RitualProps> = ({ draft, onEditClick }) => {
  const [optionsOpen, setOptionsOpen] = React.useState<boolean>(false);

  const discardDraftCast = useDiscardDraftCast();

  const nextRitualDate = React.useMemo(() => {
    if (typeof draft.cron === 'undefined') {
      return undefined;
    }

    const expression = parser.parseExpression(draft.cron, { tz: 'UTC' });

    if (!expression.hasNext()) {
      return undefined;
    }

    const expressionDate = expression.next().toDate();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return dayjs(expressionDate).tz(tz);
  }, [draft.cron]);

  const nextRitualTrigger = React.useMemo(() => {
    if (typeof nextRitualDate === 'undefined') {
      return 'Does not have a valid ritual schedule.';
    }

    return (
      <Tooltip
        trigger={
          <span className="flex flex-row items-center">
            <CalendarIcon size={10} className="mb-[2px] mr-1" />
            <span>
              {`Every ${nextRitualDate.format('dddd')} at ${nextRitualDate.format('h:mma z')}`}
            </span>
          </span>
        }
        content={
          <div className="px-1 text-sm text-white">{`Next: ${nextRitualDate.format('MMM D, h:mma z')}`}</div>
        }
      />
    );
  }, [nextRitualDate]);

  const onEditRitualClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      onEditClick();
    },
    [onEditClick],
  );

  const onDeleteRitualClick = React.useCallback(
    async (e: React.SyntheticEvent) => {
      e.stopPropagation();

      await discardDraftCast({
        draftId: draft.draftId,
        castChannelKey: draft.cast.channelKey,
      });
    },
    [discardDraftCast, draft.cast.channelKey, draft.draftId],
  );

  return (
    <div
      className="flex cursor-pointer flex-row items-center justify-between border-b p-2 border-default hover:bg-overlay-light"
      onClick={onEditRitualClick}
    >
      <div className="mr-2 flex flex-col">
        <div className="line-clamp-1 text-ellipsis text-base break-gracefully text-default">
          {draft.cast.text}
        </div>
        <div className="flex flex-row items-center space-x-1 text-sm text-muted">
          {nextRitualTrigger}
        </div>
      </div>
      <Popover.Root
        modal={true}
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
      >
        <Popover.Trigger
          asChild
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex">
            <KebabHorizontalIcon
              size={12}
              className="rotate-90 cursor-pointer text-faint hover:text-default"
            />
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="outline-hidden z-20 flex w-max cursor-default flex-col rounded-md border p-1 shadow-lg bg-app border-default"
            side="bottom"
            sideOffset={4}
            align="end"
          >
            <MenuItem
              name="Edit"
              icon={<RitualsIcon />}
              onClick={onEditRitualClick}
            />
            <MenuItem
              name="Delete"
              icon={<TrashIcon />}
              onClick={onDeleteRitualClick}
              version="danger"
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export { RitualsModalContent };
