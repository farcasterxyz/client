import cn from 'classnames';
import { FC, memo } from 'react';

type LoadingIndicatorProps = {
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
};

const LoadingIndicator: FC<LoadingIndicatorProps> = memo(
  ({ containerClassName, size = 'md' }) => (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent opacity-50 text-default',
        size === 'sm' && 'h-3 w-3 border-[2px]',
        size === 'md' && 'h-6 w-6 border-[3px]',
        size === 'lg' && 'h-10 w-10 border-[3px]',
        containerClassName,
      )}
      role="status"
      aria-label="loading"
    ></div>
  ),
);

LoadingIndicator.displayName = 'LoadingIndicator';

export { LoadingIndicator };
