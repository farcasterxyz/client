import { Octicons } from '@expo/vector-icons';
import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser, formatCents, formatEthAddress } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  resolveUsername,
  useCompletePeerToPeerPayment,
  useNonSuspensePrimaryAddress,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { GetWalletClient, useRootToast } from 'farcaster-expo';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BaseError,
  createPublicClient,
  erc20Abi,
  Hex,
  http,
  numberToHex,
  UserRejectedRequestError,
  WriteContractErrorType,
} from 'viem';
import { base } from 'viem/chains';

import { Avatar } from '~/components/Avatar';
import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { Button } from '~/components/Button';
import { Text, Text2 } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import {
  ConnectedWalletProvider,
  useConnectedWallet,
} from '~/contexts/ConnectWalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { logErrorInDevOnly } from '~/utils/LogUtils';

import { useTheme } from './ThemeProvider';

export type PayUserParams = {
  user: ApiUser;
  via: 'profile' | 'direct-cast-conversation' | 'cast';
};

type PayUserContextValue = {
  launchPayUser: (params: PayUserParams) => void;
};

const PayUserContext = React.createContext<PayUserContextValue>({
  launchPayUser: () => {
    throw new Error('Must be called in PayUserContext');
  },
});

type PayUserProviderProps = {
  children: React.ReactNode;
};

export function PayUserProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectedWalletProvider>
      <InnerPayUserProvider>{children}</InnerPayUserProvider>
    </ConnectedWalletProvider>
  );
}

const InnerPayUserProvider: React.FC<PayUserProviderProps> = React.memo(
  ({ children }) => {
    const { trackEvent } = useTrackEvent();
    const [params, setParams] = React.useState<PayUserParams | null>(null);

    const { wallet, connect } = useConnectedWallet();

    const bottomSheetModalRef = useBottomSheetModalRef();

    const launchPayUser = useCallback(
      async (params: PayUserParams) => {
        trackEvent(AnalyticsEvent.ClickPayUser, {
          targetFid: params.user.fid,
          via: params.via,
          hasCoinbaseWallet: true,
          hasConnectedAddress: !!wallet.address,
        });

        if (!wallet.address) {
          await connect();
        }

        setParams(params);
        bottomSheetModalRef.current?.present();
      },
      [trackEvent, wallet.address, bottomSheetModalRef, connect],
    );

    const contextValue = useMemo(
      () => ({
        launchPayUser,
      }),
      [launchPayUser],
    );

    return (
      <PayUserContext.Provider value={contextValue}>
        {children}

        <BottomSheetModal
          name="payUser"
          ref={bottomSheetModalRef}
          onDismiss={() => setParams(null)}
          snapPoints={[434]}
          enableDynamicSizing={false}
        >
          {!!params && (
            <PayUserBottomSheet
              {...params}
              address={wallet.address}
              getWalletClient={wallet.getWalletClient}
              connect={connect}
              close={() => {
                bottomSheetModalRef.current?.dismiss();
              }}
            />
          )}
        </BottomSheetModal>
      </PayUserContext.Provider>
    );
  },
);

PayUserProvider.displayName = 'PayUserProvider';

function PayUserBottomSheet(
  props: PayUserParams & {
    address?: string;
    getWalletClient: GetWalletClient;
    connect: () => Promise<readonly Hex[] | undefined>;
    close: () => void;
  },
) {
  const { data: primaryAddressData, isPending } = useNonSuspensePrimaryAddress({
    fid: props.user.fid,
  });

  if (isPending) {
    return <LoadingBottomSheet />;
  }

  if (!props.address) {
    return <LoadingBottomSheet text="Connecting to wallet" />;
  }

  if (primaryAddressData?.address === undefined) {
    return <NoPrimaryAddress targetUser={props.user} close={props.close} />;
  }

  return (
    <PayUser
      {...props}
      address={props.address}
      getWalletClient={props.getWalletClient}
      connect={props.connect}
      toAddress={primaryAddressData?.address}
    />
  );
}

function LoadingBottomSheet({ text }: { text?: string }) {
  const t = useTheme();

  return (
    <BottomSheetContentContainer
      style={[t.flex1, t.justifyCenter, t.itemsCenter, t.pX4, { gap: 12 }]}
    >
      <ActivityIndicator size="large" color={t.colors.loadingIndicator} />
      {!!text && <Text2 color="secondary">{text}</Text2>}
    </BottomSheetContentContainer>
  );
}

