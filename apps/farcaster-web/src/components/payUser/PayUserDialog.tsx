import { Dialog } from '@headlessui/react';
// import { ArrowRightIcon } from '@primer/octicons-react';
import * as Tabs from '@radix-ui/react-tabs';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  useCompletePeerToPeerPayment,
  usePrimaryAddress,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { motion } from 'motion/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CurrencyInput from 'react-currency-input-field';
import {
  BaseError,
  createWalletClient,
  custom,
  erc20Abi,
  Hex,
  numberToHex,
  UserRejectedRequestError,
} from 'viem';
import { switchChain, writeContract } from 'viem/actions';
import { base } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { Alert } from '~/components/Alert';
import { AvatarImage } from '~/components/avatar/AvatarImage';
import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
// import { Divider2 } from '~/components/Divider';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SuccessGraphic } from '~/components/graphics/SuccessGraphic';
// import { Image } from '~/components/images/Image';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
// Frames v1 deprecated: legacy frame launcher removed
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useSendMessageToUser } from '~/hooks/useSendMessageToUser';
import { formatCents } from '~/utils/currencyUtils';
import { truncateAddress } from '~/utils/ethereumUtils';

// Removed other providers

type PayUserDialogProps = {
  user: ApiUser;
  close: () => void;
};

const PayUserDialog: React.FC<PayUserDialogProps> = React.memo(
  ({ user, close }) => {
    return (
      <Dialog open={true} onClose={close} className="relative z-50" static>
        <DialogBackdrop />
        <DialogPanelContainer>
          <Dialog.Panel className="w-full max-w-[390px] rounded-lg border bg-app border-default">
            <motion.div>
              <React.Suspense
                fallback={
                  <div className="flex h-40 flex-col items-center justify-center">
                    <LoadingIndicator />
                  </div>
                }
              >
                <div className="p-6">
                  <PayUserDialogContent user={user} close={close} />
                </div>
              </React.Suspense>
            </motion.div>
          </Dialog.Panel>
        </DialogPanelContainer>
      </Dialog>
    );
  },
);

