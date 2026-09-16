import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type TabProps = {
  children: ReactNode;
  isFocused?: boolean;
  className?: string;
};

const Tab: FC<TabProps> = memo(({ children, isFocused, className }) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center px-4 hover:bg-overlay-faint',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex h-full items-center justify-center whitespace-nowrap text-base font-semibold hover:text-default',
          isFocused ? 'text-default' : 'cursor-pointer text-muted ',
        )}
      >
        {children}
        {isFocused && (
          <div className="absolute bottom-0 h-1 w-full min-w-[56px] rounded-full bg-highlight"></div>
        )}
      </div>
    </div>
  );
});

Tab.displayName = 'Tab';

export { Tab };
