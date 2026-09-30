import { useCallback, useMemo } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { useShowFarcasterProUpsellModal } from '~/components/farcasterPro/FarcasterProUpsellModal';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';

interface FarcasterProUnlockFeaturesModalProps {
  emphasis: 'banner' | 'cast-length' | 'embeds';
  onClose: () => void;
}

const FarcasterProUnlockFeaturesModal = ({
  emphasis,
  onClose,
}: FarcasterProUnlockFeaturesModalProps) => {
  const bodyText = useMemo(() => {
    switch (emphasis) {
      case 'banner':
        return 'Upgrade to Farcaster Pro to unlock profile banners and more';
      case 'cast-length':
        return 'Upgrade to Farcaster Pro to unlock 10k character limit casts and more';
      case 'embeds':
        return 'Upgrade to Farcaster Pro to unlock four embeds per cast and more';
    }
  }, [emphasis]);

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
            title="Upgrade to Farcaster Pro"
            onClose={onClose}
            icon={() => <FarcasterProBadge size={36} />}
            iconSize={36}
            noIconBackground
            hideDefaultCloseModalButton
          />
          <div className="flex size-full flex-col justify-between overflow-hidden">
            <div className="flex flex-col gap-4 p-4">
              <p className="text-faint">{bodyText}</p>
            </div>
            <div className="rounded-b-md border-t p-4 border-default">
              <DefaultModalActionButtons
                onSecondaryButtonClick={onClose}
                secondaryButtonLabel="Close"
                onPrimaryButtonClick={handleUpgrade}
                primaryButtonLabel="Upgrade to Pro"
              />
            </div>
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};

export { FarcasterProUnlockFeaturesModal };
