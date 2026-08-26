import * as Dialog from '@radix-ui/react-dialog';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useEmbeddedWalletsQuery } from 'farcaster-client-hooks';
import { CheckIcon, XIcon } from 'lucide-react';
import { Fragment, ReactNode, useCallback, useEffect, useState } from 'react';
import { base } from 'viem/chains';
import { Connector, useAccount, useConnect } from 'wagmi';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { Logo } from '~/components/Logo';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';

function getMiniAppPermission(
  wallet: NonNullable<
    ReturnType<typeof useEmbeddedWalletsQuery>['data']
  >['wallets'][number],
) {
  const miniAppPolicy = wallet.miniAppPolicy as
    | typeof wallet.miniAppPolicy
    | 'allowed'
    | 'blocked';
  return typeof miniAppPolicy === 'string'
    ? miniAppPolicy
    : miniAppPolicy.default;
}

const WALLET_CONNECT_ICON =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4lMEE8cmVjdCB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIGZpbGw9IiMzQjk5RkMiLz4lMEE8cGF0aCBkPSJNOC4zODk2OSAxMC4zNzM5QzExLjQ4ODIgNy4yNzUzOCAxNi41MTE4IDcuMjc1MzggMTkuNjEwMyAxMC4zNzM5TDE5Ljk4MzIgMTAuNzQ2OEMyMC4xMzgyIDEwLjkwMTcgMjAuMTM4MiAxMS4xNTI5IDE5Ljk4MzIgMTEuMzA3OEwxOC43MDc2IDEyLjU4MzVDMTguNjMwMSAxMi42NjA5IDE4LjUwNDUgMTIuNjYwOSAxOC40MjcxIDEyLjU4MzVMMTcuOTEzOSAxMi4wNzAzQzE1Ljc1MjMgOS45MDg3IDEyLjI0NzcgOS45MDg3IDEwLjA4NjEgMTIuMDcwM0w5LjUzNjU1IDEyLjYxOThDOS40NTkwOSAxMi42OTczIDkuMzMzNSAxMi42OTczIDkuMjU2MDQgMTIuNjE5OEw3Ljk4MDM5IDExLjM0NDJDNy44MjU0NyAxMS4xODkzIDcuODI1NDcgMTAuOTM4MSA3Ljk4MDM5IDEwLjc4MzJMOC4zODk2OSAxMC4zNzM5Wk0yMi4yNDg1IDEzLjAxMkwyMy4zODM4IDE0LjE0NzRDMjMuNTM4NyAxNC4zMDIzIDIzLjUzODcgMTQuNTUzNSAyMy4zODM4IDE0LjcwODRMMTguMjY0NSAxOS44Mjc3QzE4LjEwOTYgMTkuOTgyNyAxNy44NTg0IDE5Ljk4MjcgMTcuNzAzNSAxOS44Mjc3QzE3LjcwMzUgMTkuODI3NyAxNy43MDM1IDE5LjgyNzcgMTcuNzAzNSAxOS44Mjc3TDE0LjA3MDIgMTYuMTk0NEMxNC4wMzE0IDE2LjE1NTcgMTMuOTY4NiAxNi4xNTU3IDEzLjkyOTkgMTYuMTk0NEMxMy45Mjk5IDE2LjE5NDQgMTMuOTI5OSAxNi4xOTQ0IDEzLjkyOTkgMTYuMTk0NEwxMC4yOTY2IDE5LjgyNzdDMTAuMTQxNyAxOS45ODI3IDkuODkwNTMgMTkuOTgyNyA5LjczNTYxIDE5LjgyNzhDOS43MzU2IDE5LjgyNzggOS43MzU2IDE5LjgyNzcgOS43MzU2IDE5LjgyNzdMNC42MTYxOSAxNC43MDgzQzQuNDYxMjcgMTQuNTUzNCA0LjQ2MTI3IDE0LjMwMjIgNC42MTYxOSAxNC4xNDczTDUuNzUxNTIgMTMuMDEyQzUuOTA2NDUgMTIuODU3IDYuMTU3NjMgMTIuODU3IDYuMzEyNTUgMTMuMDEyTDkuOTQ1OTUgMTYuNjQ1NEM5Ljk4NDY4IDE2LjY4NDEgMTAuMDQ3NSAxNi42ODQxIDEwLjA4NjIgMTYuNjQ1NEMxMC4wODYyIDE2LjY0NTQgMTAuMDg2MiAxNi42NDU0IDEwLjA4NjIgMTYuNjQ1NEwxMy43MTk0IDEzLjAxMkMxMy44NzQzIDEyLjg1NyAxNC4xMjU1IDEyLjg1NyAxNC4yODA1IDEzLjAxMkMxNC4yODA1IDEzLjAxMiAxNC4yODA1IDEzLjAxMiAxNC4yODA1IDEzLjAxMkwxNy45MTM5IDE2LjY0NTRDMTcuOTUyNiAxNi42ODQxIDE4LjAxNTQgMTYuNjg0MSAxOC4wNTQxIDE2LjY0NTRMMjEuNjg3NCAxMy4wMTJDMjEuODQyNCAxMi44NTcxIDIyLjA5MzYgMTIuODU3MSAyMi4yNDg1IDEzLjAxMloiIGZpbGw9IndoaXRlIi8+JTBBPC9zdmc+';

