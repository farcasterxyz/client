import { CalendarIcon } from '@primer/octicons-react';
import {
  useFarcasterProIsEligibleForLimitedEditionNft,
  useSubscriptionsGetActiveSubscription,
} from 'farcaster-client-hooks';
import { useCallback, useMemo } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { useShowFarcasterProUpsellModal } from '~/components/farcasterPro/FarcasterProUpsellModal';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';

const FarcasterProBadgeDetailsModal = ({
  fid,
  onClose,
}: {
  fid: number;
  onClose: () => void;
}) => {
  const isPro = useCurrentUserLevel() === 'pro';
  const { data: subscription } = useSubscriptionsGetActiveSubscription({
    type: 'farcaster-pro',
    fid,
  });
  const { data: isEligibleForLimitedEditionNft } =
    useFarcasterProIsEligibleForLimitedEditionNft({
      fid,
    });

  const subscriptionDate = useMemo(() => {
    if (subscription?.startDate) {
      return new Date(subscription.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return null;
  }, [subscription?.startDate]);

  const bodyText = useMemo(() => {
    if (isEligibleForLimitedEditionNft) {
      return 'One of the first 10,000 to support Farcaster with a Pro subscription, will receive an early supporter NFT.';
    }
    return 'This account supports Farcaster with a Pro subscription.';
  }, [isEligibleForLimitedEditionNft]);

  const openProUpsell = useShowFarcasterProUpsellModal();
  const handleUpgrade = useCallback(() => {
    onClose();
    openProUpsell();
  }, [onClose, openProUpsell]);

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <DefaultModalContent>
          <DefaultModalHeader
            title="Farcaster Pro account"
            onClose={onClose}
            icon={() => <FarcasterProBadge size={36} />}
            iconSize={36}
            noIconBackground
            hideDefaultCloseModalButton
          />
          <div className="flex size-full flex-col justify-between overflow-hidden">
            <div className="flex flex-col gap-4 p-4">
              <p className="text-faint">{bodyText}</p>
              {subscriptionDate && (
                <div className="flex flex-row items-center gap-2">
                  <CalendarIcon size={16} className="text-faint" />
                  <p className="text-faint">Pro since {subscriptionDate}.</p>
                </div>
              )}
            </div>
            <div className="rounded-b-md border-t p-4 border-default">
              {isPro ? (
                <DefaultModalActionButtons
                  onPrimaryButtonClick={onClose}
                  primaryButtonLabel="Close"
                />
              ) : (
                <DefaultModalActionButtons
                  onSecondaryButtonClick={onClose}
                  secondaryButtonLabel="Close"
                  onPrimaryButtonClick={handleUpgrade}
                  primaryButtonLabel="Upgrade to Pro"
                />
              )}
            </div>
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};

export { FarcasterProBadgeDetailsModal };
