import { ApiCast, ApiFrameEmbedNextExtended } from 'farcaster-client-data';
import { convertCastForMiniAppLaunch } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';

import { FrameEmbedNext } from '~/components/Frames/FrameEmbedNext';
import { LaunchContext } from '~/hooks/useLaunchFrame';

type FrameEmbedAttachmentProps = {
  cast: ApiCast;
  frameEmbed: ApiFrameEmbedNextExtended;
  disabled?: boolean;
  refreshable?: boolean;
  onRefreshPress?: () => void;
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
      onRefreshPress,
      onLaunchMiniApp,
      height,
      width,
      disabled,
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
          onRefreshPress={onRefreshPress}
          onLaunchMiniApp={onLaunchMiniApp}
          height={height}
          width={width}
          disabled={disabled}
        />
      );
    },
  );
