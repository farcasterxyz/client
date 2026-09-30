import classNames from 'classnames';
import { animate, motion, useMotionValue } from 'motion/react';
import React from 'react';

type ClickableProps = React.PropsWithChildren & {
  onClick: (e: React.SyntheticEvent) => void;
  disabled: boolean;
};

function Clickable({ children, onClick, disabled }: ClickableProps) {
  const scale = useMotionValue(1);

  const isEventFromNestedClickable = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return false;
      }
      const nearestClickable = target.closest('[data-clickable-root="true"]');
      return (
        nearestClickable !== null && nearestClickable !== event.currentTarget
      );
    },
    [],
  );

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || isEventFromNestedClickable(event)) {
        return;
      }
      animate(scale, 0.9, { type: 'spring', stiffness: 300, damping: 20 });
    },
    [disabled, isEventFromNestedClickable, scale],
  );

  const handleMouseUp = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || isEventFromNestedClickable(event)) {
        return;
      }
      animate(scale, 1, { type: 'spring', stiffness: 300, damping: 20 });
    },
    [disabled, isEventFromNestedClickable, scale],
  );

  const handleClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      if (disabled) {
        return;
      }

      onClick(e);
    },
    [disabled, onClick],
  );

  return (
    <motion.div
      data-clickable-root="true"
      style={{ scale }}
      className={classNames(
        'relative w-min cursor-default flex-row items-center overflow-hidden',
        !disabled && 'cursor-pointer',
        disabled && 'opacity-50',
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={disabled ? undefined : handleClick}
    >
      {children}
    </motion.div>
  );
}

export { Clickable };
