import React from 'react';

import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

import { DefaultCloseModalButton } from './DefaultCloseModalButton';

type AppStoreRedirectsModalProps = {
  onClose: () => void;
};

const AppStoreRedirectsModal: React.FC<AppStoreRedirectsModalProps> =
  React.memo(({ onClose }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="flex size-auto max-w-[500px] flex-col items-center justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex w-full flex-row-reverse px-2">
                <DefaultCloseModalButton onClick={onClose} className="p-2" />
              </div>
              <div className="flex w-full flex-col space-y-6 p-6 py-10">
                <span className="text-center text-default">
                  To create an account, download the app.
                </span>
                <div className="flex flex-col items-center justify-center pb-4 sm:flex-row sm:space-x-4">
                  <ExternalLink
                    href="https://apps.apple.com/us/app/farcaster/id1600555445"
                    title="Download iOS app"
                  >
                    <Image
                      alt="Download iOS app"
                      className="mb-4 max-w-[200px]"
                      src={'https://farcaster.xyz/~/images/DownloadApple.png'}
                    />
                  </ExternalLink>
                  <ExternalLink
                    href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                    title="Download Android app"
                  >
                    <Image
                      alt="Download Android app"
                      className="mb-4 max-w-[200px]"
                      src={'https://farcaster.xyz/~/images/DownloadGoogle.png'}
                    />
                  </ExternalLink>
                </div>
              </div>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  });

AppStoreRedirectsModal.displayName = 'AppStoreRedirectsModal';

export { AppStoreRedirectsModal };
