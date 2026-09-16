import { Octicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import {
  ApiChain,
  apiChainToViemChainOrThrow,
  formatEthAddress,
} from 'farcaster-client-data';
import { useFetchToken } from 'farcaster-client-hooks';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  useCopyText,
  useEmbeddedWallet,
  usePublicClient,
} from 'farcaster-expo';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { erc20Abi, formatUnits } from 'viem';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export const useFundWalletData = ({
  chain,
  cas,
  requiredUsdValue,
  refetchInterval,
}: {
  chain: ApiChain;
  cas: string[];
  requiredUsdValue: number;
  refetchInterval?: number;
}) => {
  const { evmAddress } = useEmbeddedWallet();
  const { getEthereumClient } = usePublicClient();
  const fetchToken = useFetchToken();

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['fund-wallet-tokens', evmAddress, chain],
    queryFn: async () => {
      if (!evmAddress) {
        return [];
      }

      const client = getEthereumClient({
        chain: apiChainToViemChainOrThrow(chain),
      });
      const data = await Promise.all(
        cas.map(async (ca) => {
          ca = chain === 'solana' ? ca : ca.toLowerCase();
          return await Promise.all([
            fetchToken({ chain, ca }),
            ca === EIP7528_NATIVE_ASSET_ADDRESS.toLowerCase()
              ? client.getBalance({ address: evmAddress as `0x${string}` })
              : client.readContract({
                  address: ca as `0x${string}`,
                  abi: erc20Abi,
                  functionName: 'balanceOf',
                  args: [evmAddress as `0x${string}`],
                }),
          ]);
        }),
      );

      return data.map((d) => {
        const [token, balance] = d;
        return {
          token: token.token,
          balance,
        };
      });
    },
    refetchInterval,
  });

  const { missingUsdValue, usdValue } = useMemo(() => {
    if (!data) {
      return {
        missingUsdValue: null,
        usdValue: null,
      };
    }

    const usdValue = data.reduce((acc, d) => {
      if (!d.token) {
        return acc;
      }

      const amount = parseFloat(formatUnits(d.balance, d.token.decimals ?? 18));
      return acc + amount * Number(d.token.priceUsd ?? '0');
    }, 0);

    return {
      missingUsdValue: Math.max(
        0,
        Math.ceil((requiredUsdValue - usdValue) * 100) / 100,
      ),
      usdValue,
    };
  }, [data, requiredUsdValue]);

  const tokens = useMemo(() => {
    const tickers = data?.map((d) => d.token?.ticker).filter(Boolean) ?? [];
    if (tickers.length === 0) {
      return '';
    } else if (tickers.length === 1) {
      return tickers[0];
    } else if (tickers.length === 2) {
      return `${tickers[0]} or ${tickers[1]}`;
    } else {
      const lastTicker = tickers[tickers.length - 1];
      const allButLast = tickers.slice(0, tickers.length - 1).join(', ');
      return `${allButLast}, or ${lastTicker}`;
    }
  }, [data]);

  return {
    missingUsdValue,
    usdValue,
    tokens,
    isLoading,
    isRefetching,
  };
};

const FundWalletBottomSheet = ({
  chain,
  cas,
  requiredUsdValue,
  onComplete,
  onDismiss,
}: {
  chain: ApiChain;
  cas: string[];
  requiredUsdValue: number;
  onComplete: () => void;
  onDismiss: () => void;
}) => {
  const t = useTheme();
  const { evmAddress } = useEmbeddedWallet();
  const { copy, copied } = useCopyText({ text: evmAddress ?? '' });
  const { missingUsdValue, tokens } = useFundWalletData({
    chain,
    cas,
    requiredUsdValue,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (missingUsdValue === 0) {
      onComplete();
      onDismiss();
    }
  }, [missingUsdValue, onComplete, onDismiss]);

  if (missingUsdValue === 0) {
    return null;
  }

  return (
    <AutoDisplayingBottomSheetModal
      name="secure-mode-bottom-disable-sheet"
      onDismiss={onDismiss}
    >
      <View style={[{ gap: 12 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
          <FundWalletIcon />
          <Text2 weight="semibold" size="2xl">
            Fund your wallet
          </Text2>
        </View>
        {missingUsdValue !== null && (
          <Text2 color="primary">
            {`You need $${missingUsdValue.toFixed(2)} more in ${tokens} to claim your reward. Send funds to the wallet address below.`}
          </Text2>
        )}
        {evmAddress ? (
          <View style={[t.mT3, { gap: 12 }]}>
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.p4,
                t.bgFaint,
                t.roundedLg,
                { gap: 12 },
              ]}
            >
              <Text2 weight="medium" numberOfLines={1}>
                {formatEthAddress(evmAddress)}
              </Text2>
              <ActivityIndicator size="small" />
            </View>
            <ButtonV2
              onPress={copy}
              title={copied ? 'Copied!' : 'Copy address'}
              Icon={({ color }) =>
                copied ? (
                  <Octicons name="check" size={24} color={color} />
                ) : null
              }
              textSize="lg"
            />
          </View>
        ) : (
          <ActivityIndicator size="small" color={t.colors.loadingIndicator} />
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

export { FundWalletBottomSheet };

const FundWalletIcon = () => {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <Rect width={40} height={40} rx={20} fill="#F0EDFF" />
      <Path
        d="M12.73 17.063h12.5c.146 0 .292.009.437.027a2.578 2.578 0 00-3.027-2.17l-10.28 1.755h-.012a2.578 2.578 0 00-1.605 1.02 3.421 3.421 0 011.987-.633zm12.5.937h-12.5a2.503 2.503 0 00-2.5 2.5V28a2.503 2.503 0 002.5 2.5h12.5a2.502 2.502 0 002.5-2.5v-7.5a2.503 2.503 0 00-2.5-2.5zm-1.855 7.5a1.25 1.25 0 110-2.501 1.25 1.25 0 010 2.501z"
        fill="#7C65C1"
      />
      <Path
        d="M10.25 23.137V19.25c0-.846.469-2.266 2.096-2.573 1.38-.259 2.748-.259 2.748-.259s.898.625.156.625-.723.957 0 .957 0 .918 0 .918l-2.91 3.3-2.09.919z"
        fill="#7C65C1"
      />
      <G clipPath="url(#clip0_6426_179210)">
        <Path d="M27.8 16.6a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" fill="#7C65C1" />
        <Path
          d="M27.217 11.933h.583v2.334"
          stroke="#F0EDFF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22.667 12.917a4.25 4.25 0 100-8.5 4.25 4.25 0 000 8.5z"
          fill="#7C65C1"
          stroke="#F0EDFF"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22.083 7.5h.584v2.333"
          stroke="#F0EDFF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_6426_179210">
          <Path fill="#fff" transform="translate(18 4)" d="M0 0H14V14H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};
