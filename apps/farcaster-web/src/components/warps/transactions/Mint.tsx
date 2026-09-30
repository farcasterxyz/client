import { LinkExternalIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiWarpsMintTransaction } from 'farcaster-client-data';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

import { Transaction } from './Transaction';

type MintProps = {
  transaction: ApiWarpsMintTransaction;
};

const Mint: React.FC<MintProps> = ({ transaction }) => {
  const { trackEvent } = useAnalytics();
  const navigate = useExternalNavigate();

  const title = React.useMemo(() => {
    return transaction.content.assetName
      ? `Minted ${transaction.content.assetName}`
      : 'Mint';
  }, [transaction.content.assetName]);

  const imageUrl = React.useMemo(() => {
    return transaction.content.assetImageUrl || NFT_IMAGE_UNAVAILABLE_URL;
  }, [transaction.content.assetImageUrl]);

  const transactionAction = React.useMemo(() => {
    const assetMintUrl = transaction.content.assetMintUrl;

    if (typeof assetMintUrl === 'undefined' || assetMintUrl === '') {
      return null;
    }
    return (
      <DefaultButton
        className="min-w-[32px] !rounded-xl !font-normal"
        size="md"
        variant={'muted'}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();

          trackEvent(AnalyticsEvent.ClickTipReplyWithDirectCast, {});

          navigate({ to: assetMintUrl, openInNewTab: true });
        }}
      >
        <span className="flex flex-row items-center font-normal text-muted hover:text-default">
          <LinkExternalIcon size={14} className=" mr-1.5" />
          Open in Browser
        </span>
      </DefaultButton>
    );
  }, [navigate, trackEvent, transaction.content.assetMintUrl]);

  return (
    <Transaction
      title={title}
      description={undefined}
      imageStyle="square"
      imageUrl={imageUrl}
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={false}
      chain={transaction.content.assetChain}
      transactionAction={transactionAction}
    />
  );
};

Mint.displayName = 'Mint';

export { Mint };
