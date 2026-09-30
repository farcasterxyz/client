// import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
// import { ApiTopMiniAppsPeriod } from 'farcaster-client-data';
// import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { FC, memo } from 'react';

import { MiniAppListItem } from '~/components/miniApp/MiniAppLeaderboardListItem';

// const PERIOD_OPTIONS: { label: string; value: ApiTopMiniAppsPeriod }[] = [
//   { label: 'This week', value: 'week' },
//   { label: 'Today', value: 'day' },
//   { label: 'This month', value: 'month' },
//   { label: 'All time', value: 'all' },
// ];

// type TrendingMiniAppsProps = {
//   period: ApiTopMiniAppsPeriod;
//   onPeriodChange: (period: ApiTopMiniAppsPeriod) => void;
// };

const TrendingMiniApps: FC = memo(() => {
  // const selectedLabel =
  //   PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? 'This week';

  return (
    <div className="flex flex-col">
      {/* <div className="flex items-center justify-between px-4 pb-4 pt-6"> */}
      {/* <h2 className="text-xl font-semibold text-default">Top Mini Apps</h2> */}
      {/* TODO: fix period dropdown
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-overlay-faint">
                {selectedLabel}
                <ChevronDownIcon size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="bottom"
                align="end"
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-md border p-1 shadow-lg outline-hidden bg-app border-default"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <DropdownMenu.Item
                    key={option.value}
                    onSelect={() => onPeriodChange(option.value)}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded px-3 py-2 text-sm outline-hidden text-default hover:bg-overlay-faint focus:bg-overlay-faint"
                  >
                    <span>{option.label}</span>
                    {option.value === period && (
                      <CheckIcon size={14} className="text-action-primary" />
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          */}
      {/* </div> */}
    </div>
  );
});

TrendingMiniApps.displayName = 'TrendingMiniApps';

export { MiniAppListItem, TrendingMiniApps };
