import { ApiCast, ApiFrameEmbedNextExtended } from 'farcaster-client-data';
import { convertCastForMiniAppLaunch } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';

import { FrameEmbedNext } from '~/components/frames/FrameEmbedNext';
import { LaunchContext } from '~/contexts/MiniAppProvider';

type FrameEmbedAttachmentProps = {
  cast: ApiCast;
  frameEmbed: ApiFrameEmbedNextExtended;
  disabled?: boolean;
  refreshable?: boolean;
  onRefreshClick?: () => void;
  onLaunchMiniApp?: () => void;
  height?: number;
  width?: number;
};

export const FrameEmbedAttachment: React.FC<FrameEmbedAttachmentProps> =
  React.memo(
    ({
      cast,
      frameEmbed,
      refreshable,
      onRefreshClick,
      onLaunchMiniApp,
      height,
      width,
    }) => {
      const context = useMemo<LaunchContext>(() => {
        return {
          type: 'cast_embed',
          embed: frameEmbed.frameUrl,
          cast: convertCastForMiniAppLaunch(cast),
        };
      }, [cast, frameEmbed.frameUrl]);

      return (
        <FrameEmbedNext
          frameEmbed={frameEmbed}
          context={context}
          refreshable={refreshable}
          onRefreshClick={onRefreshClick}
          onLaunchMiniApp={onLaunchMiniApp}
          height={height}
          width={width}
        />
      );
    },
  );
