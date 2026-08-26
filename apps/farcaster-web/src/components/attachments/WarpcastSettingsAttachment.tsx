import { GearIcon } from '@primer/octicons-react';
import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';

type WarpcastSettingsAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
};

const WarpcastSettingsAttachment: React.FC<WarpcastSettingsAttachmentProps> = ({
  og,
  disabled,
}) => {
  return (
    <div className="relative flex w-full flex-row items-center rounded-lg border border-faint">
      {!disabled && (
        <ExternalLink
          className="absolute inset-0 subtle-hover-z"
          href={og.url}
          title={og.url}
        />
      )}
      <div className="dark:bg-dark-app-background flex size-[48px] items-center justify-center rounded-l-lg border-r bg-[#efefef] object-cover border-faint">
        <GearIcon size={32} />
      </div>
      <div className="ml-4 flex flex-1 flex-col justify-center rounded-lg rounded-l-none">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-default">
            {og.description}
          </span>
          {og.description !== 'Manage your account preferences' && (
            <span className="font-regular text-span text-sm">
              Update your Farcaster settings
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export { WarpcastSettingsAttachment };
