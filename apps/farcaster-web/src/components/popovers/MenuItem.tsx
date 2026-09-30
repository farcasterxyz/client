import cn from 'classnames';
import { FC, memo } from 'react';

interface MenuItemProps {
  name: string;
  icon?: React.ReactElement;
  version?: 'normal' | 'danger';
  disabled?: boolean;
  onClick: (e: React.SyntheticEvent) => void;
}

const MenuItem: FC<MenuItemProps> = memo(
  ({ name, icon, version = 'normal', disabled = false, onClick }) => {
    return (
      <button
        className={cn(
          'outline-hidden flex w-full flex-row items-center justify-start p-2 align-middle text-sm',
          disabled
            ? 'pointer-events-none cursor-default text-muted opacity-60'
            : [
                'hover:cursor-pointer hover:bg-overlay-faint',
                version === 'danger' ? 'text-danger' : 'text-primary',
              ],
        )}
        disabled={disabled}
        onClick={onClick}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="text-sm">{name}</span>
      </button>
    );
  },
);

MenuItem.displayName = 'MenuItem';

export { MenuItem };
