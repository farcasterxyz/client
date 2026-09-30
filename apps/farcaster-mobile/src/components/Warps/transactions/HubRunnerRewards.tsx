import { ApiWarpsHubRunnerRewardsTransaction } from 'farcaster-client-data';
import React from 'react';

import { Transaction } from './Transaction';

type HubRunnersRewardsProps = {
  transaction: ApiWarpsHubRunnerRewardsTransaction;
};

const HubRunnersRewards: React.FC<HubRunnersRewardsProps> = ({
  transaction,
}) => {
  const title = React.useMemo(() => {
    return `@${transaction.content.from.username}`;
  }, [transaction.content.from.username]);

  const imageUrl = React.useMemo(() => {
    return transaction.content.from.pfp?.url;
  }, [transaction.content.from.pfp?.url]);

  const description = React.useMemo(() => {
    return 'A small thank you from Farcaster for running a Farcaster hub.';
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
      chain={undefined}
      user={transaction.content.from}
    />
  );
};

HubRunnersRewards.displayName = 'HubRunnersRewards';

export { HubRunnersRewards };
