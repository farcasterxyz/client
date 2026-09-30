import cn from 'classnames';
import { FC, memo } from 'react';

type DefaultEmptyListViewProps = {
  className?: string;
  message: string;
  subMessage?: string;
};

const DefaultEmptyListView: FC<DefaultEmptyListViewProps> = memo(
  ({ className, message, subMessage }) => {
    return (
      <div className="p-4 bg-app">
        <div className={cn('p text-center', className)}>{message}</div>
        {subMessage && (
          <div className={cn('p pt-1 text-center text-muted', className)}>
            {subMessage}
          </div>
        )}
      </div>
    );
  },
);

DefaultEmptyListView.displayName = 'DefaultEmptyListView';

export { DefaultEmptyListView };
