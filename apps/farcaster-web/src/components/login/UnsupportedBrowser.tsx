import { getNotionLinkTarget } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';

type UnsupportedBrowserProps = {
  onClose: () => void;
};

const UnsupportedBrowser: FC<UnsupportedBrowserProps> = memo(({ onClose }) => {
  return <UnsupportedBrowserContent onClose={onClose} />;
});

UnsupportedBrowser.displayName = 'UnsupportedBrowser';

type UnsupportedBrowserContentProps = {
  onClose: () => void;
};

const UnsupportedBrowserContent: FC<UnsupportedBrowserContentProps> = memo(
  ({ onClose }) => {
    return (
      <div className="min-h-[264px] w-full">
        <div className="relative h-full">
          <h3 className="mb-4 text-xl font-semibold">
            Your browser is not supported
          </h3>
          <div>
            Please use the latest version of Safari, Chrome, or Edge to securely
            log in
          </div>
          <ExternalLink
            href={getNotionLinkTarget({ to: 'passkeys' })}
            className="mt-2 block text-sm sm:mt-4"
            onClick={onClose}
            title="Need help? Learn more"
          >
            Need help? Learn more
          </ExternalLink>
          <DefaultButton
            className="absolute bottom-0 w-full"
            variant="muted"
            onClick={onClose}
          >
            Cancel
          </DefaultButton>
        </div>
      </div>
    );
  },
);

UnsupportedBrowserContent.displayName = 'UnsupportedBrowserContent';

export { UnsupportedBrowser };
