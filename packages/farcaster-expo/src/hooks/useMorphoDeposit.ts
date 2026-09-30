import {
  ApiChain,
  ApiFarcasterWalletAction,
  extractWalletChain,
  GASLESS_CHAINS,
  getChain,
  getUsdcAddress,
  WalletChainId,
} from 'farcaster-client-data';
import {
  tokenQuantityToFloat,
  useFarcasterApiClient,
  useSwapTokensForGas,
  useWalletChainNativeAssetQuery,
} from 'farcaster-client-hooks';
import React from 'react';
import { encodeFunctionData, erc20Abi, erc4626Abi, formatUnits } from 'viem';
import { useEstimateFeesPerGas } from 'wagmi';

import { useEmbeddedWallet } from '../contexts';
import { executeQuoteAsync } from './useExecuteSwapForGas';
import { useWalletNativeBalance } from './useWalletNativeBalance';

const MORPHO_DEPOSIT_GAS_ESTIMATE = 400_000;

export const useMorphoDeposit = ({
  chain,
  ca,
  address,
  amount,
}: {
  chain: ApiChain;
  ca: string;
  address: string;
  amount: bigint;
}) => {
  const chainId = getChain(chain).getEnsuredChainId();
  const usdcAddress = getUsdcAddress(chain);
  if (!usdcAddress) {
    throw new Error(`USDC not supported for chain: ${chain}`);
  }

  const { apiClient } = useFarcasterApiClient();
  const { getWalletClient } = useEmbeddedWallet();

  const nativeBalance = useWalletNativeBalance({ chainId, address });
  const { data: nativeAsset } = useWalletChainNativeAssetQuery({
    params: { chainId },
    query: { enabled: amount > 0n },
  });

  const estimatedGas = BigInt(MORPHO_DEPOSIT_GAS_ESTIMATE);
  const { data: estimatedFeesPerGas, isPending: estimatedFeesPerGasIsPending } =
    useEstimateFeesPerGas({
      chainId: getChain(chain).getEnsuredChainId(),
      query: {
        refetchInterval: 1000 * 10,
        enabled: amount > 0n,
      },
    });

  // Since Cross-Chain Deposits would fail gas simulation, we simply hardcode
  // a gas estimate which is pretty accurate to compute the estimated fee cost.
  const { estimatedFeeUsd, insufficientFunds, estimatedFeeUsdPending } =
    React.useMemo(() => {
      // Disabled
      if (amount === 0n) {
        return {
          estimatedFeeUsd: 0,
          insufficientFunds: false,
          estimatedFeeUsdPending: false,
        };
      }

      // Loading State
      if (
        estimatedFeesPerGasIsPending ||
        !estimatedFeesPerGas ||
        !nativeAsset ||
        nativeBalance?.value === undefined
      ) {
        return {
          estimatedFeeUsd: undefined,
          insufficientFunds: undefined,
          estimatedFeeUsdPending: true,
        };
      }

      // Compute USD Value of the Fees
      const estimatedFee = estimatedFeesPerGas.maxFeePerGas * estimatedGas;
      const estimatedFeeUsd =
        nativeAsset.price *
        tokenQuantityToFloat({
          decimals: 18,
          quantity: estimatedFee,
          strategy: 'exact',
        });

      return {
        estimatedFeeUsd,
        insufficientFunds: nativeBalance.value < estimatedFee,
        estimatedFeeUsdPending: false,
      };
    }, [
      amount,
      estimatedFeesPerGas,
      estimatedFeesPerGasIsPending,
      estimatedGas,
      nativeAsset,
      nativeBalance?.value,
    ]);

  const couldFundGas = React.useMemo(() => {
    return GASLESS_CHAINS.includes(chain) && insufficientFunds === true;
  }, [chain, insufficientFunds]);

  const { data: fundGasQuote, isPending: isPendingFundGas } =
    useSwapTokensForGas({
      chainId,
      sellAmountBaseUnits: amount.toString(),
      sellToken: usdcAddress,
      enabled: couldFundGas,
    });

  const fundGas = React.useCallback(async () => {
    // UI should guard against this.
    if (!fundGasQuote?.quote.success) {
      return;
    }

    const chain = extractWalletChain({ id: chainId as WalletChainId });
    const walletClient = await getWalletClient(chain);

    const requestId = await executeQuoteAsync({
      quote: fundGasQuote.quote,
      chainId,
      apiClient,
      client: walletClient,
      applicationUsage: 'swap',
    });

    if (!requestId) {
      throw new Error('Failed to execute quote');
    }

    let confirmed = false;
    let tries = 0;
    do {
      try {
        const result = await apiClient.getGaslessStatus({
          requestId,
          chainId,
        });
        if (result.data.result?.status === 'confirmed') {
          confirmed = true;
          break;
        }
      } catch {
        // do nothing
      }
      tries++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } while (tries < 10);

    if (!confirmed) {
      throw new Error('Gasless swap failed');
    }
  }, [fundGasQuote, apiClient, chainId, getWalletClient]);

  const data: ApiFarcasterWalletAction[] = [];
  data.push({
    method: 'eth_sendTransaction',
    params: {
      chainId: chainId.toString(),
      to: usdcAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [ca as `0x${string}`, amount],
      }),
      value: '0',
    },
  });

  data.push({
    method: 'eth_sendTransaction',
    params: {
      chainId: chainId.toString(),
      to: ca as `0x${string}`,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: 'deposit',
        args: [amount, address as `0x${string}`],
      }),
      value: '0',
    },
  });

  const fundGasCoverAmountUsd = React.useMemo(() => {
    if (!fundGasQuote?.quote.success) {
      return undefined;
    }

    const price = fundGasQuote.quote.price.sell.token.price;
    if (!price) {
      return 0;
    }

    const amount = parseFloat(
      formatUnits(
        BigInt(fundGasQuote.quote.price.sell.amount ?? 0),
        fundGasQuote.quote.price.sell.token.decimals ?? 18,
      ),
    );

    return price * amount;
  }, [fundGasQuote]);

  return {
    data,
    estimatedFeeUsd,

    // Incorporate Possible Gasless Swap
    insufficientFunds:
      insufficientFunds && !couldFundGas && !fundGasQuote?.quote.success,

    // Incorporate Gas Funding Pending
    estimatedFeeUsdPending:
      estimatedFeeUsdPending || (couldFundGas && isPendingFundGas),

    // Fund Gas Quote & Async action.
    fundGas,
    fundGasQuote,
    fundGasCoverAmountUsd,
  };
};
