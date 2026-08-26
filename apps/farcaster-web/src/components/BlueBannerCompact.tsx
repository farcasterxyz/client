import cn from 'classnames';
import React from 'react';

export type BannerVariant = 'info' | 'error' | 'success';

interface BlueBannerCompactProps {
  children: React.ReactNode;
  className?: string;
  variant?: BannerVariant;
}

export const BlueBannerCompact = React.memo(
  ({ children, className, variant = 'info' }: BlueBannerCompactProps) => {
    const variantClasses = {
      info: 'text-informative bg-notification-blue',
      error: 'text-danger bg-notification-red',
      success: 'text-success bg-notification-green',
    };

    return (
      <div
        className={cn(
          'flex w-fit flex-row items-center justify-start gap-2',
          'rounded-md px-2 py-1',
          variantClasses[variant],
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

BlueBannerCompact.displayName = 'BlueBannerCompact';
