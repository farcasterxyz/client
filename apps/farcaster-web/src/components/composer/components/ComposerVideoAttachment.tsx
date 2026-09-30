import { MuteIcon, UnmuteIcon, XIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { getImageAspectRatio } from 'farcaster-client-hooks';
import React from 'react';

import { LocallyProbedVideo } from '~/components/composer/context/OptimisticMediaEmbedsProvider';

type ComposerVideoAttachmentProps = {
  video: LocallyProbedVideo;
  queuedCastLocalKey: number;
  onDelete: () => void;
};

const ComposerVideoAttachment: React.FC<ComposerVideoAttachmentProps> = ({
  video,
  onDelete,
}) => {
  const [muted, setMuted] = React.useState<boolean>(true);

  const aspectRatio = React.useMemo(() => {
    return getImageAspectRatio({ w: video.w, h: video.h });
  }, [video.h, video.w]);

  const onMuteClick = React.useCallback(() => {
    setMuted((prevMuted) => !prevMuted);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-default">
      <div
        className="absolute right-0 top-0 z-10 mr-2 mt-2 flex cursor-pointer justify-center rounded-full p-1 bg-overlay"
        onClick={onDelete}
      >
        <XIcon size={18} className="font-semibold text-white" />
      </div>
      <div
        className="absolute bottom-0 right-0 z-10 mb-2 mr-2 flex cursor-pointer justify-center rounded-full p-1 bg-overlay"
        onClick={onMuteClick}
      >
        {muted ? (
          <MuteIcon size={18} className="font-semibold text-white" />
        ) : (
          <UnmuteIcon size={18} className="font-semibold text-white" />
        )}
      </div>
      <video
        src={video.src}
        className={classNames(
          'relative max-h-[400px] w-min origin-center cursor-pointer  object-cover',
        )}
        style={{
          aspectRatio,
        }}
        autoPlay={true}
        loop={true}
        muted={muted}
      />
    </div>
  );
};

export { ComposerVideoAttachment };
