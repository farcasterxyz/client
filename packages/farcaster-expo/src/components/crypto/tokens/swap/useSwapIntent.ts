import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiSwapIntent,
  ApiTokenLink,
  chainIdToChainOrThrow,
  isUsdc,
} from 'farcaster-client-data';
import { useFetchToken } from 'farcaster-client-hooks';
import React from 'react';

import { useSharedTelemetry } from '../../../../contexts';
import {
  getTokenFromGlobalCache,
  useHaptics,
  useTokenBalance,
  useWalletBalances,
} from '../../../../hooks';
import {
  formatTokenDecimals,
  isNativeAsset,
  isSameAsset,
  logErrorInDevOnly,
  parseTokenAmount,
  sortBalancesByPriority,
  toAnalyticsName,
  tokenLinkToMinimalToken,
  tokenPositionToMinimalToken,
  tokenPositionToTokenLink,
  USDC_ADDRESSES,
} from '../../../../utils';

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location.search.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][useSwapIntent]', ...args);
};

export function useSwapIntent({
  swapIntent,
  isBuy,
  isSell,
}: {
  swapIntent?: ApiSwapIntent;
  isBuy?: boolean;
  isSell?: boolean;
}) {
  const [sellToken, setSellToken] = React.useState<ApiTokenLink | undefined>(
    undefined,
  );
  const [buyToken, setBuyToken] = React.useState<ApiTokenLink | undefined>(
    undefined,
  );
  const [sellAmount, setSellAmount] = React.useState<string>('');
  const isSellExperience =
    (!!swapIntent?.sell?.address && !swapIntent?.buy?.address) || !!isSell;
  const isBuyExperience =
    (!!swapIntent?.buy?.address && !swapIntent?.sell?.address) || !!isBuy;

  const fetchToken = useFetchToken();
  const { balances } = useWalletBalances();
  const { trackEvent } = useSharedTelemetry();
  const { triggerImpactAsync } = useHaptics();
  const queryClient = useQueryClient();

  const resolveBuyTokenForSell = React.useCallback(
    async (sellToken: ApiTokenLink): Promise<ApiTokenLink | undefined> => {
      const prioritizedBalances = sortBalancesByPriority(
        balances,
        sellToken.chain,
      );

      if (!isUsdc(sellToken.ca)) {
        const usdcChainCa = USDC_ADDRESSES[sellToken.chain];
        if (usdcChainCa) {
          try {
            const cachedToken = getTokenFromGlobalCache(
              queryClient,
              sellToken.chain,
              usdcChainCa,
            );
            if (cachedToken) {
              return cachedToken;
            }

            const fetchedToken = await fetchToken({
              ca: usdcChainCa,
              chain: sellToken.chain,
            });
            if (fetchedToken?.token) {
              return fetchedToken.token;
            }
          } catch (error) {
            logErrorInDevOnly(error);
          }
        }
      }

      const filteredBalances = prioritizedBalances.filter((token) => {
        const isSame = isSameAsset({
          chain: token.chain,
          ca: token.ca,
          asset: sellToken,
        });
        if (isSame) {
          return false;
        }

        const isSellNative = isNativeAsset(sellToken.ca);
        const isTokenNative = isNativeAsset(token.ca);
        if (isSellNative && isTokenNative) {
          const isSellSolana = sellToken.chain === 'solana';
          const isTokenSolana = token.chain === 'solana';
          return isSellSolana || isTokenSolana;
        }

        const isSellUsdc = isUsdc(sellToken.ca);
        const isTokenUsdc = isUsdc(token.ca);
        if (isSellUsdc && isTokenUsdc) {
          return false;
        }

        return true;
      });

      return filteredBalances[0];
    },
    [balances, fetchToken, queryClient],
  );

  const initialize = React.useCallback(
    async (swapIntent?: ApiSwapIntent) => {
      let buyToken: ApiTokenLink | undefined;
      let sellToken: ApiTokenLink | undefined;

      if (swapIntent?.buy) {
        const token = await fetchToken({
          ca: swapIntent.buy.address,
          chain: chainIdToChainOrThrow(swapIntent.buy.chainId.toString()),
        });
        if (token?.token) {
          buyToken = token.token;
        }
      }

      if (swapIntent?.sell) {
        const token = balances.find((balance) => {
          if (!swapIntent.sell) {
            return false;
          }

          const address = swapIntent.sell.address;
          const chain = chainIdToChainOrThrow(
            swapIntent.sell.chainId.toString(),
          );

          return isSameAsset({
            chain,
            ca: address,
            asset: tokenPositionToMinimalToken(balance),
          });
        });
        if (token) {
          sellToken = tokenPositionToTokenLink(token);
        }
      }

      if (!sellToken && !buyToken && !isSellExperience) {
        const prioritizedBalances = sortBalancesByPriority(balances, 'base');
        sellToken = prioritizedBalances[0];
      } else if (!sellToken && buyToken) {
        const prioritizedBalances = sortBalancesByPriority(
          balances,
          buyToken.chain,
        );
        const filteredBalances = prioritizedBalances.filter((token) => {
          if (!buyToken) {
            return false;
          }

          const isSame = isSameAsset({
            chain: token.chain,
            ca: token.ca,
            asset: buyToken,
          });
          if (isSame) {
            return false;
          }

          const isBuyNative = isNativeAsset(buyToken?.ca);
          const isTokenNative = isNativeAsset(token.ca);
          if (isBuyNative && isTokenNative) {
            const isBuySolana = buyToken?.chain === 'solana';
            const isTokenSolana = token.chain === 'solana';
            return isBuySolana || isTokenSolana;
          }

          const isBuyUsdc = isUsdc(buyToken?.ca);
          const isTokenUsdc = isUsdc(token.ca);
          if (isBuyUsdc && isTokenUsdc) {
            return false;
          }

          return true;
        });
        sellToken = filteredBalances[0];
      } else if (sellToken && !buyToken) {
        buyToken = await resolveBuyTokenForSell(sellToken);
      }

      siwfLog('initialize() resolved tokens', {
        resolvedBuyCa: buyToken?.ca,
        resolvedSellCa: sellToken?.ca,
        intentBuyAddr: swapIntent?.buy?.address,
        intentSellAddr: swapIntent?.sell?.address,
        balancesLen: balances.length,
        ts: Date.now(),
      });

      if (sellToken) {
        setSellToken(sellToken);
        if (swapIntent?.sellAmount) {
          const amount = parseTokenAmount(
            swapIntent.sellAmount,
            formatTokenDecimals(sellToken.chain, sellToken.decimals),
          );
          setSellAmount(amount.toString());
        }
      }

      if (buyToken) {
        setBuyToken(buyToken);
      }

      trackEvent(AnalyticsEvent.ViewWalletSwap, {
        version: '2',
        sellToken: sellToken
          ? toAnalyticsName(tokenLinkToMinimalToken(sellToken))
          : undefined,
        buyToken: buyToken
          ? toAnalyticsName(tokenLinkToMinimalToken(buyToken))
          : undefined,
      });
    },
    [
      fetchToken,
      balances,
      trackEvent,
      isSellExperience,
      resolveBuyTokenForSell,
    ],
  );

  React.useEffect(() => {
    const shouldInitialize = isSellExperience ? !sellToken : !buyToken;
    siwfLog('swapIntent effect', {
      hasBuyToken: !!buyToken,
      hasSellToken: !!sellToken,
      intentBuyAddr: swapIntent?.buy?.address,
      intentSellAddr: swapIntent?.sell?.address,
      willInitialize: shouldInitialize,
      ts: Date.now(),
    });
    if (shouldInitialize) {
      initialize(swapIntent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapIntent]);

  // When the user picks a sell token from the wallet trade flow (no swapIntent),
  // auto-select USDC as the buy token — same as token-info instant sell.
  React.useEffect(() => {
    if (!isSellExperience || !sellToken || buyToken) {
      return;
    }

    let cancelled = false;

    resolveBuyTokenForSell(sellToken).then((token) => {
      if (!cancelled && token) {
        setBuyToken(token);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isSellExperience, sellToken, buyToken, resolveBuyTokenForSell]);

  const buyTokenRef = React.useRef(buyToken);
  const sellTokenRef = React.useRef(sellToken);
  buyTokenRef.current = buyToken;
  sellTokenRef.current = sellToken;

  React.useEffect(() => {
    if (!buyToken?.ca || !buyToken?.chain) return;

    const requestedCa = buyToken.ca;
    const requestedChain = buyToken.chain;
    let active = true;

    const fetchFullToken = async () => {
      try {
        const res = await fetchToken({
          ca: requestedCa,
          chain: requestedChain,
        });
        const currentBuyToken = buyTokenRef.current;
        if (
          !active ||
          !res?.token ||
          !currentBuyToken ||
          !isSameAsset({
            chain: requestedChain,
            ca: requestedCa,
            asset: currentBuyToken,
          })
        ) {
          return;
        }
        if (
          res.token.decimals !== currentBuyToken.decimals ||
          res.token.name !== currentBuyToken.name ||
          res.token.ticker !== currentBuyToken.ticker
        ) {
          setBuyToken(res.token);
        }
      } catch (err) {
        logErrorInDevOnly(err);
      }
    };

    fetchFullToken();
    return () => {
      active = false;
    };
  }, [buyToken?.ca, buyToken?.chain, fetchToken]);

  React.useEffect(() => {
    if (!sellToken?.ca || !sellToken?.chain) return;

    const requestedCa = sellToken.ca;
    const requestedChain = sellToken.chain;
    let active = true;

    const fetchFullToken = async () => {
      try {
        const res = await fetchToken({
          ca: requestedCa,
          chain: requestedChain,
        });
        const currentSellToken = sellTokenRef.current;
        if (
          !active ||
          !res?.token ||
          !currentSellToken ||
          !isSameAsset({
            chain: requestedChain,
            ca: requestedCa,
            asset: currentSellToken,
          })
        ) {
          return;
        }
        if (
          res.token.decimals !== currentSellToken.decimals ||
          res.token.name !== currentSellToken.name ||
          res.token.ticker !== currentSellToken.ticker
        ) {
          setSellToken(res.token);
        }
      } catch (err) {
        logErrorInDevOnly(err);
      }
    };

    fetchFullToken();
    return () => {
      active = false;
    };
  }, [sellToken?.ca, sellToken?.chain, fetchToken]);

  const buyTokenBalance = React.useMemo(() => {
    if (!buyToken) {
      return undefined;
    }
    return balances.find((balance) =>
      isSameAsset({
        chain: buyToken.chain,
        ca: buyToken.ca,
        asset: tokenPositionToMinimalToken(balance),
      }),
    )?.quantity.int;
  }, [buyToken, balances]);

  const buyTokenUsdBalance = React.useMemo(() => {
    if (!buyToken) {
      return undefined;
    }
    return balances.find((balance) =>
      isSameAsset({
        chain: buyToken.chain,
        ca: buyToken.ca,
        asset: tokenPositionToMinimalToken(balance),
      }),
    )?.value;
  }, [buyToken, balances]);

  const balance = useTokenBalance({
    chain: sellToken?.chain,
    ca: sellToken?.ca,
    forceFreshPrice: isSellExperience,
  });
  const sellTokenBalance = React.useMemo(() => {
    return balance?.data?.quantity.int;
  }, [balance]);
  const sellTokenUsdBalance = React.useMemo(() => {
    if (!sellToken) {
      return undefined;
    }
    return balances.find((balance) =>
      isSameAsset({
        chain: sellToken.chain,
        ca: sellToken.ca,
        asset: tokenPositionToMinimalToken(balance),
      }),
    )?.value;
  }, [sellToken, balances]);
  const sellTokenPriceUsd = React.useMemo(() => {
    if (balance?.data?.priceUsd) {
      return balance.data.priceUsd;
    }
    const tokenPriceUsd = Number(sellToken?.priceUsd ?? 0);
    return tokenPriceUsd > 0 ? tokenPriceUsd : undefined;
  }, [balance, sellToken?.priceUsd]);

  const handleSetSellToken = React.useCallback(
    (token?: ApiTokenLink) => {
      triggerImpactAsync();
      setSellToken(token);
      setSellAmount('');
      if (token) {
        trackEvent(AnalyticsEvent.SwapSelectSellToken, {
          version: '2',
          sellToken: toAnalyticsName(tokenLinkToMinimalToken(token)),
        });
        if (
          buyToken &&
          isSameAsset({
            chain: token.chain,
            ca: token.ca,
            asset: buyToken,
          })
        ) {
          setBuyToken(undefined);
        }
      }
    },
    [triggerImpactAsync, setSellToken, trackEvent, buyToken],
  );

  const handleSetBuyToken = React.useCallback(
    (token?: ApiTokenLink) => {
      triggerImpactAsync();
      setBuyToken(token);
      if (token) {
        trackEvent(AnalyticsEvent.SwapSelectBuyToken, {
          version: '2',
          buyToken: toAnalyticsName(tokenLinkToMinimalToken(token)),
        });
        if (
          sellToken &&
          isSameAsset({
            chain: token.chain,
            ca: token.ca,
            asset: sellToken,
          })
        ) {
          setSellToken(undefined);
        }
      }
    },
    [triggerImpactAsync, setBuyToken, trackEvent, sellToken],
  );

  const reverseTokens = React.useCallback(
    (sellAmount?: string) => {
      triggerImpactAsync();
      const newSellToken = buyToken;
      const newBuyToken = sellToken;
      setSellToken(newSellToken);
      setBuyToken(newBuyToken);
      if (sellAmount) {
        setSellAmount(sellAmount);
      }
      trackEvent(AnalyticsEvent.SwapReverseTokens, {
        version: '2',
        sellToken: newSellToken
          ? toAnalyticsName(tokenLinkToMinimalToken(newSellToken))
          : undefined,
        buyToken: newBuyToken
          ? toAnalyticsName(tokenLinkToMinimalToken(newBuyToken))
          : undefined,
      });
    },
    [
      triggerImpactAsync,
      setSellToken,
      setBuyToken,
      buyToken,
      sellToken,
      setSellAmount,
      trackEvent,
    ],
  );

  return {
    balances,
    sellToken,
    buyToken,
    sellAmount,
    setSellAmount,
    setSellToken: handleSetSellToken,
    setBuyToken: handleSetBuyToken,
    reverseTokens,
    buyTokenBalance,
    sellTokenBalance,
    isSellExperience,
    isBuyExperience,
    sellTokenUsdBalance,
    sellTokenPriceUsd,
    buyTokenUsdBalance,
  };
}