export function PreferredWalletDialog() {
  const { closeConnectModal } = useWallet();

  return (
    <Dialog.Root
      defaultOpen
      onOpenChange={(open) => {
        if (!open) {
          closeConnectModal();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 animate-overlay-show bg-overlay" />
        <Dialog.Content
          className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-content-show"
          onPointerDownOutside={(e) => {
            // Allow interactions with Warplet
            if (
              e.target instanceof HTMLElement &&
              e.target.closest('#warplet')
            ) {
              e.preventDefault();
            }
          }}
        >
          <div className="border-top border-left border-right relative w-[424px] overflow-hidden rounded-xl p-4 bg-app">
            <PreferredWalletSelector modal />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PreferredWalletSelector({ modal }: { modal?: boolean }) {
  const { connectAsync } = useConnect();
  const { closeConnectModal, connectors, setPreferredWallet, preferredWallet } =
    useWallet();
  const [localPreferredWallet, setLocalPreferredWallet] = useState<string>();
  const { connector: existingConnector } = useAccount();
  const [showAllWallets, setShowAllWallets] = useState(!modal);
  const geoRestricted = useWalletGeoRestricted();
  const { trackEvent } = useAnalytics();
  const currentUser = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { data: embeddedWalletsData } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: currentUser.fid,
    enabled: isAdmin,
  });
  const blockedPrivateWallets = isAdmin
    ? (embeddedWalletsData?.wallets.filter(
        (wallet) =>
          !wallet.isPrimary && getMiniAppPermission(wallet) !== 'allowed',
      ) ?? [])
    : [];

  const handleSelectPreferredWallet = useCallback(
    (wallet: string) => {
      setLocalPreferredWallet(wallet);
      if (!modal) {
        setPreferredWallet(wallet);
      }
    },
    [modal, setPreferredWallet],
  );

  const handleConnect = useCallback(
    async (connector: Connector) => {
      // Default to base chain
      if (!existingConnector || connector.id !== existingConnector.id) {
        await connectAsync({ connector: connector, chainId: base.id });
      }
      handleSelectPreferredWallet(connector.id);
    },
    [connectAsync, existingConnector, handleSelectPreferredWallet],
  );

  const handleDone = useCallback(() => {
    if (!localPreferredWallet) {
      return;
    }

    setPreferredWallet(localPreferredWallet);
    trackEvent(AnalyticsEvent.SetPreferredWallet, {
      wallet: localPreferredWallet,
    });

    closeConnectModal();
  }, [localPreferredWallet, closeConnectModal, setPreferredWallet, trackEvent]);

  useEffect(() => {
    if (preferredWallet) {
      setLocalPreferredWallet(preferredWallet);
    }
  }, [preferredWallet]);

  return (
    <div className="flex flex-col gap-4 ">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="text-lg font-semibold">Choose preferred wallet</div>
          {modal && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                closeConnectModal();
              }}
              className="flex cursor-pointer "
            >
              <XIcon className="size-6 text-muted hover:text-foreground" />
            </div>
          )}
        </div>
        <div className="text-md text-muted">
          This wallet will be used for transactions in miniapps.{' '}
          {modal && <>You can change it anytime in Settings.</>}
        </div>
      </div>
      <div className="flex flex-col rounded-xl bg-surface-secondary">
        {!geoRestricted && (
          <WalletOption
            name="Farcaster Wallet"
            description="Mini-apps allowed"
            icon={<Logo size="xs" />}
            onClick={() => {
              handleSelectPreferredWallet('warpcast');
            }}
            isSelected={localPreferredWallet === 'warpcast'}
            isConnected={true}
          />
        )}
        {blockedPrivateWallets.map((wallet) => (
          <Fragment key={wallet.id}>
            <div className="h-px w-full bg-app" />
            <WalletOption
              name={wallet.displayName}
              description="Blocked for mini-apps by default"
              onClick={() => undefined}
              isDisabled
            />
          </Fragment>
        ))}
        <div className="h-px w-full bg-app" />
        {connectors.map((connector, index) => {
          if (!showAllWallets && connector.id !== localPreferredWallet) {
            return null;
          }

          const icon =
            connector.id === 'walletConnect'
              ? WALLET_CONNECT_ICON
              : connector.icon;

          return (
            <Fragment key={connector.id}>
              <WalletOption
                key={index}
                name={connector.name}
                icon={icon}
                onClick={() => handleConnect(connector)}
                isSelected={localPreferredWallet === connector.id}
                isConnected={
                  existingConnector && connector.id === existingConnector.id
                }
                isInstalled={connector.id !== 'walletConnect'}
              />
              {index !== connectors.length - 1 && (
                <div className="h-px w-full bg-app" />
              )}
            </Fragment>
          );
        })}
        {!showAllWallets && (
          <WalletOption
            name="External Wallet"
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 3L15 3C14.4477 3 14 3.44772 14 4L14 9C14 9.55228 14.4477 10 15 10L20 10C20.5523 10 21 9.55228 21 9L21 4C21 3.44772 20.5523 3 20 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-default"
                />
                <path
                  d="M10 21L10 8C10 7.73478 9.89464 7.48043 9.70711 7.29289C9.51957 7.10536 9.26522 7 9 7L4 7C3.73478 7 3.48043 7.10536 3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8L3 20C3 20.2652 3.10536 20.5196 3.29289 20.7071C3.48043 20.8946 3.73478 21 4 21L16 21C16.2652 21 16.5196 20.8946 16.7071 20.7071C16.8946 20.5196 17 20.2652 17 20L17 15C17 14.7348 16.8946 14.4804 16.7071 14.2929C16.5196 14.1054 16.2652 14 16 14L3 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-default"
                />
              </svg>
            }
            onClick={() => {
              setShowAllWallets(true);
            }}
          />
        )}
      </div>
      {modal && (
        <DefaultButton
          className="h-11"
          onClick={handleDone}
          size="lg"
          disabled={!localPreferredWallet}
        >
          Done
        </DefaultButton>
      )}
    </div>
  );
}

function WalletOption({
  name,
  description,
  icon,
  onClick,
  isSelected,
  isConnected,
  isInstalled,
  isDisabled,
}: {
  name: string;
  description?: string;
  icon?: string | ReactNode;
  onClick: () => void;
  isSelected?: boolean;
  isConnected?: boolean;
  isInstalled?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <div
      className={`flex flex-row items-center justify-between rounded-lg p-3 transition-colors ${
        isDisabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-hover active:bg-elevated'
      }`}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="flex flex-row items-center gap-3">
        {typeof icon === 'string' ? (
          <Image src={icon} alt={name} className="size-[24px] rounded-lg" />
        ) : icon ? (
          icon
        ) : (
          <div className="size-[24px] rounded-lg bg-overlay-light" />
        )}
        <div className="flex flex-col">
          <div className="text-default">{name}</div>
          {description && (
            <div className="text-sm text-muted">{description}</div>
          )}
        </div>
      </div>
      {isSelected ? (
        <CheckIcon className="text-success" />
      ) : isConnected ? (
        <div className="text-xs text-muted">Connected</div>
      ) : isInstalled ? (
        <div className="text-xs text-faint">Installed</div>
      ) : null}
    </div>
  );
}
