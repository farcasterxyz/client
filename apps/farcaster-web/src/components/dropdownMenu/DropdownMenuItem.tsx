import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import cn from 'classnames';
import React from 'react';

interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<
  typeof DropdownMenu.Item
> {
  name?: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  className?: string;
  disabled?: boolean;
}

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Item>,
  DropdownMenuItemProps
>(
  (
    { name, icon, destructive, children, className, disabled, ...props },
    forwardedRef,
  ) => (
    <DropdownMenu.Item
      {...props}
      ref={forwardedRef}
      className={cn(
        'outline-hidden p-2 text-sm',
        destructive && 'text-danger',
        disabled && 'pointer-events-none cursor-default text-gray-400',
        !disabled &&
          'focus-within:bg-overlay-medium hover:cursor-pointer hover:bg-overlay-medium active:bg-overlay-medium',
        className,
      )}
    >
      {children ? (
        children
      ) : (
        <div className="flex flex-row items-center gap-2">
          {name && <div className="min-w-0 flex-1 truncate">{name}</div>}
          {icon && <div className="size-[20px] flex-none">{icon}</div>}
        </div>
      )}
    </DropdownMenu.Item>
  ),
);

DropdownMenuItem.displayName = 'DropdownMenuItem';
