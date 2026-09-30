import * as React from 'react';

import {
  EmbeddedWalletBridgeProvider,
  EmbeddedWalletIframe,
} from '~/components/EmbeddedWallet';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { SubordinateOpenableWarpcastWalletProvider } from '~/contexts/SubordinateOpenableWarpcastWalletProvider';
import { cn } from '~/lib/utils';

type BespokeTransactionModalContextType = {
  showModal: (node: React.ReactNode) => void;
  closeModal: () => void;
};

const BespokeTransactionModalContext = React.createContext<
  BespokeTransactionModalContextType | undefined
>(undefined);

type BespokeTransactionModalProviderProps = {
  children: React.ReactNode;
};

function BespokeTransactionModalProvider({
  children,
}: BespokeTransactionModalProviderProps) {
  const [modal, setModal] = React.useState<React.ReactNode>();

  const showModal = React.useCallback((node: React.ReactNode) => {
    setModal(node);
  }, []);

  const closeModal = React.useCallback(() => {
    setModal(undefined);
  }, []);

  const context = React.useMemo(
    () => ({
      showModal,
      closeModal,
    }),
    [showModal, closeModal],
  );

  return (
    <BespokeTransactionModalContext.Provider value={context}>
      <BespokePaymentsModal onClose={closeModal}>{modal}</BespokePaymentsModal>
      {children}
    </BespokeTransactionModalContext.Provider>
  );
}

type BespokePaymentsModalProps = {
  onClose: () => void;
  children: React.ReactNode;
};

function BespokePaymentsModal(props: BespokePaymentsModalProps) {
  return (
    <SubordinateOpenableWarpcastWalletProvider>
      <EmbeddedWalletBridgeProvider surface="bespoke_transaction">
        <BespokePaymentsModalContent {...props} />
      </EmbeddedWalletBridgeProvider>
    </SubordinateOpenableWarpcastWalletProvider>
  );
}

function BespokePaymentsModalContent({
  onClose,
  children,
}: BespokePaymentsModalProps) {
  const { isWarpcastWalletOpen } = useOpenableWarpcastWallet();

  // Lazy load iframe - mount after user first opens the wallet OR after a delay
  // The delay ensures Lighthouse/Core Web Vitals measurements complete before loading
  const [hasBeenOpened, setHasBeenOpened] = React.useState(false);

  React.useEffect(() => {
    if (isWarpcastWalletOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  }, [isWarpcastWalletOpen, hasBeenOpened]);

  // No eager-load timer: bespoke_transaction only mounts when the user
  // triggers a bespoke payment. Any fixed timer risks racing with
  // mini_app_modal's Privy init (which starts immediately when a mini-app
  // opens), recreating the stuck "Confirm it's you" popup.

  return (
    <DefaultModalContainer
      onClose={onClose}
      className={cn('fixed inset-0 z-20 bg-overlay', {
        'pointers-events-none hidden': !children,
      })}
    >
      <div className="flex size-full flex-col items-center justify-center">
        <div
          className="relative flex h-auto w-[420px] flex-col items-start justify-center overflow-hidden rounded-lg border bg-app border-default"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div
            className={cn(
              'absolute inset-0 z-30 flex animate-overlay-show items-end',
              {
                'pointer-events-none hidden': !isWarpcastWalletOpen,
              },
            )}
          >
            <div className="h-full flex-1 animate-frame-action-content-show">
              {hasBeenOpened && (
                <EmbeddedWalletIframe surface="bespoke_transaction" />
              )}
            </div>
          </div>
          {children}
        </div>
      </div>
    </DefaultModalContainer>
  );
}

function useBespokeTransactionModalContext() {
  const context = React.useContext(BespokeTransactionModalContext);
  if (!context) {
    throw new Error('no BespokeTransactionModalContext');
  }
  return context;
}

function useOptionalBespokeTransactionModalContext() {
  return React.useContext(BespokeTransactionModalContext);
}

export {
  BespokeTransactionModalProvider,
  useBespokeTransactionModalContext,
  useOptionalBespokeTransactionModalContext,
};
