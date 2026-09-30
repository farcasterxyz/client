import { ChevronLeftIcon } from '@primer/octicons-react';
import { FC, memo } from 'react';

type DefaultBackModalButtonProps = {
  onClick: () => void;
};

const DefaultBackModalButton: FC<DefaultBackModalButtonProps> = memo(
  ({ onClick }) => {
    return (
      <div
        className="flex cursor-pointer flex-col items-start justify-start rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default"
        onClick={onClick}
      >
        <ChevronLeftIcon size={20} />
      </div>
    );
  },
);

DefaultBackModalButton.displayName = 'DefaultBackModalButton';

export { DefaultBackModalButton };
