import { ApiWarpsCreateChannelTransaction } from 'farcaster-client-data';
import React from 'react';

import { Transaction } from './Transaction';

type CreateChannelProps = {
  transaction: ApiWarpsCreateChannelTransaction;
};

const CreateChannel: React.FC<CreateChannelProps> = ({ transaction }) => {
  const channel = React.useMemo(() => {
    return transaction.content.channel;
  }, [transaction.content.channel]);

  const title = React.useMemo(() => {
    return transaction.type === 'send'
      ? `Created channel /${channel.key}`
      : `Refund for creation of channel /${channel.key}`;
  }, [channel.key, transaction.type]);

  const imageUrl = React.useMemo(() => {
    return channel.imageUrl;
  }, [channel.imageUrl]);

  return (
    <Transaction
      title={title}
      description=""
      imageStyle="square"
      imageUrl={imageUrl}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={transaction.type === 'receive'}
      chain={undefined}
    />
  );
};

CreateChannel.displayName = 'CreateChannel';

export { CreateChannel };
