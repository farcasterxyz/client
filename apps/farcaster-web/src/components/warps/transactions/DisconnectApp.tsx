import { ApiWarpsDisconnectAppTransaction } from 'farcaster-client-data';
import React from 'react';

import { Transaction } from './Transaction';

type DisconnectAppProps = {
  transaction: ApiWarpsDisconnectAppTransaction;
};

const DisconnectApp: React.FC<DisconnectAppProps> = ({ transaction }) => {
  const title = React.useMemo(() => {
    return `@${transaction.content.app.username}`;
  }, [transaction.content.app.username]);

  const imageUrl = React.useMemo(() => {
    return transaction.content.app.pfp?.url;
  }, [transaction.content.app.pfp?.url]);

  const description = React.useMemo(() => {
    return `A signer for @${transaction.content.app.username} was removed from your account.`;
  }, [transaction.content.app.username]);

  return (
    <Transaction
      title={title}
      description={description}
      imageStyle="circle"
      imageUrl={imageUrl}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={false}
      chain={undefined}
    />
  );
};

DisconnectApp.displayName = 'DisconnectApp';

export { DisconnectApp };
