import { CopyIcon } from '@primer/octicons-react';
import { ApiUserProfile, ApiWalletLabel } from 'farcaster-client-data';
import React from 'react';

import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import {
  formatNeynarScore,
  getDisplayedNeynarScore,
} from '~/components/profiles/neynarScoreUtils';

import { DefaultCloseModalButton } from './DefaultCloseModalButton';

type UserExtrasModalProps = {
  userProfile: ApiUserProfile;
  onCancel: () => void;
};

// Label mapping from mobile
const LABELS: Record<ApiWalletLabel, string> = {
  auth: 'Auth',
  primary: 'Primary',
  warpcast: 'Farcaster Wallet',
};

function WalletAddressWithCopyAction({
  walletAddress,
  tags,
}: {
  walletAddress: string;
  tags?: ApiWalletLabel[];
}) {
  const [copied, setCopied] = React.useState<boolean>(false);

  const copyToClipboard = React.useCallback(() => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [walletAddress]);

  return (
    <div className="flex flex-row items-center">
      <span className="overflow-hidden text-ellipsis text-sm text-default [font-variant-numeric:tabular-nums] sm:max-w-40 lg:max-w-none">
        {copied ? 'Copied!' : walletAddress}
      </span>
      {!copied && (
        <span
          className="ml-2 flex cursor-pointer flex-row items-center hover:bg-overlay-faint hover:text-default"
          onClick={copyToClipboard}
        >
          <CopyIcon size={10} className="text-action-purple" />
        </span>
      )}
      {!copied && tags && tags.length > 0 && (
        <div className="ml-3 flex flex-row gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-action-primary/10 rounded-full px-2 py-0.5 text-xs font-medium text-action-purple"
            >
              {LABELS[tag] || tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const UserExtrasModal: React.FC<UserExtrasModalProps> = React.memo(
  ({ userProfile, onCancel }) => {
    const { extras } = userProfile;
    const [copiedFid, setCopiedFid] = React.useState<boolean>(false);

    const copyFidToClipboard = React.useCallback(() => {
      navigator.clipboard.writeText(extras.fid.toString());
      setCopiedFid(true);

      setTimeout(() => {
        setCopiedFid(false);
      }, 2000);
    }, [extras.fid]);

    return (
      <Modal>
        <DefaultModalContainer onClose={onCancel}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="scrollbar-vert flex h-auto w-[650px] flex-col items-start justify-center overflow-y-auto rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex w-full flex-row-reverse px-2">
                <DefaultCloseModalButton onClick={onCancel} className="p-2" />
              </div>
              <div className="flex w-full flex-col space-y-6 p-6 py-10">
                <div className="flex flex-col">
                  <span className="font-semibold text-default">FID</span>
                  <div className="flex flex-row items-center">
                    <span className="text-default">
                      {copiedFid ? 'Copied!' : extras.fid}
                    </span>
                    {!copiedFid && (
                      <span
                        className="ml-2 flex cursor-pointer flex-row items-center hover:bg-overlay-faint hover:text-default"
                        onClick={copyFidToClipboard}
                      >
                        <CopyIcon size={10} className="text-action-purple" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-default">
                    Farcaster custody address
                  </span>
                  <WalletAddressWithCopyAction
                    walletAddress={extras.custodyAddress}
                    tags={
                      extras.walletLabels?.find(
                        (label) =>
                          label.address.toLowerCase() ===
                          extras.custodyAddress.toLowerCase(),
                      )?.labels || []
                    }
                  />
                </div>
                {typeof extras.ethWallets !== 'undefined' &&
                  extras.ethWallets?.length !== 0 && (
                    <div className="flex flex-col">
                      <span className="font-semibold text-default">
                        Connected Ethereum wallets
                      </span>
                      {extras.ethWallets.map((ew) => (
                        <WalletAddressWithCopyAction
                          key={ew}
                          walletAddress={ew}
                          tags={
                            extras.walletLabels?.find(
                              (label) =>
                                label.address.toLowerCase() ===
                                ew.toLowerCase(),
                            )?.labels || []
                          }
                        />
                      ))}
                    </div>
                  )}
                {typeof extras.solanaWallets !== 'undefined' &&
                  extras.solanaWallets?.length !== 0 && (
                    <div className="flex flex-col">
                      <span className="font-semibold text-default">
                        Connected Solana wallets
                      </span>
                      {extras.solanaWallets.map((sw) => (
                        <WalletAddressWithCopyAction
                          key={sw}
                          walletAddress={sw}
                          tags={
                            extras.walletLabels?.find(
                              (label) =>
                                label.address.toLowerCase() ===
                                sw.toLowerCase(),
                            )?.labels || []
                          }
                        />
                      ))}
                    </div>
                  )}
                <div className="flex flex-col">
                  <span className="font-semibold text-default">
                    Neynar score
                  </span>
                  <div className="flex flex-row items-center">
                    <span className="text-default">
                      {formatNeynarScore(getDisplayedNeynarScore(userProfile))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

UserExtrasModal.displayName = 'UserExtrasModal';

export { UserExtrasModal };
