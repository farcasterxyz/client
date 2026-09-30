import cn from 'classnames';
import React from 'react';

export type BlueBannerVariant = 'info' | 'error' | 'success';

interface BlueBannerProps {
  variant?: BlueBannerVariant;
  className?: string;
  height?: number;
  children: React.ReactNode;
}

export const BlueBanner = React.memo(
  ({ variant = 'info', className, children }: BlueBannerProps) => {
    const variantClasses = {
      info: 'bg-notification-blue',
      error: 'bg-notification-red',
      success: 'bg-notification-green',
    };

    return (
      <div
        className={cn(
          'flex flex-col items-start justify-start gap-3 rounded-lg px-3 py-2',
          'lg:flex-row lg:items-center lg:justify-center',
          variantClasses[variant],
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

BlueBanner.displayName = 'BlueBanner';
