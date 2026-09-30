import { FC, memo } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { useWalletLocked } from '~/contexts/WalletLockedProvider';
import { useWallet } from '~/contexts/WalletProvider';

const DebugEmbeddedWalletPage: FC = memo(() => {
  const {
    preferredWallet,
    clearPreferredWallet,
    openConnectModal: connectWallet,
  } = useWallet();
  const { openWarpcastWallet, closeWarpcastWallet, isWarpcastWalletOpen } =
    useOpenableWarpcastWallet();

  const { navigate, sendToken, swapToken } = useEmbeddedWalletBridge();
  const { lockWallet } = useWalletLocked();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <Page meta={{ title: 'Debug Embedded Wallet' }}>
      <BorderedMainContent>
        <PageHeader>
          <PageTitle>Debug: Embedded Wallet</PageTitle>
        </PageHeader>
        <div className="flex flex-col gap-8 p-4">
          <div className="flex flex-col gap-2">
            <div>Wallet Presentation</div>
            <div className="flex flex-row items-center gap-2">
              <DefaultButton onClick={openWarpcastWallet}>
                Open Wallet
              </DefaultButton>
              <DefaultButton onClick={closeWarpcastWallet}>
                Close Wallet
              </DefaultButton>
              <div>State: {isWarpcastWalletOpen ? 'Open' : 'Closed'}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>Wallet Navigation</div>
            <div className="flex flex-row items-center gap-2">
              <DefaultButton
                onClick={() =>
                  navigate({
                    path: 'Token',
                    params: {
                      chain: 'base',
                      ca: '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe',
                    },
                  })
                }
              >
                View Token
              </DefaultButton>
              <DefaultButton
                onClick={() =>
                  sendToken({
                    sendIntent: {
                      chain: 'base',
                      ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                    },
                  })
                }
              >
                Send Token
              </DefaultButton>
              <DefaultButton
                onClick={() =>
                  swapToken({
                    swapIntent: {
                      buy: {
                        chainId: 8453,
                        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
                      },
                    },
                  })
                }
              >
                Swap Token
              </DefaultButton>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>Wallet Auth</div>
            <div className="flex flex-row items-center gap-2">
              <DefaultButton onClick={lockWallet} variant="danger">
                Logout
              </DefaultButton>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div>Wallet Switcher</div>
            <div>Preferred Wallet: {preferredWallet}</div>
            <div className="flex flex-row items-center gap-2">
              <DefaultButton onClick={clearPreferredWallet}>
                Clear Preferred Wallet
              </DefaultButton>
              <DefaultButton onClick={connectWallet}>
                Open Wallet Switcher
              </DefaultButton>
            </div>
            {address && (
              <>
                <div>External Connected Wallet: {address}</div>
                <div className="flex flex-row items-center gap-2">
                  <DefaultButton onClick={() => disconnect()} variant="danger">
                    Disconnect
                  </DefaultButton>
                </div>
              </>
            )}
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

DebugEmbeddedWalletPage.displayName = 'DebugEmbeddedWalletPage';

export { DebugEmbeddedWalletPage };
