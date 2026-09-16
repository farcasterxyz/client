import classNames from 'classnames';
import { FC, memo } from 'react';

import { LoginQRCode } from '~/lazy/components';

type LoginQRCodeWithInstructionsProps = {
  channelId: string;
  onClose: () => void;
  attemptingLogin: boolean;
};

const LoginQRCodeWithInstructions: FC<LoginQRCodeWithInstructionsProps> = memo(
  ({ channelId, onClose, attemptingLogin }) => {
    return (
      <>
        <div className="flex flex-col space-y-3 p-8 sm:items-start">
          <div className="flex w-full flex-row justify-around">
            <div
              className={classNames(
                'relative mt-2 flex justify-around sm:mt-0',
                attemptingLogin && 'animate-pulse',
              )}
            >
              <LoginQRCode channelId={channelId} />
            </div>
          </div>
          <h3 className="font-seasonMix text-3xl font-semibold text-light">
            Log in with mobile
          </h3>
          <div className="text-light">
            To log in using Farcaster on your mobile device, open the Camera app{' '}
            and scan the QR code.
          </div>
          <div
            className="landing-btn-secondary-bg flex w-full cursor-pointer items-center justify-center rounded-[300px] px-[36px] py-[10px]"
            onClick={onClose}
          >
            <div className="text-[16px] text-light">Cancel</div>
          </div>
        </div>
      </>
    );
  },
);

LoginQRCodeWithInstructions.displayName = 'LoginQRCodeWithInstructions';

export { LoginQRCodeWithInstructions };
