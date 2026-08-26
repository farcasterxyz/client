import { Dialog } from '@headlessui/react';
import { LinkExternalIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { robinhood } from 'farcaster-client-data';
import React from 'react';
import {
  base,
  baseSepolia,
  bsc,
  celo,
  monad,
  monadTestnet,
  optimism,
  zora,
} from 'viem/chains';

import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';

type FrameTransactionSuccessModalProps = {
  transactionHash: string;
  transactionChainId: string;
  onClose: () => void;
};

const Icon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 42 42"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0002 41.8002C26.5167 41.8002 31.8073 39.6088 35.708 35.708C39.6088 31.8073 41.8002 26.5167 41.8002 21.0002C41.8002 15.4837 39.6088 10.1931 35.708 6.29237C31.8073 2.39162 26.5167 0.200195 21.0002 0.200195C15.4837 0.200195 10.1931 2.39162 6.29237 6.29237C2.39162 10.1931 0.200195 15.4837 0.200195 21.0002C0.200195 26.5167 2.39162 31.8073 6.29237 35.708C10.1931 39.6088 15.4837 41.8002 21.0002 41.8002ZM31.0284 16.2968C31.179 16.0895 31.2872 15.8547 31.347 15.6056C31.4068 15.3565 31.417 15.098 31.3769 14.845C31.3368 14.592 31.2473 14.3493 31.1135 14.1309C30.9796 13.9125 30.804 13.7226 30.5968 13.572C30.3895 13.4214 30.1547 13.3131 29.9056 13.2533C29.6565 13.1935 29.398 13.1834 29.145 13.2235C28.892 13.2635 28.6493 13.3531 28.4309 13.4869C28.2125 13.6208 28.0226 13.7963 27.872 14.0036L18.8162 26.4576L13.9282 21.5696C13.7482 21.3834 13.533 21.235 13.295 21.1329C13.0571 21.0308 12.8012 20.9771 12.5422 20.975C12.2833 20.9729 12.0266 21.0224 11.787 21.1205C11.5474 21.2187 11.3297 21.3636 11.1467 21.5467C10.9637 21.7299 10.819 21.9477 10.7211 22.1874C10.6232 22.4271 10.5739 22.6839 10.5763 22.9428C10.5787 23.2017 10.6326 23.4576 10.7349 23.6954C10.8372 23.9333 10.9859 24.1484 11.1722 24.3282L17.6722 30.8282C17.8714 31.0275 18.1115 31.1813 18.3759 31.279C18.6403 31.3766 18.9227 31.4158 19.2036 31.3938C19.4846 31.3718 19.7575 31.2892 20.0034 31.1516C20.2494 31.014 20.4626 30.8247 20.6284 30.5968L31.0284 16.2968Z"
        fill="#8A63D2"
      />
    </svg>
  );
};

const FrameTransactionSuccessModal: React.FC<FrameTransactionSuccessModalProps> =
  React.memo(({ transactionHash, transactionChainId, onClose }) => {
    const transactionExternalLink = React.useMemo(() => {
      switch (Number(transactionChainId)) {
        case monadTestnet.id:
          return `https://testnet.monadexplorer.com/tx/${transactionHash}`;
        case monad.id:
          return `https://monadexplorer.com/tx/${transactionHash}`;
        case celo.id:
          return `https://explorer.celo.org/mainnet/tx/${transactionHash}`;
        case zora.id:
          return `https://explorer.zora.energy/tx/${transactionHash}`;
        case base.id:
          return `https://basescan.org/tx/${transactionHash}`;
        case baseSepolia.id:
          return `https://sepolia.basescan.org/tx/${transactionHash}`;
        case optimism.id:
          return `https://optimistic.etherscan.io/tx/${transactionHash}`;
        case bsc.id:
          return `https://bscscan.com/tx/${transactionHash}`;
        case robinhood.id:
          return `https://robinhoodchain.blockscout.com/tx/${transactionHash}`;
        default:
          // Could throw here but likely component renderers won't expect that
          // so going with a default taregt instead.
          return `https://etherscan.io/tx/${transactionHash}`;
      }
    }, [transactionChainId, transactionHash]);

    return (
      <Dialog open onClose={onClose} className="relative z-50" static>
        <DialogBackdrop />
        <DialogPanelContainer>
          <Dialog.Panel>
            <div className="flex h-auto max-h-[468px] w-[368px] flex-col items-start justify-center rounded-lg border p-6 pb-4 bg-app border-default">
              <div className="flex size-full max-h-[468px] flex-col justify-between space-y-4">
                <span className="flex flex-col items-center space-y-4">
                  <span className="flex w-full flex-col items-center space-y-2">
                    <div className="flex size-[60px] flex-col items-center justify-center rounded-full bg-[#2A24321A]">
                      <Icon />
                    </div>
                    <span className="text-xl font-semibold">
                      Transaction Sent
                    </span>
                    <span className="text-center text-faint">
                      Your transaction will confirm shortly.{' '}
                      <ExternalLink
                        href={transactionExternalLink}
                        title={transactionExternalLink}
                        className="text-faint hover:underline"
                      >
                        View status
                        <LinkExternalIcon size={12} className="mb-[2px] ml-1" />
                      </ExternalLink>
                    </span>
                  </span>
                </span>
                <div className="mt-4 flex w-full flex-col space-y-2">
                  <DefaultButton
                    title="Continue"
                    className={classNames(
                      'flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal',
                      '!bg-[#7C65C1] hover:!bg-[#7C65C1F0]',
                    )}
                    onClick={onClose}
                  >
                    <span className="flex flex-row items-center">
                      <span className="text-light">Continue</span>
                    </span>
                  </DefaultButton>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </DialogPanelContainer>
      </Dialog>
    );
  });

FrameTransactionSuccessModal.displayName = 'FrameTransactionSuccessModal';

export { FrameTransactionSuccessModal };
