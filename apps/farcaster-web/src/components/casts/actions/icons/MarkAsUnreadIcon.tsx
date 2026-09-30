import { CommentIcon, DotFillIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import React from 'react';

const MarkAsUnreadIcon: React.FC<{ className?: string }> = React.memo(
  ({ className }) => {
    return (
      <div className={classNames('relative flex h-4 w-4', className)}>
        <CommentIcon className="text-default" size="small" />
        <DotFillIcon
          className="absolute right-0 top-0 mr-[-3px] mt-[-2.5px] rounded-full bg-app text-default"
          size={8}
        />
      </div>
    );
  },
);

export { MarkAsUnreadIcon };
