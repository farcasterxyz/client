import { InfoIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { isHandledFetchError } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useChannelCreationInfo,
  useCreateChannel,
  useDebouncedValue,
  useValidateNewChannelKey,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';

export const CHANNEL_KEY_VALIDATION_REGEX = /^[0-9a-z][0-9a-z-]{0,15}$/;
const INVALID_NAME_ERROR_MSG = 'Allowed characters: a-z, 0-9, - (not at start)';

// USDC payment configuration
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

const formatChainName = (chain: string): string => {
  return chain.charAt(0).toUpperCase() + chain.slice(1);
};

type PaymentState = 'idle' | 'paying' | 'confirming' | 'creating' | 'error';

type CreateChannelModalProps = {
  onClose: () => void;
};

const CreateChannelModal: FC<CreateChannelModalProps> = memo(({ onClose }) => {
  const { data } = useChannelCreationInfo();
  const navigateToChannel = useNavigateToChannel();
  const { trackEvent } = useAnalytics();
  const { sendToken } = useEmbeddedWalletBridge();

  const [localValidationError, setLocalValidationError] = useState<
    string | undefined
  >(undefined);
  const [serverValidationError, setServerValidationError] = useState<
    string | undefined
  >(undefined);
  const [serverCreationError, setServerCreationError] = useState<
    string | undefined
  >(undefined);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [key, setKey] = useState('');
  const debouncedKey = useDebouncedValue({
    value: key,
    debounceDuration: 300,
  });
  const createChannel = useCreateChannel();

  useEffect(() => {
    if (key && !CHANNEL_KEY_VALIDATION_REGEX.test(key)) {
      setLocalValidationError(INVALID_NAME_ERROR_MSG);
    } else {
      setLocalValidationError('');
    }
  }, [key]);

  const validateNewChannelKey = useValidateNewChannelKey();
  useEffect(() => {
    if (debouncedKey) {
      (async () => {
        const result = await validateNewChannelKey({
          channelKey: debouncedKey,
        });

        if (!result.valid) {
          setServerValidationError(INVALID_NAME_ERROR_MSG);
        } else if (!result.available) {
          setServerValidationError(
            `There is a already a ${debouncedKey} channel`,
          );
        } else {
          setServerValidationError('');
        }
      })();
    } else {
      setServerValidationError('');
    }
  }, [debouncedKey, validateNewChannelKey]);

  const keyValid = useMemo(
    // Only valid if we've checked the key the user is seeing
    () =>
      key.length > 0 &&
      key === debouncedKey &&
      !localValidationError &&
      !serverValidationError,
    [debouncedKey, key, localValidationError, serverValidationError],
  );

  const doCreateChannel = useCallback(async () => {
    if (!data?.channelCreationPossible || !data.recipientAddress) {
      return;
    }

    setPaymentState('paying');
    setServerCreationError(undefined);

    // Convert display amount (e.g., "25") to raw amount with decimals (e.g., "25000000")
    const usdcAmountRaw = (
      parseFloat(data.usdcCost) * Math.pow(10, USDC_DECIMALS)
    ).toString();

    try {
      // 1. Initiate USDC payment via embedded wallet
      const result = await sendToken({
        sendIntent: {
          chain: data.chain,
          ca: USDC_CONTRACT_ADDRESS,
          amount: usdcAmountRaw,
          recipientAddress: data.recipientAddress,
        },
      });

      if (!result.success) {
        if (result.reason === 'rejected_by_user') {
          // User cancelled the payment
          setPaymentState('idle');
          return;
        }
        // Payment failed
        setServerCreationError(result.error?.message || 'Payment failed');
        setPaymentState('error');
        return;
      }

      // 2. Verify we have a transaction hash
      const transactionHash = result.send?.transaction;
      if (!transactionHash) {
        setServerCreationError('Payment failed - no transaction hash received');
        setPaymentState('error');
        return;
      }

      // 3. Payment submitted, waiting for backend to verify
      setPaymentState('confirming');

      // 4. Create channel with transaction hash
      setPaymentState('creating');
      await createChannel({
        key: debouncedKey,
        transactionHash,
      });

      setPaymentState('idle');
      trackEvent(AnalyticsEvent.CreateChannel, undefined);
      onClose();
      navigateToChannel({ channelKey: debouncedKey });
    } catch (error) {
      setPaymentState('error');
      if (isHandledFetchError(error) && error.responseData.errors.length) {
        const message = error.responseData.errors[0].message;
        // Check if this is a channel creation error (payment already succeeded)
        if (paymentState === 'creating') {
          setServerCreationError(
            `Payment successful, but channel creation failed: ${message}. Please contact support.`,
          );
        } else {
          setServerCreationError(message);
        }
      } else {
        if (paymentState === 'creating') {
          setServerCreationError(
            'Payment successful, but channel creation failed. Please contact support.',
          );
        } else {
          setServerCreationError('Error creating channel. Please try again.');
        }
      }
    }
  }, [
    data,
    sendToken,
    createChannel,
    debouncedKey,
    trackEvent,
    onClose,
    navigateToChannel,
    paymentState,
  ]);

  const getButtonText = () => {
    switch (paymentState) {
      case 'paying':
        return 'Confirm in wallet...';
      case 'confirming':
        return 'Verifying payment...';
      case 'creating':
        return 'Creating channel...';
      default:
        return 'Create channel';
    }
  };

  const isProcessing = paymentState !== 'idle' && paymentState !== 'error';

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full flex-col items-center justify-center">
          <div
            className="relative flex max-w-2xl flex-col justify-between rounded-lg border bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Image
              src={'/~/images/NewChannelHero.png'}
              style={{
                width: 500,
                height: 230,
                minWidth: 500,
                minHeight: 230,
              }}
              alt={'Header'}
              className="z-0 px-4 pb-6 pt-4"
            />
            <div className="absolute inset-0 z-10 flex h-[230px] items-end rounded-t-lg bg-gradient-to-t from-white from-10% to-transparent text-2xl text-default dark:from-[#1f162a]">
              <span className="pl-6 font-semibold">
                A home for your community
              </span>
            </div>
            <div className="flex w-[500px] flex-col px-6">
              <div className="mt-4 text-default">
                Create a space on Farcaster where you can bring people with
                shared interests together.
              </div>
              <div className="mt-4 text-default">
                Channel names have a{' '}
                <ExternalLink
                  href={getNotionLinkTarget({ to: 'username-policy' })}
                  title="Learn more"
                >
                  no squatting policy
                </ExternalLink>
                .
              </div>
              {data && (
                <div className="mt-4 flex flex-row items-center">
                  <span className="mr-2 text-muted">
                    Creating a channel costs
                  </span>
                  <span className="mr-3 font-medium text-default">
                    ${data.usdcCost} USDC on {formatChainName(data.chain)}
                  </span>
                  <ExternalLink
                    href={getNotionLinkTarget({ to: 'channels' })}
                    title="Learn more"
                  >
                    <InfoIcon className="text-muted" />
                  </ExternalLink>
                </div>
              )}

              {/* Show loading state during payment flow */}
              {isProcessing && (
                <div className="mt-6 flex flex-col items-center justify-center rounded-lg p-4 bg-faint">
                  <LoadingIndicator containerClassName="mb-2" />
                  <span className="text-sm text-muted">
                    {paymentState === 'paying' &&
                      'Please confirm the payment in your wallet...'}
                    {paymentState === 'confirming' &&
                      'Waiting for payment confirmation (2 blocks)...'}
                    {paymentState === 'creating' && 'Creating your channel...'}
                  </span>
                </div>
              )}

              {!isProcessing && (
                <>
                  <span className="mt-6 text-sm text-muted">
                    Your channel name
                  </span>
                  <TextInput
                    className="mt-2"
                    contentEditable={true}
                    value={key}
                    autoFocus={false}
                    autoCorrect="false"
                    autoCapitalize="false"
                    spellCheck={false}
                    unselectable={'off'}
                    maxLength={16}
                    onChange={(text) => {
                      setKey(text.target.value.toLowerCase());
                    }}
                  />
                  <span className="mt-1 text-sm text-danger">
                    {serverValidationError ||
                      localValidationError ||
                      serverCreationError}
                    &nbsp;
                  </span>
                </>
              )}

              <DefaultButton
                variant="normal"
                disabled={
                  !data?.channelCreationPossible || !keyValid || isProcessing
                }
                onClick={doCreateChannel}
                title={getButtonText()}
                size="lg"
                className="mt-4"
              >
                {getButtonText()}
              </DefaultButton>

              {data && !isProcessing && (
                <div className="mb-6 mt-8 flex flex-row items-center justify-center text-sm text-muted">
                  <span>
                    Your USDC balance on {formatChainName(data.chain)}: $
                    {data.usdcBalance}
                  </span>
                </div>
              )}

              {!data?.channelCreationPossible && data?.infoMessage && (
                <div className="mb-6 mt-4 text-center text-sm text-danger">
                  {data.infoMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
});

CreateChannelModal.displayName = 'CreateChannelModal';

export { CreateChannelModal };
