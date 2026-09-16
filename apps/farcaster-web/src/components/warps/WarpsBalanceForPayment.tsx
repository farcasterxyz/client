import { formatNumber, useInterval } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

interface WarpsBalanceForPaymentProps {
  balanceAmount: number;
  refreshBalance?: () => void;
}

const WarpsBalanceForPayment: FC<WarpsBalanceForPaymentProps> = memo(
  ({ balanceAmount, refreshBalance }) => {
    useInterval(refreshBalance, 3000);

    return (
      <div className="mt-4 flex flex-row items-center justify-center text-sm text-muted">
        <span className="ml-[6px] flex flex-row">
          You have{' '}
          <span className="px-1 font-bold">{formatNumber(balanceAmount)}</span>{' '}
          warps
        </span>
      </div>
    );
  },
);

WarpsBalanceForPayment.displayName = 'WarpsBalanceForPayment';

export { WarpsBalanceForPayment };