function NoPrimaryAddress({
  targetUser,
  close,
}: {
  targetUser: ApiUser;
  close: () => void;
}) {
  const t = useTheme();
  const currentUser = useCurrentUser_UNSAFE();
  const { trackEvent } = useTrackEvent();
  const navigate = useNavigate();
  const { bottom } = useSafeAreaInsets();

  const username = resolveUsername({
    fid: targetUser.fid,
    username: targetUser.username,
  });

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewPayUserNoAddress, {
      targetFid: targetUser.fid,
    });
  }, [trackEvent, targetUser]);

  return (
    <BottomSheetView>
      <View style={[t.pX4, { paddingBottom: Math.max(bottom, 8) }]}>
        <Text2 size="3xl" weight="semibold">
          No wallet found
        </Text2>
        <Text2 size="lg" style={[t.mT1]}>
          {username} needs to connect a wallet to receive your payment.
        </Text2>
        <View style={[t.mT6]}>
          <Button
            title="Send a message"
            onPress={() => {
              trackEvent(AnalyticsEvent.ClickPayUserNudgeForAddress, {});
              navigate('PlaintextDirectCastsConversation', {
                counterParty: targetUser,
                conversationId: buildNonGroupConversationId({
                  participantFids: [targetUser.fid, currentUser.fid],
                }),
                create: true,
                intentText: undefined,
              });
            }}
          />
          <Button
            title="Cancel"
            onPress={close}
            variant="mutedSecondary"
            style={[t.mT1]}
          />
        </View>
      </View>
    </BottomSheetView>
  );
}

const erc20 = {
  chainId: 8453,
  symbol: 'USDC',
  address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const,
  decimals: 6,
}; // hard-coded to USDC base for now

function PayUser({
  user,
  address,
  toAddress,
  close,
  getWalletClient,
  connect,
}: PayUserParams & {
  address: string;
  toAddress: string;
  close: () => void;
  getWalletClient: GetWalletClient;
  connect: () => Promise<readonly Hex[] | undefined>;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.pX4,
          { paddingBottom: Math.max(bottom, 8) },
        ]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <Text2 size="2xl" weight="semibold">
            Pay
          </Text2>
        </View>
        <View style={[t.pT4]}>
          <PayWithUSDC
            user={user}
            close={close}
            address={address}
            toAddress={toAddress}
            getWalletClient={getWalletClient}
            connect={connect}
          />
        </View>
      </View>
    </BottomSheetView>
  );
}

