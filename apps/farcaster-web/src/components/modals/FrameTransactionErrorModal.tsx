import { Dialog } from '@headlessui/react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { TransactionFailureReason } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';

import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type FrameTransactionErrorModalProps = {
  reason: TransactionFailureReason;
  additionalMessage?: string;
  errorDetails?: string;
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
        d="M21 41.8002C26.5165 41.8002 31.807 39.6088 35.7078 35.708C39.6085 31.8073 41.7999 26.5167 41.7999 21.0002C41.7999 15.4837 39.6085 10.1931 35.7078 6.29237C31.807 2.39162 26.5165 0.200195 21 0.200195C15.4834 0.200195 10.1929 2.39162 6.29213 6.29237C2.39137 10.1931 0.199951 15.4837 0.199951 21.0002C0.199951 26.5167 2.39137 31.8073 6.29213 35.708C10.1929 39.6088 15.4834 41.8002 21 41.8002ZM16.528 13.7722C16.1583 13.4277 15.6694 13.2402 15.1642 13.2491C14.659 13.2581 14.177 13.4627 13.8197 13.82C13.4625 14.1773 13.2578 14.6593 13.2489 15.1644C13.24 15.6696 13.4275 16.1585 13.7719 16.5282L18.2439 21.0002L13.7719 25.4722C13.5804 25.6507 13.4267 25.866 13.3201 26.1052C13.2135 26.3444 13.1562 26.6026 13.1516 26.8644C13.147 27.1263 13.1952 27.3863 13.2932 27.6291C13.3913 27.872 13.5373 28.0925 13.7225 28.2777C13.9076 28.4629 14.1282 28.6088 14.371 28.7069C14.6138 28.805 14.8739 28.8532 15.1357 28.8485C15.3975 28.8439 15.6558 28.7866 15.8949 28.68C16.1341 28.5734 16.3494 28.4198 16.528 28.2282L21 23.7562L25.472 28.2282C25.6505 28.4198 25.8658 28.5734 26.105 28.68C26.3441 28.7866 26.6024 28.8439 26.8642 28.8485C27.126 28.8532 27.3861 28.805 27.6289 28.7069C27.8717 28.6088 28.0923 28.4629 28.2774 28.2777C28.4626 28.0925 28.6086 27.872 28.7067 27.6291C28.8047 27.3863 28.8529 27.1263 28.8483 26.8644C28.8437 26.6026 28.7864 26.3444 28.6798 26.1052C28.5732 25.866 28.4195 25.6507 28.2279 25.4722L23.756 21.0002L28.2279 16.5282C28.5724 16.1585 28.7599 15.6696 28.751 15.1644C28.7421 14.6593 28.5374 14.1773 28.1802 13.82C27.8229 13.4627 27.3409 13.2581 26.8357 13.2491C26.3305 13.2402 25.8416 13.4277 25.472 13.7722L21 18.2442L16.528 13.7722Z"
        fill="#BBB"
      />
    </svg>
  );
};

const FrameTransactionErrorModal: React.FC<FrameTransactionErrorModalProps> =
  React.memo(({ reason, additionalMessage, errorDetails, onClose }) => {
    const userRejectedErrorCase = React.useMemo(() => {
      return reason === 'user_rejected';
    }, [reason]);

    const message = useMemo(() => {
      switch (reason) {
        case 'user_rejected':
          return 'Canceled in wallet';
        case 'insufficient_funds': {
          return 'Insufficient insufficient funds';
        }
        case 'unknown':
          return 'Failed in wallet';
      }
    }, [reason]);

    const { trackEvent } = useAnalytics();

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.FrameTxError, undefined);
    }, [trackEvent]);

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
                      {userRejectedErrorCase ? 'Canceled' : 'Failed'}
                    </span>
                    <div className="flex flex-col items-center">
                      <span className="text-center text-muted">{message}</span>
                      <span className="mt-1 text-center text-muted">
                        {additionalMessage}
                      </span>
                    </div>
                    {errorDetails && (
                      <div className="font-mono h-40 w-full overflow-y-scroll whitespace-pre-line p-3 text-sm bg-faint">
                        {errorDetails}
                      </div>
                    )}
                  </span>
                </span>
              </div>
              <div className="mt-4 flex w-full flex-col space-y-1">
                <DefaultButton
                  title="Dismiss"
                  className={classNames(
                    'flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal',
                    '!bg-[#7C65C1] hover:!bg-[#7C65C1F0]',
                  )}
                  onClick={onClose}
                >
                  <span className="flex flex-row items-center">
                    <span className="text-light">Dismiss</span>
                  </span>
                </DefaultButton>
              </div>
            </div>
          </Dialog.Panel>
        </DialogPanelContainer>
      </Dialog>
    );
  });

FrameTransactionErrorModal.displayName = 'FrameTransactionErrorModal';

export { FrameTransactionErrorModal };
