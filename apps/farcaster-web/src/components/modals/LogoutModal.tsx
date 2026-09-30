import { CouldNotSignOutError } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { useAuth } from '~/contexts/AuthProvider';
import { useWalletLocked } from '~/contexts/WalletLockedProvider';
import { trackError } from '~/utils/errorUtils';

type LogoutModalProps = {
  onClose: () => void;
};

const LogoutModal: FC<LogoutModalProps> = memo(({ onClose }) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut } = useAuth();
  const { lockWallet } = useWalletLocked();

  const handleLogout = useCallback(async () => {
    setIsSigningOut(true);
    try {
      lockWallet();

      await signOut();
    } catch (error) {
      trackError(new CouldNotSignOutError({ error }));
      alert('We could not sign you out.');
      setIsSigningOut(false);
    }
  }, [signOut, lockWallet]);

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full flex-col items-center justify-center p-4">
          <div
            className="flex w-96 flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3 className="mb-2 text-left text-lg font-semibold">
              Are you sure you want to log out?
            </h3>
            <p>You’ll need a mobile device with Farcaster to log back in.</p>
            <div className="mt-4 flex w-full flex-row space-x-2">
              <DefaultButton
                variant="muted"
                className="w-[180px] min-w-[140px]"
                onClick={() => {
                  onClose();
                }}
              >
                Cancel
              </DefaultButton>
              <DefaultButton
                variant="danger"
                className="w-[180px] min-w-[140px]"
                isLoading={isSigningOut}
                onClick={handleLogout}
              >
                Log out
              </DefaultButton>
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
});

LogoutModal.displayName = 'LogoutModal';

export { LogoutModal };
