import cn from 'classnames';
import React from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

const DefaultModalActionButtons = ({
  isLoading = false,
  isPrimaryButtonDisabled = false,
  onSecondaryButtonClick,
  onPrimaryButtonClick,
  secondaryButtonLabel,
  primaryButtonLabel,
  primaryIsDestructive = false,
}: {
  isLoading?: boolean;
  isPrimaryButtonDisabled?: boolean;
  onSecondaryButtonClick?: () => void;
  onPrimaryButtonClick: () => void;
  secondaryButtonLabel?: string | React.ReactNode;
  primaryButtonLabel?: string | React.ReactNode;
  primaryIsDestructive?: boolean;
}) => {
  return (
    <div className="flex w-full flex-row space-x-3">
      {secondaryButtonLabel && onSecondaryButtonClick && (
        <DefaultButton
          isLoading={isLoading}
          title={
            typeof secondaryButtonLabel === 'string' ? secondaryButtonLabel : ''
          }
          variant="secondary"
          className="flex h-10 w-1/2 flex-row items-center !justify-center space-x-1 !font-normal"
          onClick={onSecondaryButtonClick}
        >
          <span className="flex flex-row items-center">
            {typeof secondaryButtonLabel === 'string'
              ? secondaryButtonLabel
              : secondaryButtonLabel}
          </span>
        </DefaultButton>
      )}
      <DefaultButton
        isLoading={isLoading}
        disabled={isPrimaryButtonDisabled}
        title={typeof primaryButtonLabel === 'string' ? primaryButtonLabel : ''}
        className={cn(
          'flex h-10 flex-row items-center !justify-center space-x-1 !font-normal',
          isPrimaryButtonDisabled && 'cursor-not-allowed',
          typeof secondaryButtonLabel === 'undefined' ? 'w-full' : 'w-1/2',
        )}
        onClick={onPrimaryButtonClick}
        variant={primaryIsDestructive ? 'danger' : 'normal'}
      >
        <span className="flex flex-row items-center">
          {typeof primaryButtonLabel === 'string'
            ? primaryButtonLabel
            : primaryButtonLabel}
        </span>
      </DefaultButton>
    </div>
  );
};

export { DefaultModalActionButtons };