function PayWithUSDC({
  user,
  address,
  toAddress,
  close,
  getWalletClient,
  connect,
}: Omit<PayUserParams, 'via'> & {
  address: string;
  toAddress: string;
  close: () => void;
  getWalletClient: GetWalletClient;
  connect: () => Promise<readonly Hex[] | undefined>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null);
  const t = useTheme();
  const currentUser = useCurrentUser_UNSAFE();
  const { show } = useRootToast();
  const { trackEvent } = useTrackEvent();
  const completePayment = useCompletePeerToPeerPayment();
  const username = useMemo(
    () => resolveUsername({ username: user.username, fid: user.fid }),
    [user],
  );

  const { data: balance } = useQuery({
    queryKey: ['readContract', erc20.address, 'balanceOf', address],
    queryFn: () =>
      publicClient.readContract({
        address: erc20.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Hex],
      }),
    refetchOnMount: 'always',
  });

  const [walletError, setWalletError] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const amountAsNumber = Number(amount);
  const amountAsBigint = isNaN(amountAsNumber)
    ? undefined
    : BigInt(Math.floor(amountAsNumber * 10 ** erc20.decimals));

  const insufficientFunds =
    typeof balance !== 'undefined' ? (amountAsBigint ?? 0n) > balance : false;
  const disabled =
    isNaN(amountAsNumber) || amountAsNumber <= 0 || insufficientFunds;

  const continueTitle = useMemo(() => {
    if (insufficientFunds) {
      return 'Insufficient funds';
    }

    if (amount === '') {
      return 'Enter amount';
    }

    return 'Confirm';
  }, [insufficientFunds, amount]);

  const requestPayment = async () => {
    if (disabled) {
      return;
    }

    trackEvent(AnalyticsEvent.ClickPayUserContinueInWallet, {
      targetFid: user.fid,
      amount: amountAsNumber,
      ...erc20,
    });

    let fidHex = numberToHex(currentUser.fid);
    if (fidHex.length % 2 !== 0) {
      fidHex = fidHex.replace('0x', '0x0') as Hex;
    }

    try {
      const walletClient = await getWalletClient(base);
      const txhash = await walletClient.writeContract({
        address: erc20.address,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as Hex, BigInt(amountAsNumber * 10 ** erc20.decimals)],
        dataSuffix: fidHex,
      });

      trackEvent(AnalyticsEvent.CompletePayUserTransaction, {
        targetFid: user.fid,
        amount: amountAsNumber,
        ...erc20,
      });

      void completePayment({
        transactionHash: txhash,
        targetFid: user.fid,
      });

      close();
      show(`You paid ${username} ${formatCents(amountAsNumber * 100)}`);

      return;
    } catch (e) {
      logErrorInDevOnly(e);
      const err = e as WriteContractErrorType;

      if (
        err instanceof BaseError &&
        err.walk((wErr) => wErr instanceof UserRejectedRequestError)
      ) {
        setWalletError('Transaction rejected in wallet.');
        return;
      }

      trackEvent(AnalyticsEvent.PayUserTransactionError, {
        targetFid: user.fid,
        amount: amountAsNumber,
        ...erc20,
        error: err.name,
      });

      setWalletError('Send failed.');
    }
  };

  return (
    <>
      <Pressable
        style={[t.itemsCenter, t.wFull, t.pY8]}
        onPress={() => inputRef.current?.focus()}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <Text
            style={[
              t.texts.primary,
              t.fontSemibold,
              { fontSize: 36, lineHeight: 40, marginRight: 2 },
            ]}
          >
            $
          </Text>
          <BottomSheetTextInput
            ref={inputRef}
            keyboardType="numeric"
            placeholder="0"
            value={amount}
            style={[
              t.bgTransparent,
              t.border0,
              t.texts.primary,
              t.fontSemibold,
              { fontSize: 48, lineHeight: 54 },
            ]}
            onChangeText={(val) => {
              const includesDecimalSep = val.includes('.');
              const numericChars = val.replace(/[^0-9.]/g, '');
              if (includesDecimalSep) {
                const [whole, decimal] = numericChars.split('.');
                setAmount(whole + '.' + (decimal ? decimal.slice(0, 2) : ''));
              } else {
                setAmount(numericChars);
              }
            }}
          />
        </View>
        <View style={[t.flexRow, t.itemsCenter, t.mT2, { height: 30 }]}>
          {insufficientFunds && !walletError && (
            <Text2 size="sm" color="danger">
              You only have{' '}
              {formatCents(
                Number((balance ?? 0n) / 10n ** BigInt(erc20.decimals - 2)),
              ).slice(1)}{' '}
              USDC in your wallet.
            </Text2>
          )}
          {walletError && (
            <View
              style={[
                t.textCenter,
                t.pX4,
                t.pY1,
                t.roundedLg,
                t.texts.danger,
                { backgroundColor: '#D5133812' },
              ]}
            >
              <Text2 color="danger">{walletError}</Text2>
            </View>
          )}
        </View>
      </Pressable>
      <View style={[t.mT4, t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2 size="sm" color="tertiary" style={[t.flexNone]}>
          To
        </Text2>
        <View style={[t.flexNone, t.flex, t.flexRow, t.itemsCenter]}>
          <Avatar
            pfpUrl={user.pfp?.url}
            diameter={20}
            style={[t.mR2]}
            shouldFadeIn={false}
          />
          <Text2 weight="semibold">{username}</Text2>
        </View>
      </View>
      <View style={[t.mT4, t.flexRow, t.justifyBetween, t.itemsCenter]}>
        <Text2 color="tertiary">From</Text2>
        <TouchableOpacity
          style={[t.flexRow, t.itemsCenter]}
          onPress={connect}
          hitSlop={hitSlop}
        >
          <Text2 style={[t.mR2]}>{formatEthAddress(address)}</Text2>
          <Octicons name="chevron-right" color={t.colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={[t.mT6]}>
        <Button
          title={continueTitle}
          disabled={disabled}
          onPress={requestPayment}
        />
      </View>
    </>
  );
}

const publicClient = createPublicClient({
  chain: base,
  // Experimental feature so shipping with an authenticated RPC url that is restricted
  // to only allow reads on the Base USDC contract. Consider securing on a server if
  // usage increases.
  transport: http(
    'https://base-mainnet.g.alchemy.com/v2/REPLACE_ME',
  ),
});

export const usePayUser = () => React.useContext(PayUserContext);
