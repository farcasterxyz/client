import { ApiCastUrlEmbed } from 'farcaster-client-data';
import React from 'react';

import { DeprecatedFrameBanner } from '~/components/attachments/DeprecatedFrameBanner';

type DirectCastFramePreviewProps = {
  frameEmbed: ApiCastUrlEmbed;
};

const DirectCastFramePreview: React.FC<DirectCastFramePreviewProps> =
  React.memo(({ frameEmbed }) => {
    const frame = frameEmbed.openGraph.frame;
    // Deprecated: previously tracked events and handled image load errors

    if (frame) {
      return (
        <div className="relative flex grow flex-col justify-stretch place-self-start">
          <DeprecatedFrameBanner />
        </div>
      );
    } else {
      return null;
    }
  });

DirectCastFramePreview.displayName = 'DirectCastFramePreview';

export { DirectCastFramePreview };
