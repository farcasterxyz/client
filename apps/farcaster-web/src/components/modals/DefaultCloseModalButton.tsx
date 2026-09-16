import { XIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { type FC, memo } from 'react';

type DefaultCloseModalButtonProps = {
  onClick: () => void;
  iconSize?: number;
  className?: string;
};

const DefaultCloseModalButton: FC<DefaultCloseModalButtonProps> = memo(
  ({ onClick, iconSize = 20, className }) => {
    return (
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-full text-faint hover:bg-overlay-faint hover:text-default',
          className,
        )}
        onClick={onClick}
      >
        <XIcon size={iconSize} />
      </div>
    );
  },
);

DefaultCloseModalButton.displayName = 'DefaultCloseModalButton';

export { DefaultCloseModalButton };
