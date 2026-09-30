import { ChevronLeftIcon } from '@primer/octicons-react';
import cn from 'classnames';
import type { FC } from 'react';

import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';

export interface DefaultModalHeaderProps {
  title: string;
  onClose: () => void;
  secondaryButton?: React.ReactNode;
  onBackClick?: () => void;
  icon?: (options: { size: number }) => React.ReactNode;
  iconColor?: 'purple' | 'red';
  iconSize?: 18 | 36;
  noIconBackground?: boolean;
  hideDefaultCloseModalButton?: boolean;
}

const DefaultModalHeader: FC<DefaultModalHeaderProps> = ({
  title,
  onClose,
  secondaryButton,
  onBackClick,
  icon,
  // Same as notifications
  iconColor = 'purple',
  iconSize = 18,
  hideDefaultCloseModalButton = false,
  noIconBackground = false,
}) => {
  return (
    <div className="flex w-full flex-row items-center justify-between p-[16px]">
      <span className="flex flex-row items-center text-xl font-medium leading-normal text-default">
        {onBackClick && (
          <div
            className="flex h-[24px] cursor-pointer flex-row items-center justify-center pr-3 text-sm font-semibold leading-tight text-muted hover:text-default"
            onClick={onBackClick}
          >
            <ChevronLeftIcon size={16} />
          </div>
        )}
        {icon && (
          <div
            className={cn(
              'mr-3 flex h-[32px] w-[32px] items-center justify-center rounded-full',
              iconSize === 18 && noIconBackground && 'h-[18px] w-[18px]',
              iconSize === 18 && !noIconBackground && 'h-[32px] w-[32px]',
              iconSize === 36 && noIconBackground && 'h-[36px] w-[36px]',
              iconSize === 36 && !noIconBackground && 'h-[48px] w-[48px]',
              iconColor === 'purple' &&
                !noIconBackground &&
                'bg-action-primary/30 text-brand',
              iconColor === 'red' &&
                !noIconBackground &&
                'bg-action-red/10 text-danger',
            )}
          >
            {icon({ size: iconSize })}
          </div>
        )}
        {title}
      </span>
      <div className="flex flex-row items-center gap-2">
        {secondaryButton && (
          <div className="flex h-[24px] items-center justify-center border-r pr-3">
            {secondaryButton}
          </div>
        )}
        {!hideDefaultCloseModalButton && (
          <DefaultCloseModalButton onClick={onClose} iconSize={24} />
        )}
      </div>
    </div>
  );
};

export { DefaultModalHeader };
