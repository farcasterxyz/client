import { ApiWarpsTransaction } from 'farcaster-client-data';
import React from 'react';

import { BaseThankYou } from './transactions/BaseThankYou';
import { BuilderRewards } from './transactions/BuilderRewards';
import { BuyWarps } from './transactions/BuyWarps';
import { CastInChannel } from './transactions/CastInChannel';
import { ChannelLeadRewards } from './transactions/ChannelLeadRewards';
import { ConnectApp } from './transactions/ConnectApp';
import { CreateChannel } from './transactions/CreateChannel';
import { DisconnectApp } from './transactions/DisconnectApp';
import { HubRunnersRewards } from './transactions/HubRunnerRewards';
import { InviteJoin } from './transactions/InviteJoin';
import { InviteRewards } from './transactions/InviteRewards';
import { InviteWithWarps } from './transactions/InviteWithWarps';
import { Mint } from './transactions/Mint';
import { ThankYou } from './transactions/ThankYou';
import { WeeklyTrending } from './transactions/WeeklyTrending';
import { ZoraThankYou } from './transactions/ZoraThankYou';

type WarpTransactionProps = {
  transaction: ApiWarpsTransaction;
};

const WarpTransaction: React.FC<WarpTransactionProps> = ({ transaction }) => {
  switch (transaction.memo) {
    case 'buy-warps':
      return <BuyWarps transaction={transaction} />;
    case 'mint':
      return <Mint transaction={transaction} />;
    case 'thank-you':
      return <ThankYou transaction={transaction} />;
    case 'minting-thank-you':
      return <ZoraThankYou transaction={transaction} />;
    case 'base-thank-you':
      return <BaseThankYou transaction={transaction} />;
    case 'weekly-trending':
      return <WeeklyTrending transaction={transaction} />;
    case 'connect-app':
      return <ConnectApp transaction={transaction} />;
    case 'disconnect-app':
      return <DisconnectApp transaction={transaction} />;
    case 'invite-rewards':
      return <InviteRewards transaction={transaction} />;
    case 'builder-rewards':
      return <BuilderRewards transaction={transaction} />;
    case 'hub-runner-rewards':
      return <HubRunnersRewards transaction={transaction} />;
    case 'channel-lead-rewards':
      return <ChannelLeadRewards transaction={transaction} />;
    case 'create-channel':
      return <CreateChannel transaction={transaction} />;
    case 'invite-join':
      return <InviteJoin transaction={transaction} />;
    case 'invite-with-warps':
      return <InviteWithWarps transaction={transaction} />;
    case 'cast-in-channel-with-warps':
      return <CastInChannel transaction={transaction} />;
    default:
      return null;
  }
};

WarpTransaction.displayName = 'WarpTransaction';

export { WarpTransaction };
