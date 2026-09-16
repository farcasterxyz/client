import { ApiWarpsCastInChannelWithWarpsTransaction } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';

import { Transaction } from './Transaction';

type CastInChannelProps = {
  transaction: ApiWarpsCastInChannelWithWarpsTransaction;
};

const CastInChannel: React.FC<CastInChannelProps> = ({ transaction }) => {
  const channel = React.useMemo(() => {
    return transaction.content.channel;
  }, [transaction.content.channel]);

  const incoming = React.useMemo(() => {
    return transaction.type === 'receive';
  }, [transaction.type]);

  const fromUsername = useMemo(
    () =>
      resolveUsername({
        username: transaction.content.from.username,
        fid: transaction.content.from.fid,
      }),
    [transaction.content.from.fid, transaction.content.from.username],
  );

  const incomingFromAMutedUser = React.useMemo(() => {
    return (
      incoming &&
      typeof transaction.content.from.viewerContext !== 'undefined' &&
      transaction.content.from.viewerContext.invisible === true
    );
  }, [incoming, transaction.content.from.viewerContext]);

  const title = React.useMemo(() => {
    const finalFromUsername = incomingFromAMutedUser
      ? `${fromUsername} (Muted)`
      : fromUsername;

    return transaction.type === 'send'
      ? `Cast in /${channel.key}`
      : `From ${finalFromUsername} for casting in /${channel.key}`;
  }, [channel.key, fromUsername, incomingFromAMutedUser, transaction.type]);

  const description = React.useMemo(
    () =>
      incoming
        ? `Received from ${fromUsername} to be able to cast in ${channel.key}`
        : `Paid to be able to cast in /${channel.key}`,
    [channel.key, fromUsername, incoming],
  );

  const imageUrl = React.useMemo(() => {
    return channel.imageUrl;
  }, [channel.imageUrl]);

  return (
    <Transaction
      title={title}
      description={description}
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

CastInChannel.displayName = 'CreateChannel';

export { CastInChannel };
