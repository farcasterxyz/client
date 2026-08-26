import {
  ChevronDownIcon,
  ChevronUpIcon,
  KebabHorizontalIcon,
  LockIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useTrackEvent, useVerificationsQuery } from 'farcaster-client-hooks';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import { FloatingResumeCastButton } from '~/components/composer/FloatingResumeCastButton';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import {
  EmbeddedWalletIframe,
  useEmbeddedWalletBridge,
} from '~/components/EmbeddedWallet';
import { WalletIcon } from '~/components/icons/WalletIcon';
import { MinimizableWindowHostVariant } from '~/components/MinimizableWindowHost';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { useWalletLocked } from '~/contexts/WalletLockedProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { cn } from '~/lib/utils';
import { truncateAddress } from '~/utils/ethereumUtils';

function FloatingWallet({
  variant,
}: {
  variant: MinimizableWindowHostVariant;
}) {
  const { fid } = useCurrentUser();
  const { data: verifications } = useVerificationsQuery({ fid });
  const { trackEvent } = useTrackEvent();

  // Due to limitations in Skia, we need to first render the wallet full width
  // then transition to the correct width.
  const [initializing, setInitializing] = React.useState(true);

  // Lazy load iframe - mount after user first opens the wallet OR after a delay
  // The delay ensures Lighthouse/Core Web Vitals measurements complete before loading
  const [hasBeenOpened, setHasBeenOpened] = React.useState(false);

  useEffect(() => {
    if (initializing) {
      setTimeout(() => {
        setInitializing(false);
      }, 1500);
    }
  }, [initializing]);

  const warpletAddress = React.useMemo(() => {
    const allVerifications =
      verifications?.pages.flatMap((page) => page.result.verifications) || [];
    const warplet = allVerifications.find(
      // FIXME: Find a better way to find the warplet definition than checking a string label
      (item) =>
        item.label === 'Warpcast Wallet' || item.label === 'Farcaster Wallet',
    );
    if (!warplet) {
      return null;
    }
    return truncateAddress(warplet.address, 4);
  }, [verifications]);

  const { isWarpcastWalletOpen, openWarpcastWallet, closeWarpcastWallet } =
    useOpenableWarpcastWallet();

  // Mount iframe when wallet is first opened
  useEffect(() => {
    if (isWarpcastWalletOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  }, [isWarpcastWalletOpen, hasBeenOpened]);

  // No eager-load timer: full_warplet only mounts when the user explicitly
  // opens the wallet. Any fixed timer risks racing with mini_app_modal's
  // Privy init (which starts immediately when a mini-app opens), producing
  // a stuck "Confirm it's you" popup. On-demand loading is deterministic —
  // whichever surface connects first caches the Privy session; the other
  // connects instantly from that cache.

  const { isConnected } = useEmbeddedWalletBridge();

  const toggleWarpcastWallet = useCallback(() => {
    if (isWarpcastWalletOpen) {
      closeWarpcastWallet();
    } else {
      // Track if user opens wallet before lazy loading completed
      if (!hasBeenOpened) {
        trackEvent(AnalyticsEvent.WalletOpenedBeforeLoad, {
          location: 'floating_wallet',
        });
      }
      openWarpcastWallet();
    }
  }, [
    isWarpcastWalletOpen,
    openWarpcastWallet,
    closeWarpcastWallet,
    hasBeenOpened,
    trackEvent,
  ]);

  const [dropdownIsOpen, setDropdownIsOpen] = React.useState(false);

  if (!warpletAddress) {
    return null;
  }

  return (
    <>
      {isWarpcastWalletOpen ? <FloatingResumeCastButton /> : null}
      <div
        id="warplet"
        className={cn(
          'cursor-pointer',
          'rounded-b-xl rounded-t-xl shadow-[0px_0px_25px_0_rgba(0,0,0,0.12)] bg-swap',
          'transition-all duration-300 ease-in-out',
          'w-[48px] overflow-hidden',
          '!pointer-events-auto',
          'dark:shadow-[0px_4px_20px_0_rgba(255,255,255,0.07),_0px_0px_0.5px_0_rgba(255,255,255,0.30),_0px_1px_3px_0_rgba(255,255,255,0.15)]',
          'flex min-h-[48px] shrink flex-col',
          {
            'w-[393px]': isWarpcastWalletOpen || initializing,
            'opacity-0': initializing,
            'mr-[-337px] dcxl:mr-0':
              variant === 'direct-casts' && isWarpcastWalletOpen,
            'xl:w-[393px] xl:rounded-b-none': variant !== 'direct-casts',
          },
        )}
        onClick={toggleWarpcastWallet}
      >
        <div className="flex shrink-0 flex-row items-center justify-between p-3">
          <div className="flex flex-row items-center gap-2">
            <WalletIcon width={24} height={24} stroke="currentColor" />
            <div
              className={cn('hidden flex-col', {
                flex: isWarpcastWalletOpen,
                'xl:flex': variant !== 'direct-casts',
              })}
            >
              <span className="font-semibold leading-5 text-default">
                Wallet
              </span>
            </div>
          </div>
          <div className="flex flex-row items-center gap-2">
            {isConnected && (
              <WalletDropdownMenu
                isOpen={dropdownIsOpen}
                setIsOpen={setDropdownIsOpen}
                isWarpcastWalletOpen={isWarpcastWalletOpen}
                variant={variant}
              />
            )}
            <div
              className={cn(
                'hidden size-8 items-center justify-center rounded-full transition-colors bg-overlay-light hover:bg-overlay-medium active:bg-elevated',
                {
                  flex: isWarpcastWalletOpen,
                  'xl:flex': variant !== 'direct-casts',
                },
              )}
            >
              {isWarpcastWalletOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
            </div>
          </div>
        </div>
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            'flex min-h-0 flex-col',
            {
              'shrink grow basis-[600px]': isWarpcastWalletOpen,
              'basis-0': !isWarpcastWalletOpen,
            },
          )}
        >
          {hasBeenOpened && (
            <EmbeddedWalletIframe
              surface="full_warplet"
              disableClicks={dropdownIsOpen}
            />
          )}
        </div>
      </div>
    </>
  );
}

function WalletDropdownMenu({
  isOpen,
  setIsOpen,
  isWarpcastWalletOpen,
  variant,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isWarpcastWalletOpen: boolean;
  variant: MinimizableWindowHostVariant;
}) {
  const { lockWallet } = useWalletLocked();

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()}>
        <div
          className={cn([
            'hidden items-center justify-center',
            'size-8 rounded-full transition-colors',
            'bg-overlay-light hover:bg-overlay-medium active:bg-elevated',
            {
              flex: isWarpcastWalletOpen,
              'xl:flex': variant !== 'direct-casts',
            },
          ])}
        >
          <KebabHorizontalIcon />
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="bottom"
        sideOffset={21}
        align="end"
        alignOffset={-15}
        className="z-20 w-52 divide-y divide-[#efefef] overflow-hidden rounded-xl border bg-app border-default dark:divide-[#4c3a4e80] "
        onClick={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          name="Lock wallet"
          icon={<LockIcon size="small" />}
          onSelect={(e) => {
            e.preventDefault();
            setIsOpen(false);
            lockWallet();
          }}
        />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

export { FloatingWallet };
