import { LinkExternalIcon } from '@primer/octicons-react';
import {
  ApiVerification,
  ApiVerificationProtocol,
} from 'farcaster-client-data';
import {
  useDeleteVerification,
  useInvalidateVerifications,
  useSetPrimaryAddress,
  useVerifications,
} from 'farcaster-client-hooks';
import { MoreHorizontalIcon, Star, Trash2 } from 'lucide-react';
import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useComposeVerificationUrl } from '~/hooks/verifications/useComposeVerificationUrl';
import { SettingsNav } from '~/layouts/SettingsNav';
import {
  explorerAddressUrl as ethExplorerAddressUrl,
  truncateAddress as truncateEthAddress,
} from '~/utils/ethereumUtils';
import {
  explorerAddressUrl as solExplorerAddressUrl,
  truncateAddress as truncateSolAddress,
} from '~/utils/solanaUtils';
import { toast } from '~/utils/toast';

const getTruncatedAddress = (
  address: string,
  protocol: ApiVerificationProtocol,
  numChars: number = 6,
) => {
  switch (protocol) {
    case 'solana':
      return truncateSolAddress(address, numChars);
    case 'ethereum':
      return truncateEthAddress(address, numChars);
  }
};

const CHAIN_TO_NAME_MAP: Record<ApiVerificationProtocol, string> = {
  ethereum: 'Ethereum',
  solana: 'Solana',
} as const;

const getExplorerUrl = (
  address: string,
  protocol: ApiVerificationProtocol,
): string => {
  switch (protocol) {
    case 'solana':
      return solExplorerAddressUrl(address);
    case 'ethereum':
      return ethExplorerAddressUrl(address);
  }
};

function VerifiedAddressItem({
  item,
  hasMore,
}: {
  item: ApiVerification;
  hasMore?: boolean;
}) {
  const { fid } = useCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const deleteVerification = useDeleteVerification();
  const setPrimaryAddress = useSetPrimaryAddress({ fid });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleRemoveClick = useCallback(() => {
    setIsMenuOpen(false); // Close the menu
    setIsRemoveModalOpen(true); // Open the modal
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    await deleteVerification({
      fid,
      signerAddress: item.address,
      protocol: item.protocol,
    });
    setIsRemoveModalOpen(false);
    toast({
      message: 'Address removed',
      type: 'info',
    });
  }, [deleteVerification, fid, item]);

  const primaryBadge = useMemo(() => {
    if (!item.isPrimary) {
      return null;
    }

    return (
      <div
        className="flex items-center rounded-xl bg-pill-active text-pill-active"
        style={{ fontSize: '11px', lineHeight: '16px' }}
      >
        <p className="mx-2 my-[2px]">Primary</p>
      </div>
    );
  }, [item.isPrimary]);

  const onSetPrimaryClick = useCallback(async () => {
    setIsMenuOpen(false);
    await setPrimaryAddress.mutateAsync(item);
    toast({
      message: 'Primary address updated',
      type: 'info',
    });
  }, [setPrimaryAddress, item]);

  const menuSection = useMemo(() => {
    if (!isMenuOpen) {
      return null;
    }

    const primaryMenu = !item.isPrimary && (
      <button
        onClick={onSetPrimaryClick}
        className="flex w-full items-center justify-between border-b px-4 py-3 border-default text-default hover:bg-overlay-faint"
      >
        <span className="text-default">Set as Primary</span>
        <Star width={20} height={20} className="text-default" />
      </button>
    );

    return (
      <div
        ref={menuRef}
        className="absolute right-0 top-8 z-10 min-w-[192px] rounded-lg border shadow-md bg-app border-default"
      >
        <div className="flex flex-col">
          {primaryMenu}
          <ExternalLink
            href={getExplorerUrl(item.address, item.protocol)}
            title="View in Explorer"
            className="flex w-full items-center justify-between border-b px-4 py-3 border-default hover:bg-overlay-faint"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="text-default">View in Explorer</span>
            <LinkExternalIcon size={20} className="text-default" />
          </ExternalLink>
          {}
          <button
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-overlay-faint"
            onClick={handleRemoveClick}
          >
            <span className="text-danger text-default">Remove address</span>
            <Trash2 width={20} height={20} className="text-danger" />
          </button>
        </div>
      </div>
    );
  }, [isMenuOpen, handleRemoveClick, onSetPrimaryClick, item]);

  const addressName = useMemo(() => {
    if (item.label) {
      // Display "Farcaster Wallet" instead of "Warpcast Wallet"
      return item.label === 'Warpcast Wallet' ? 'Farcaster Wallet' : item.label;
    }
    return getTruncatedAddress(item.address, item.protocol, 4);
  }, [item]);

  const isWarplet =
    item.label === 'Farcaster Wallet' || item.label === 'Warpcast Wallet';
  return (
    <div className={`flex p-4 ${hasMore ? 'border-b border-default' : ''}`}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-x-2 text-default">
          <div className="relative">
            <Image
              src={`/~/images/protocols-${item.protocol}.png`}
              alt={CHAIN_TO_NAME_MAP[item.protocol]}
              style={{
                height: 28,
                width: 28,
              }}
            />
            {isWarplet && (
              <div
                className="absolute bottom-[-4px] right-[-4px]"
                style={{
                  height: 20,
                  width: 20,
                }}
              >
                <Image
                  src="/favicon-v3.png"
                  alt="Farcaster Wallet"
                  className="object-contain"
                  style={{
                    height: 20,
                    width: 20,
                  }}
                />
              </div>
            )}
          </div>
          <p className="text-base">{addressName}</p>
          {primaryBadge}
        </div>
        <div className="relative flex">
          {}
          <button
            ref={buttonRef}
            className="cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreHorizontalIcon className="text-muted" />
          </button>
          {menuSection}
        </div>
      </div>

      {isRemoveModalOpen && (
        <ConfirmationModal
          onCancel={() => {
            setIsRemoveModalOpen(false);
          }}
          onConfirm={handleRemoveConfirm}
          title="Remove Address"
          icon={({ size }) => (
            <Trash2 width={size} height={size} className="text-danger" />
          )}
          body={
            <p>
              Removes the verified address from your Farcaster profile. You can
              add it back later by connecting to this wallet again.
            </p>
          }
          hideAreYouSure
          confirmText="Remove"
          destructive
        />
      )}
    </div>
  );
}

