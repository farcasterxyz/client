import cn from 'classnames';
import React, { FC, memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Warp } from '~/components/warps/Warp';

interface PayWarpsButtonProps {
  amount: number;
  prefix: string;
  suffix: string;
  disabled: boolean;
  processing: boolean;
  onClick: () => void;
  className?: string;
}

const PayWarpsButton: FC<PayWarpsButtonProps> = memo(
  ({ amount, prefix, suffix, disabled, processing, onClick, className }) => {
    return (
      <DefaultButton
        variant="normal"
        size="lg"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'flex w-full flex-row items-center !justify-center space-x-1 !rounded-lg !font-semibold text-default',
          className,
        )}
        isLoading={processing}
      >
        <span className="font-light">{prefix} </span>
        <Warp size={14} />
        <span>{amount.toLocaleString('en-US')}</span>
        <span className="font-light"> {suffix}</span>
      </DefaultButton>
    );
  },
);

PayWarpsButton.displayName = 'PayWarpsButton';

export { PayWarpsButton };
