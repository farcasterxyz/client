import {
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import { formatPrice, formatTokenStat } from 'farcaster-client-hooks';
import { Triangle } from 'lucide-react';
import React, { useMemo } from 'react';
import { formatUnits } from 'viem';

import { TokenIcon } from '~/components/tokens/TokenIcon';

export const FIXED_TOKEN_FIP2_CARD_HEIGHT = 64;

export type TokenCardOnDismiss = (() => void) | undefined;

function parseTokenAmount(amount: string | bigint, decimals: number): number {
  if (typeof amount === 'string') {
    amount = BigInt(amount);
  }
  return parseFloat(formatUnits(amount, decimals));
}

function TokenFIP2Card({
  token,
  tx,
  tokenCardOnDismiss,
}: {
  token: ApiOnchainTokenMinimal;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  return (
    <TokenFIP2CardContent
      token={token}
      tx={tx}
      tokenCardOnDismiss={tokenCardOnDismiss}
    />
  );
}

function TokenFIP2CardContent({
  token,
  tx,
  tokenCardOnDismiss,
}: {
  token: ApiOnchainTokenMinimal;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  const tokenKey = buildCaip19TokenUri(token.chain, token.ca);

  const buy = useMemo(() => {
    if (typeof tx === 'undefined') {
      return undefined;
    }

    const buyTokenKey = buildCaip19TokenUri(tx.buyToken.chain, tx.buyToken.ca);

    if (tokenKey === buyTokenKey) {
      try {
        const buyUsdValue =
          parseTokenAmount(tx.buyAmount, tx.buyToken.decimals) *
          tx.buyToken.priceUsd;

        const formattedMarketCap = formatTokenStat(tx.buyToken.marketCap);
        const formattedMarketCapString =
          formattedMarketCap.indexOf('$') !== -1
            ? `at ${formattedMarketCap.split('$')[1]}`
            : '';

        return `Buy ${formatPrice(buyUsdValue)} ${formattedMarketCapString}`.trim();
      } catch {
        return undefined;
      }
    }
  }, [tokenKey, tx]);

  const sell = useMemo(() => {
    if (typeof tx === 'undefined') {
      return undefined;
    }

    const sellTokenKey = buildCaip19TokenUri(
      tx.sellToken.chain,
      tx.sellToken.ca,
    );

    if (tokenKey === sellTokenKey) {
      try {
        const sellUsdValue =
          parseTokenAmount(tx.sellAmount, tx.sellToken.decimals) *
          tx.sellToken.priceUsd;

        const formattedMarketCap = formatTokenStat(tx.sellToken.marketCap);
        const formattedMarketCapString =
          formattedMarketCap.indexOf('$') !== -1
            ? `at ${formattedMarketCap.split('$')[1]}`
            : '';

        return `Sell ${formatPrice(sellUsdValue)} ${formattedMarketCapString}`.trim();
      } catch {
        return undefined;
      }
    }
  }, [tokenKey, tx]);

  const tokenSubContextFormatted = useMemo(() => {
    if (typeof buy !== 'undefined') {
      return (
        <div className="flex flex-row items-center gap-1">
          <span className="text-sm font-medium text-muted">{buy}</span>
        </div>
      );
    }

    if (typeof sell !== 'undefined') {
      return (
        <div className="flex flex-row items-center gap-1">
          <span className="text-sm font-medium text-muted">{sell}</span>
        </div>
      );
    }

    if (typeof token.volumeH6 !== 'undefined') {
      return (
        <div className="flex flex-row items-center gap-1">
          <span className="text-sm font-medium text-muted">
            {`${formatTokenStat(token.volumeH6)} 6h vol`.trim()}
          </span>
        </div>
      );
    }

    return null;
  }, [buy, sell, token.volumeH6]);

  return (
    <div
      className="bg-default flex flex-row items-center justify-between rounded-[12px] border p-3 transition-colors border-default hover:bg-surface-secondary dark:bg-surface-secondary dark:hover:bg-overlay-medium"
      style={{
        height: FIXED_TOKEN_FIP2_CARD_HEIGHT,
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <TokenIcon
          iconUrl={token.imageUrl}
          diameter={30}
          imageBordered={false}
        />
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-1">
            <span className="text-base font-semibold text-default">
              ${token.symbol}
            </span>
          </div>
          {tokenSubContextFormatted}
        </div>
      </div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col items-end gap-1">
          {typeof token.marketCap !== 'undefined' && (
            <span className="text-base font-semibold text-secondary">
              {`${formatTokenStat(token.marketCap)}`}
            </span>
          )}
          {typeof token.priceChangePct !== 'undefined' && (
            <div className="flex flex-row items-center gap-1">
              <Triangle
                size={6}
                className={
                  token.priceChangePct < 0
                    ? 'text-danger fill-danger'
                    : 'text-success fill-success'
                }
                style={{
                  transform:
                    token.priceChangePct > 0
                      ? 'rotate(0deg)'
                      : 'rotate(180deg)',
                }}
              />
              <span className="text-sm font-medium text-muted">
                {`${Math.abs(token.priceChangePct).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%`}
              </span>
            </div>
          )}
        </div>
        {typeof tokenCardOnDismiss !== 'undefined' && (
          <button
            className="flex items-center justify-center rounded-full p-1 hover:bg-overlay-faint"
            onClick={(e) => {
              e.stopPropagation();
              tokenCardOnDismiss();
            }}
            style={{ marginTop: -4, marginRight: -4 }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              className="text-muted"
            >
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export { TokenFIP2Card, TokenFIP2CardContent };