function ProtocolSection({
  protocol,
  items,
}: {
  protocol: ApiVerificationProtocol;
  items: ApiVerification[];
}) {
  const protocolItems = useMemo(() => {
    return items.filter((item) => item.protocol === protocol);
  }, [items, protocol]);
  return (
    <div className="mb-3">
      <div className="mb-2 font-medium text-muted">
        {CHAIN_TO_NAME_MAP[protocol]}
      </div>
      <div className="w-full rounded-xl border border-default">
        {protocolItems.map((item, index) => (
          <VerifiedAddressItem
            key={item.address}
            item={item}
            hasMore={index !== protocolItems.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

const SettingsConnectedAddressesPage = memo(() => {
  const { fid } = useCurrentUser();
  const { data } = useVerifications({ fid });

  const [clickedConnectOnce, setClickedConnectOnce] = useState<boolean>(false);
  const navigate = useExternalNavigate();

  const verifications = useMemo(
    () => data?.pages.flatMap((page) => page.result.verifications) || [],
    [data],
  );

  const composeVerificationUrl = useComposeVerificationUrl();
  const invalidateVerifications = useInvalidateVerifications();

  const onConnectClick = useCallback(async () => {
    setClickedConnectOnce(true);
    const url = await composeVerificationUrl();
    navigate({ to: url, openInNewTab: true });
  }, [composeVerificationUrl, navigate]);

  const onRefreshClick = useCallback(() => {
    invalidateVerifications({ fid });
  }, [fid, invalidateVerifications]);

  const showManualRefreshButton = useMemo(() => {
    return clickedConnectOnce && verifications.length === 0;
  }, [clickedConnectOnce, verifications.length]);

  return (
    <Page meta={{ title: 'Verified addresses / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="flex flex-col">
              <span className="mb-2 text-xl font-semibold">
                Verified addresses
              </span>
              <div className="text-muted">
                <p
                  className="pb-3 font-normal tracking-[-0.25px]"
                  style={{ fontSize: '14px' }}
                >
                  Addresses you've proven ownership of on Farcaster. Set one as
                  primary to receive rewards, tips, and tokens.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <ProtocolSection protocol="ethereum" items={verifications} />
              <ProtocolSection protocol="solana" items={verifications} />
              {showManualRefreshButton && (
                <div className="self-center">
                  <DefaultButton
                    className="mt-4 w-min"
                    variant="muted"
                    onClick={onRefreshClick}
                  >
                    Refresh
                  </DefaultButton>
                </div>
              )}
            </div>
            <div className="mt-3 w-full">
              <DefaultButton
                size="md"
                variant="normal"
                className="w-full"
                onClick={onConnectClick}
              >
                Verify Address
              </DefaultButton>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsConnectedAddressesPage.displayName = 'SettingsConnectedAddressesPage';

export { SettingsConnectedAddressesPage };
