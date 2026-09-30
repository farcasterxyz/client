import cn from 'classnames';
import React from 'react';

export type InfoBannerVariant = 'info' | 'error' | 'success' | 'emerald';

interface InfoBannerProps {
  children: React.ReactNode;
  className?: string;
  variant?: InfoBannerVariant;
}

export const InfoBanner = React.memo(
  ({ children, className, variant = 'info' }: InfoBannerProps) => {
    const variantClasses = {
      info: 'bg-notification-blue',
      error: 'bg-notification-red',
      success: 'bg-notification-green',
      emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };

    return (
      <div
        className={cn(
          'rounded-lg border px-3 py-2',
          variantClasses[variant],
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

InfoBanner.displayName = 'InfoBanner';
