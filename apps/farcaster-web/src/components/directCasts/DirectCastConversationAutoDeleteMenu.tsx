import { CheckIcon } from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import cn from 'classnames';
import { ApiDirectCastConversationMessageTTLDays } from 'farcaster-client-data';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';

type DirectCastConversationAutoDeleteMenuProps = {
  selection: ApiDirectCastConversationMessageTTLDays;
  open: boolean;
  trigger: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  onSelect: (ttl: ApiDirectCastConversationMessageTTLDays) => void;
  showHeader?: boolean;
  side?: 'left' | 'bottom';
  align?: 'start' | 'center' | 'end';
  className?: string;
  showNeverOption?: boolean;
};

const DirectCastConversationAutoDeleteMenu = ({
  selection,
  open,
  onOpenChange,
  onSelect,
  trigger,
  showHeader = false,
  side = 'left',
  align = 'start',
  className,
  showNeverOption = false,
}: DirectCastConversationAutoDeleteMenuProps) => {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger
        onClick={(e) => e.stopPropagation()}
        className="w-full"
      >
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side={side}
        align={align}
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'outline-hidden z-20 m-1 w-[162px] rounded-lg border shadow-lg bg-app border-default',
          className,
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {showHeader && (
          <DropdownMenuItem
            className="border-b px-4 py-3 border-default"
            disabled
          >
            <span>Auto-delete after...</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="border-b px-4 py-3 border-default"
          onSelect={() => onSelect(1)}
        >
          <div className="flex w-full items-center justify-between">
            <span>1 day</span>
            {selection === 1 && <CheckIcon size={14} />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="border-b px-4 py-3 border-default"
          onSelect={() => onSelect(7)}
        >
          <div className="flex w-full items-center justify-between">
            <span>7 days</span>
            {selection === 7 && <CheckIcon size={14} />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="border-b px-4 py-3 border-default"
          onSelect={() => onSelect(30)}
        >
          <div className="flex w-full items-center justify-between">
            <span>30 days</span>
            {selection === 30 && <CheckIcon size={14} />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="border-b px-4 py-3 border-default"
          onSelect={() => onSelect(365)}
        >
          <div className="flex w-full items-center justify-between">
            <span>1 year</span>
            {selection === 365 && <CheckIcon size={14} />}
          </div>
        </DropdownMenuItem>
        {showNeverOption && (
          <DropdownMenuItem
            className="border-b px-4 py-3 border-default"
            onSelect={() => onSelect('Infinity')}
          >
            <div className="flex w-full items-center justify-between">
              <span>Never</span>
              {selection === 'Infinity' && <CheckIcon size={14} />}
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export { DirectCastConversationAutoDeleteMenu };
