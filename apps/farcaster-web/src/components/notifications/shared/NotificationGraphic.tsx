import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type NotificationGraphicProps = {
  centerVertically?: boolean;
  children: ReactNode;
};

const NotificationGraphic: FC<NotificationGraphicProps> = memo(
  ({ centerVertically, children }) => {
    return (
      <div
        className={cn(
          'flex w-[55.5px] shrink-0 flex-row justify-center pr-2',
          centerVertically && 'self-center',
        )}
      >
        {children}
      </div>
    );
  },
);

NotificationGraphic.displayName = 'NotificationGraphic';

export { NotificationGraphic };
