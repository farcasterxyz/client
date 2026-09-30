import { ApiWarpsInviteWithWarpsTransaction } from 'farcaster-client-data';
import React from 'react';

import { Transaction } from './Transaction';

type InviteWithWarpsProps = {
  transaction: ApiWarpsInviteWithWarpsTransaction;
};

const InviteWithWarps: React.FC<InviteWithWarpsProps> = ({ transaction }) => {
  const title = React.useMemo(() => {
    return `@${transaction.content.from.username}`;
  }, [transaction.content.from.username]);

  const imageUrl = React.useMemo(() => {
    return transaction.content.from.pfp?.url;
  }, [transaction.content.from.pfp?.url]);

  const description = React.useMemo(() => {
    if (transaction.type === 'send') {
      return (
        transaction.content.message ||
        `Invited ${transaction.content.inviteeEmail} with warps.`
      );
    } else {
      return (
        transaction.content.message ||
        `${transaction.content.inviteeEmail} didn't accept your invite for 7 days.`
      );
    }
  }, [transaction.type, transaction.content]);

  return (
    <Transaction
      title={title}
      description={description}
      imageStyle="circle"
      imageUrl={imageUrl}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={transaction.type === 'receive'}
      chain={undefined}
    />
  );
};

InviteWithWarps.displayName = 'InviteWithWarps';

export { InviteWithWarps };
