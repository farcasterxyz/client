import { ApiWarpsBaseThankYouTransaction } from 'farcaster-client-data';
import React from 'react';

import { Transaction } from './Transaction';

type BaseThankYouProps = {
  transaction: ApiWarpsBaseThankYouTransaction;
};

const BaseThankYou: React.FC<BaseThankYouProps> = ({ transaction }) => {
  const title = React.useMemo(() => {
    return `@${transaction.content.from.username}`;
  }, [transaction.content.from.username]);

  const imageUrl = React.useMemo(() => {
    return transaction.content.from.pfp?.url;
  }, [transaction.content.from.pfp?.url]);

  const description = React.useMemo(() => {
    return 'A thank you from Farcaster for being an early Base user.';
  }, []);

  return (
    <Transaction
      title={title}
      description={description}
      imageStyle="circle"
      imageUrl={imageUrl}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={true}
      chain={'base'}
      user={transaction.content.from}
    />
  );
};

BaseThankYou.displayName = 'BaseThankYou';

export { BaseThankYou };
