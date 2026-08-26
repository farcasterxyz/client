import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type PillTabProps = {
  children: ReactNode;
  isFocused?: boolean;
  notificationDot?: boolean;
};

const PillTab: FC<PillTabProps> = memo(
  ({ children, isFocused, notificationDot }) => {
    return (
      <div
        className={cn(
          'relative flex h-[32px] min-w-max items-center justify-center rounded-[50px] px-3 text-[15px] font-medium leading-[24px] lg:px-4',
          isFocused
            ? 'border border-[#7C65C133] bg-[#7C65C133] text-[#7c65c1] dark:text-[#ffffff]'
            : 'border border-[#D0D1D259] text-[#546473] bg-app dark:border-[#4C3A4EC0] dark:text-[#8b99a4]',
        )}
      >
        {children}
        {notificationDot && (
          <div className="absolute -right-px -top-px size-[8px] rounded-full bg-highlight"></div>
        )}
      </div>
    );
  },
);

PillTab.displayName = 'PillTab';

export { PillTab };
