import classNames from 'classnames';
import {
  ApiCastUrlEmbed,
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import { isSnapEmbed } from 'farcaster-client-hooks';
import React from 'react';

import { DeprecatedFrameBanner } from '~/components/attachments/DeprecatedFrameBanner';
import { SnapEmbedAttachment } from '~/components/attachments/SnapEmbedAttachment';
import { FrameEmbedNext } from '~/components/frames/FrameEmbedNext';
import { LaunchContext } from '~/contexts/MiniAppProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { getDirectCastUrlEmbedDisplayMode } from '~/utils/directCastUrlEmbedPreviewStorage';

import { DirectCastsOpenGraphCastAttachment } from './DirectCastURLEmbedRenderer';

type DirectCastURLEmbedsProps = {
  conversation: ApiDirectCastConversationInfoV3;
  directCast: ApiDirectCastMessageV3;
  embeds: ApiCastUrlEmbed[];
  wrapperHasContentAboveEmbed: boolean;
};

const frameEmbedContext: LaunchContext = { type: 'launcher' };

const DirectCastURLEmbeds: React.FC<DirectCastURLEmbedsProps> = React.memo(
  ({ embeds, directCast, wrapperHasContentAboveEmbed }) => {
    const { fid: currentUserFid } = useCurrentUser();
    const selfDirectCast = directCast.senderFid === currentUserFid;

    const embed = embeds[0];

    if (typeof embed === 'undefined' || embed === null) {
      return null;
    }

    if (
      typeof embed.openGraph.frame !== 'undefined' &&
      embed.openGraph.frame.postUrl !== ''
    ) {
      return (
        <div
          className={classNames(
            'rounded-lg rounded-b-[10px]',
            selfDirectCast
              ? 'bg-self-direct-cast-embed'
              : 'bg-direct-cast-embed',
            wrapperHasContentAboveEmbed
              ? 'rounded-t-0 rounded-b-[10px]'
              : 'rounded-b-[10px]',
          )}
        >
          <DeprecatedFrameBanner />
        </div>
      );
    }

    if (embed.openGraph.frameEmbedNext) {
      return (
        <FrameEmbedNext
          frameEmbed={embed.openGraph.frameEmbedNext}
          context={frameEmbedContext}
        />
      );
    }

    if (isSnapEmbed(embed)) {
      return <SnapEmbedAttachment embed={embed} />;
    }

    const locallyChosenUrlEmbedDisplayMode = getDirectCastUrlEmbedDisplayMode(
      directCast.messageId,
    );
    const effectiveDisplayMode =
      locallyChosenUrlEmbedDisplayMode ??
      directCast.metadata?.urlEmbedDisplayMode;
    const layout = effectiveDisplayMode === 'large' ? 'large' : 'compact';

    return (
      <div
        key={embed.openGraph.url}
        className={classNames(
          'relative flex w-full grow flex-col justify-stretch place-self-start border border-default',
          selfDirectCast ? 'bg-self-direct-cast-embed' : 'bg-direct-cast-embed',
          wrapperHasContentAboveEmbed
            ? 'rounded-t-0 rounded-b-[10px]'
            : 'rounded-lg rounded-b-[10px]',
        )}
      >
        <DirectCastsOpenGraphCastAttachment
          embed={embed}
          attachment={embed.openGraph}
          disabled={false}
          skipWrapperStyles={true}
          variant={'direct-cast'}
          layout={layout}
        />
      </div>
    );
  },
);

export { DirectCastURLEmbeds };