function PayUserDialogContent({
  user,
  close,
}: {
  user: ApiUser;
  close: () => void;
}) {
  const { address } = useWallet();
  const { data: primaryAddressData } = usePrimaryAddress({ fid: user.fid });

  if (primaryAddressData?.address === undefined) {
    return <RecipientMissingConnectedAddress user={user} close={close} />;
  }

  return (
    <PayUser
      user={user}
      close={close}
      toAddress={primaryAddressData.address as Hex}
      fromAddress={address!}
    />
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
  fromAddress,
  toAddress,
  close,
}: {
  user: ApiUser;
  fromAddress: Hex;
  toAddress: Hex;
  close: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { trackEvent } = useTrackEvent();
  const username = useMemo(
    () => resolveUsername({ username: user.username, fid: user.fid }),
    [user],
  );

  const currentUser = useCurrentUser();
  const { provider, address } = useWallet();
  const completePayment = useCompletePeerToPeerPayment();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<BaseError | undefined>();

  const { data: senderBalance } = useReadContract({
    abi: erc20Abi,
    address: erc20.address,
    chainId: erc20.chainId,
    functionName: 'balanceOf',
    args: [fromAddress as Hex],
  });

  const [amount, setAmount] = useState('0');
  const [paidAmount, setPaidAmount] = useState<bigint | undefined>();
  const amountAsNumber = Number(amount);
  const amountAsBigint = isNaN(amountAsNumber)
    ? undefined
    : BigInt(Math.floor(amountAsNumber * 10 ** erc20.decimals));

  const insufficientFunds = senderBalance
    ? (amountAsBigint ?? 0) > senderBalance
    : false;

  const disabled =
    isPending ||
    isNaN(amountAsNumber) ||
    amountAsNumber <= 0 ||
    insufficientFunds;

  const continueTitle = useMemo(() => {
    if (insufficientFunds) {
      return 'Insufficient funds';
    }

    if (amount === '' || amount === '0') {
      return 'Enter amount';
    }

    return 'Continue in wallet';
  }, [insufficientFunds, amount]);

  const payUser = useCallback(async () => {
    if (disabled) {
      return;
    }

    if (!amountAsBigint) {
      throw new Error('Amount is undefined');
    }

    if (!provider || !address) {
      throw new Error('Provider or address is undefined');
    }

    const client = createWalletClient({
      account: address,
      chain: base,
      transport: custom(provider),
    });

    const currentChainId = await client.getChainId();

    if (currentChainId !== 8453) {
      await switchChain(client, { id: 8453 });
    }

    try {
      trackEvent(AnalyticsEvent.ClickPayUserContinueInWallet, {
        targetFid: user.fid,
        amount: amountAsNumber,
        ...erc20,
      });

      setPaidAmount(amountAsBigint);

      let fidHex = numberToHex(currentUser.fid);
      if (fidHex.length % 2 !== 0) {
        fidHex = fidHex.replace('0x', '0x0') as Hex;
      }

      setIsPending(true);
      const hash = await writeContract(client, {
        account: address,
        abi: erc20Abi,
        functionName: 'transfer',
        address: erc20.address,
        args: [toAddress, amountAsBigint],
        // append the FID to trx data so it can be associated with an account
        dataSuffix: fidHex,
      });

      void completePayment({
        targetFid: user.fid,
        transactionHash: hash,
      });

      trackEvent(AnalyticsEvent.CompletePayUserTransaction, {
        targetFid: user.fid,
        amount: amountAsNumber,
        ...erc20,
      });

      setIsSuccess(true);
    } catch (err) {
      setError(err as BaseError);
    } finally {
      setIsPending(false);
    }
  }, [
    trackEvent,
    completePayment,
    currentUser,
    toAddress,
    disabled,
    user.fid,
    address,
    provider,
    amountAsNumber,
    amountAsBigint,
  ]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return undefined;
    }

    if (error instanceof BaseError) {
      const rejectError = error.walk(
        (err) => err instanceof UserRejectedRequestError,
      );
      if (rejectError) {
        return 'Transaction rejected in wallet';
      }
    }

    return (
      (error as BaseError).shortMessage ?? error?.message ?? 'Unknown error.'
    );
  }, [error]);

  if (isSuccess) {
    return (
      <PaymentSuccess
        close={close}
        username={username}
        displayAmount={formatCents(
          Number((paidAmount ?? 0n) / 10n ** (BigInt(erc20.decimals) - 2n)),
        )}
      />
    );
  }

  return (
    <Tabs.Root
      defaultValue="usdc"
      orientation="horizontal"
      className="flex h-[340px] flex-col"
    >
      <div className="mb-5 flex flex-none flex-row justify-between">
        <div className="text-[20px] font-semibold leading-[28px]">Pay</div>
      </div>
      <div className="flex-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            payUser();
          }}
          className="flex h-full flex-col gap-4 pt-4"
        >
          <div
            className="flex w-full flex-1 cursor-text flex-col items-center justify-center"
            onClick={() => inputRef.current?.focus()}
          >
            <CurrencyInput
              intlConfig={{ locale: 'en-US', currency: 'USD' }}
              className="outline-hidden inline-block w-full border-none bg-transparent text-center text-5xl font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              ref={inputRef}
              placeholder="$0"
              onValueChange={(val) => {
                setAmount(val ?? '');
              }}
              autoFocus
              disabled={isPending}
            />
            <div className="mt-[8px] h-[30px]">
              {insufficientFunds && !errorMessage && (
                <div className="text-center text-sm text-danger">
                  You only have{' '}
                  {formatCents(
                    Number(
                      (senderBalance ?? 0n) /
                        10n ** (BigInt(erc20.decimals) - 2n),
                    ),
                  )}{' '}
                  USDC in your wallet.
                </div>
              )}
              {errorMessage && (
                <div className="pb-2">
                  <Alert message={errorMessage} type="danger" size="sm" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div className="tracking-[-.5px] text-[#999999]">To</div>
            <div className="flex flex-row items-center gap-2">
              <AvatarImage
                size="xs"
                imgUrl={user.pfp?.url}
                imgAlt={`${user.displayName} avatar`}
              />
              <div className="text-[15px] font-semibold leading-[24px]">
                {username}
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div className="tracking-[-.5px] text-[#999999]">From</div>
            <div className="flex flex-row items-center gap-2 py-[6px]">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                >
                  <circle cx="4" cy="4" r="4" className="fill-success" />
                </svg>
              </div>
              <div>{truncateAddress(fromAddress)}</div>
            </div>
          </div>
          <div>
            <DefaultButton
              isLoading={isPending}
              className="w-full"
              size="lg"
              disabled={disabled}
            >
              {continueTitle}
            </DefaultButton>
          </div>
        </form>
      </div>
    </Tabs.Root>
  );
}

// Removed other providers UI

function PaymentSuccess({
  username,
  displayAmount,
  close,
}: {
  username: string;
  displayAmount: string;
  close: () => void;
}) {
  return (
    <>
      <div className="flex flex-col items-center py-6">
        <SuccessGraphic />
        <div className="mb-1 mt-8 text-[26px] font-semibold">Payment sent</div>
        <div className="text-lg">
          You paid {username} {displayAmount}
        </div>
      </div>
      <div>
        <DefaultButton size="lg" className="w-full" onClick={close}>
          Close
        </DefaultButton>
      </div>
    </>
  );
}

function RecipientMissingConnectedAddress({
  user,
  close,
}: Omit<PayUserDialogProps, 'onPay'>) {
  const { trackEvent } = useTrackEvent();

  const username = useMemo(
    () => resolveUsername({ username: user.username, fid: user.fid }),
    [user],
  );

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewPayUserNoAddress, {
      targetFid: user.fid,
    });
  }, [trackEvent, user]);

  const sendMessage = useSendMessageToUser();

  return (
    <div>
      <div className="mb-1 text-[20px] font-semibold">
        {username} doesn’t have a wallet connected
      </div>
      <div className="mb-4 text-base text-muted">
        {username} needs to connect their crypto wallet to receive payments from
        others.
      </div>
      <div className="mb-2 mt-4 text-base font-semibold">
        Send them a message to ask them to connect their wallet.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DefaultButton onClick={close} variant="secondary" size="lg">
          Cancel
        </DefaultButton>
        <DefaultButton onClick={() => sendMessage({ user })} size="lg">
          Send message
        </DefaultButton>
      </div>
    </div>
  );
}

PayUserDialog.displayName = 'PayUserDialog';

export { PayUserDialog };
