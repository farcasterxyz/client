import { Dialog } from '@headlessui/react';
import { InfoIcon, ZapIcon } from '@primer/octicons-react';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React from 'react';

import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

type FrameTransactionAlertModalProps = {
  onAck: () => void;
  onClose: () => void;
};

const WalletIcon: React.FC = () => {
  return (
    <svg width={40} height={40} fill="none">
      <path
        fill="#8A63D2"
        d="M3 9.219a7.086 7.086 0 0 1 4.25-1.406h25.5c1.594 0 3.066.523 4.25 1.406a4.192 4.192 0 0 0-1.245-2.983A4.252 4.252 0 0 0 32.75 5H7.25a4.266 4.266 0 0 0-3.005 1.236A4.203 4.203 0 0 0 3 9.219Zm0 5.625a7.086 7.086 0 0 1 4.25-1.406h25.5c1.594 0 3.066.523 4.25 1.406a4.191 4.191 0 0 0-1.245-2.983 4.253 4.253 0 0 0-3.005-1.236H7.25a4.266 4.266 0 0 0-3.005 1.236A4.203 4.203 0 0 0 3 14.844Zm11.333 1.406c.501 0 .982.198 1.336.55.354.35.553.828.553 1.325 0 .995.398 1.948 1.107 2.652A3.792 3.792 0 0 0 20 21.875a3.792 3.792 0 0 0 2.671-1.098 3.736 3.736 0 0 0 1.107-2.652c0-.497.199-.974.553-1.326.354-.351.835-.549 1.336-.549h7.083a4.277 4.277 0 0 1 3.005 1.236A4.218 4.218 0 0 1 37 20.469V30.78a4.191 4.191 0 0 1-1.245 2.983A4.253 4.253 0 0 1 32.75 35H7.25a4.266 4.266 0 0 1-3.005-1.236A4.203 4.203 0 0 1 3 30.781V20.47c0-1.12.448-2.192 1.245-2.983A4.266 4.266 0 0 1 7.25 16.25h7.083Z"
      />
    </svg>
  );
};

const FrameTransactionAlertModal: React.FC<FrameTransactionAlertModalProps> =
  React.memo(({ onAck, onClose }) => {
    const navigate = useExternalNavigate();

    return (
      <Dialog open onClose={onClose} className="relative z-50">
        <DialogBackdrop />
        <DialogPanelContainer>
          <Dialog.Panel>
            <div className="flex h-auto max-h-[468px] w-[368px] flex-col items-start justify-center rounded-lg border p-6 pb-4 bg-app border-default">
              <div className="flex size-full max-h-[468px] flex-col justify-between space-y-4">
                <span className="flex flex-col items-center space-y-4">
                  <span className="flex w-full flex-col items-start space-y-2">
                    <div className="flex w-full flex-row items-center justify-between">
                      <div className="flex size-[48px] flex-col items-center justify-center rounded-lg bg-[#8A63D21A]">
                        <WalletIcon />
                      </div>
                      <DefaultButton
                        title="Learn More"
                        className="flex h-10 flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-default "
                        onClick={(e) => {
                          e.stopPropagation();

                          navigate({
                            to: getNotionLinkTarget({ to: 'connect-wallet' }),
                            openInNewTab: true,
                          });
                        }}
                      >
                        <span className="mr-0.5 flex flex-row items-center">
                          <InfoIcon size={16} className="text-faint" />
                        </span>
                      </DefaultButton>
                    </div>
                    <span className="text-xl font-semibold">
                      Connect wallet
                    </span>
                    <span className="text-default">
                      When you click the transaction button (<ZapIcon />
                      ), a frame will be able to:
                    </span>
                  </span>
                </span>
                <div className="flex flex-col rounded bg-overlay-light">
                  <div className="px-4 py-3">Read account balances</div>
                  <div className="border-t px-4 py-3 border-default">
                    Suggest onchain actions
                  </div>
                </div>
                <div className="mt-4 flex flex-col space-y-1">
                  <DefaultButton
                    title="Continue"
                    className="flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal !bg-action-primary hover:!bg-[#7C65C1F0]"
                    onClick={onAck}
                  >
                    <span className="flex flex-row items-center text-light">
                      <span className="">Continue</span>
                    </span>
                  </DefaultButton>
                  <DefaultButton
                    title="Cancel"
                    className="flex h-10 w-min flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted"
                    onClick={onClose}
                  >
                    <span className="flex flex-row items-center text-light">
                      <span className="">Cancel</span>
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

FrameTransactionAlertModal.displayName = 'FrameTransactionAlertModal';

export { FrameTransactionAlertModal };
