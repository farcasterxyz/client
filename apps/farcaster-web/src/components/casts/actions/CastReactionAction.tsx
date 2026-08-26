import cn from 'classnames';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import React from 'react';

export type CastReactionActionProps = {
  activeColor?: string;
  count: number;
  disabled?: boolean;
  icon: React.ReactNode;
  isActive?: boolean;
  isFocused: boolean;
  onClick?: (e: React.SyntheticEvent) => void;
  variant?: 'green' | 'red' | 'purple' | 'blue' | undefined;
};

function CastReactionAction(props: CastReactionActionProps) {
  const { onClick, icon, isActive, isFocused, count, variant, disabled } =
    props;
  const activeStyle =
    isActive && !disabled && props.activeColor
      ? { color: props.activeColor }
      : undefined;

  return (
    <div
      className={cn(
        'group flex w-max flex-row items-center text-sm text-tertiary',
        !disabled && 'cursor-pointer',
      )}
      onClick={(e) => {
        // Recast are triggered through RecastOptions and they don't have an onclick function
        if (!onClick) {
          return;
        }

        e.stopPropagation();
        if (!disabled) {
          onClick(e);
        }
      }}
    >
      <div
        className={cn(
          'group flex flex-row items-center justify-center rounded-full p-2 transition-colors',
          !isActive && 'text-tertiary',
          !disabled &&
            'hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium',
          isActive &&
            (variant === undefined || variant === 'purple') &&
            'text-brand ',
          isActive && variant === 'red' && 'text-danger',
          isActive && variant === 'green' && 'text-success',
          isActive && variant === 'blue' && 'text-informative',
        )}
        style={activeStyle}
      >
        {icon}
      </div>
      <span
        className={cn(
          'group ml-[2px] inline-flex pr-1.5 text-center text-sm transition-colors group-hover:text-muted',
          !isActive && 'text-tertiary',
          isActive &&
            (variant === undefined || variant === 'purple') &&
            'text-brand ',
          isActive && variant === 'red' && 'text-danger',
          isActive && variant === 'green' && 'text-success',
          isActive && variant === 'blue' && 'text-informative',
          disabled && '!text-tertiary',
          (isFocused || count === 0) && 'hidden',
        )}
        style={activeStyle}
      >
        {formatShorthandNumber(count)}
      </span>
    </div>
  );
}

CastReactionAction.displayName = 'CastReactionAction';

export { CastReactionAction };
