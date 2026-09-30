import { ApiWarpsBuyWarpsTransaction } from 'farcaster-client-data';
import React from 'react';

import { Transaction } from './Transaction';

type BuyWarpsProps = {
  transaction: ApiWarpsBuyWarpsTransaction;
};

const BuyWarps: React.FC<BuyWarpsProps> = ({ transaction }) => {
  return (
    <Transaction
      title={'Purchase'}
      description={undefined}
      imageStyle="square"
      imageUrl={undefined}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={true}
      chain={undefined}
    />
  );
};

BuyWarps.displayName = 'BuyWarps';

export { BuyWarps };
