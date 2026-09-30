import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import { BadgeDollarSignIcon, Clock2Icon, HandHelpingIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { Modal } from '~/components/modals/Modal';
import { appPathPrefix } from '~/constants/routePrefixes';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type DepositBonusModalProps = {
  onClose: () => void;
};

const ICON_SIZE = 24;
const SPLASH_IMAGE_HEIGHT = 240;

const InfoItem = ({
  title,
  description,
  icon,
  hasLearnMore = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  hasLearnMore?: boolean;
}) => {
  const renderDescription = () => {
    if (hasLearnMore) {
      const [mainText] = description.split('Learn more');
      return (
        <div className="flex-1 text-sm text-muted">
          {mainText}
          <button
            className="text-brand hover:underline"
            onClick={() => {
              window.open(
                getNotionLinkTarget({ to: 'deposit-bonuses' }),
                '_blank',
              );
            }}
          >
            Learn more
          </button>
        </div>
      );
    }

    return <div className="flex-1 text-sm text-muted">{description}</div>;
  };

  return (
    <div className="flex flex-row gap-3">
      {icon}
      <div className="flex flex-1 flex-col gap-1">
        <div className="text-sm font-semibold text-default">{title}</div>
        {renderDescription()}
      </div>
    </div>
  );
};

const DepositBonusModal: React.FC<DepositBonusModalProps> = ({ onClose }) => {
  const { trackEvent } = useAnalytics();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewDepositBonusesIntroScreen, {});
  }, [trackEvent]);

  const onContinue = useCallback(() => {
    if (navigateInWallet) {
      navigateInWallet({
        path: 'WalletReceiveOnChain',
        params: { chain: 'base' },
      });
    }
    onClose();
  }, [navigateInWallet, onClose]);

  const onSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const infoItems = useMemo(
    () => [
      {
        title: 'Deposit to earn',
        description:
          "This October, we'll match Base USDC you deposit in your wallet with a 10% bonus.",
        icon: <HandHelpingIcon size={ICON_SIZE} className="text-default" />,
      },
      {
        title: 'Earn up to $500',
        description:
          'You can earn up to $500 in deposit rewards for an eligible Farcaster account. Learn more',
        icon: <Clock2Icon size={ICON_SIZE} className="text-default" />,
        hasLearnMore: true,
      },
      {
        title: 'Onchain payouts',
        description: 'Rewards are paid out onchain in Base USDC every week.',
        icon: <BadgeDollarSignIcon size={ICON_SIZE} className="text-default" />,
      },
    ],
    [],
  );

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <DefaultModalContent maximizeHeight={true} maxHeightPxTarget="1000px">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex flex-col items-center justify-center p-4">
              <Image
                src={`${appPathPrefix}/images/DepositBonusesSplash.png`}
                alt="Deposit Bonuses"
                className="w-full"
                style={{ height: SPLASH_IMAGE_HEIGHT, objectFit: 'contain' }}
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col px-4 pb-6">
              <div className="mb-6">
                <div className="text-sm font-semibold text-brand">
                  Introducing
                </div>
                <div className="text-2xl font-semibold text-default">
                  Deposit bonus
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {infoItems.map((item) => (
                  <InfoItem
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    hasLearnMore={item.hasLearnMore}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 px-4 pb-4">
              <DefaultButton
                variant="normal"
                size="lg"
                className="h-14 w-full rounded-lg"
                onClick={onContinue}
              >
                Deposit now
              </DefaultButton>
              <DefaultButton
                variant="secondary"
                size="lg"
                className="h-14 w-full rounded-lg"
                onClick={onSkip}
              >
                Skip
              </DefaultButton>
            </div>
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};

DepositBonusModal.displayName = 'DepositBonusModal';

export function useDepositBonusModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const Component = useMemo(() => {
    if (isOpen) {
      return <DepositBonusModal onClose={close} />;
    }

    return null;
  }, [isOpen, close]);

  return {
    isOpen,
    open,
    close,
    Component,
  };
}

export { DepositBonusModal };
