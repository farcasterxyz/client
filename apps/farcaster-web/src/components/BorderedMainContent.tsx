import cn from 'classnames';
import { forwardRef, memo, ReactNode } from 'react';

type BorderedMainContentProps = {
  children: ReactNode;
  className?: string;
};

const BorderedMainContent = memo(
  forwardRef<HTMLDivElement, BorderedMainContentProps>(
    ({ children, className }, ref) => {
      return (
        <div
          ref={ref}
          id="body:main"
          className={cn(
            'h-full min-h-screen border-surface-secondary sm:border-x',
            className,
          )}
        >
          {children}
        </div>
      );
    },
  ),
);

BorderedMainContent.displayName = 'BorderedMainContent';

export { BorderedMainContent };
