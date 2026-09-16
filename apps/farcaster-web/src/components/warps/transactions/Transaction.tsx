import classNames from 'classnames';
import { ApiChain, ApiUser } from 'farcaster-client-data';
import { formatNumber } from 'farcaster-client-hooks';
import React from 'react';

import { ChainImage } from '~/components/chain/ChainImage';
import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { dayjs } from '~/utils/dayjs';
import { applyCloudflarePath } from '~/utils/images';

type TransactionProps = {
  chain: ApiChain | undefined;
  description: string | undefined;
  imageStyle: 'square' | 'circle';
  imageUrl: string | undefined;
  pending: boolean;
  timestamp: number;
  title: string;
  amount: number;
  incomingTransaction: boolean;
  user?: ApiUser;
  transactionAction?: React.ReactNode;
};

const Transaction: React.FC<TransactionProps> = ({
  chain,
  description,
  imageStyle,
  imageUrl,
  pending,
  timestamp,
  title,
  amount,
  incomingTransaction,
  user,
  transactionAction,
}) => {
  const transactionTimestamp = React.useMemo(() => {
    const formatted = dayjs(timestamp).fromNow();

    // Our custom locale config returns 'now' for recent times
    if (formatted === 'now') {
      return 'just now';
    }

    return `${formatted} ago`;
  }, [timestamp]);

  const transactionImage = React.useMemo(() => {
    if (pending) {
      return (
        <div className="flex size-[36px] items-center justify-center">
          <LoadingIndicator />
        </div>
      );
    }

    if (typeof imageUrl === 'undefined') {
      return (
        <span className="relative flex size-[36px] items-center justify-center">
          <Image
            alt="Warp"
            src={'/~/images/Warp.png'}
            className={
              'aspect-square shrink-0 rounded-full object-cover bg-app'
            }
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
            }}
          />
        </span>
      );
    }

    const image = (
      <span className="relative flex size-[36px] items-center justify-center">
        <Image
          src={applyCloudflarePath(imageUrl, 32)}
          className={classNames(
            'aspect-square shrink-0 border bg-app border-default',
            imageStyle === 'square' ? 'rounded-lg' : 'rounded-full',
          )}
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
          }}
          alt={`Image`}
          fallback={NFT_IMAGE_UNAVAILABLE_URL}
        />
        {typeof chain !== 'undefined' && (
          <ChainImage chain={chain} className="absolute bottom-0 right-0" />
        )}
      </span>
    );
    if (user) {
      return (
        <LinkToProfile title={''} user={user}>
          {image}
        </LinkToProfile>
      );
    } else {
      return image;
    }
  }, [chain, imageStyle, imageUrl, pending, user]);

  return (
    <div className="flex w-full flex-row items-center justify-between border-t p-2 py-4 border-default">
      <div className="mr-4 flex flex-row items-center space-x-2">
        <span className="flex-1 self-start">{transactionImage}</span>
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col items-start">
            <div className="text-base text-default">{title}</div>
            <div className="text-xs text-faint">{transactionTimestamp}</div>
          </div>
          {typeof description !== 'undefined' && (
            <div className="text-sm text-muted">{description}</div>
          )}
          {typeof transactionAction !== 'undefined' &&
            transactionAction !== null && <div>{transactionAction}</div>}
        </div>
      </div>
      <div
        className={classNames(
          incomingTransaction ? 'text-[#43b748]' : 'text-muted',
          'text-base',
        )}
      >
        {incomingTransaction ? '+' : '-'}
        {formatNumber(amount)}
      </div>
    </div>
  );
};

Transaction.displayName = 'Transaction';

export { Transaction };
