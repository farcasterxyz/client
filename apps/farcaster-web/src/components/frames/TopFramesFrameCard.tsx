import cn from 'classnames';
import { ApiFrame } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React, { useEffect } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameImageIcon } from '~/components/icons/FrameImageIcon';
import { Image } from '~/components/images/Image';
import { LaunchContext } from '~/contexts/MiniAppProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';

interface TopFramesFrameCardProps {
  frame: ApiFrame;
  launchContext?: LaunchContext;
  disabled?: boolean;
}

const TopFramesFrameCard: React.FC<TopFramesFrameCardProps> = ({
  frame,
  launchContext,
  disabled,
}) => {
  const { launchMiniApp } = useMinimizableWindowContext();
  const [imageError, setImageError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const handleLaunch = () => {
    if (disabled) {
      return;
    }
    launchMiniApp({
      context: launchContext || {
        type: 'launcher',
      },
      launchConfig: {
        type: 'standalone',
        name: frame.name,
        url: frame.homeUrl,
        splashImageUrl: frame.splashImageUrl,
        splashBackgroundColor: frame.splashBackgroundColor,
        author: frame.author,
      },
      debug: true,
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (frame.iconUrl) {
      setIsLoading(false);
      setImageError(false);
    }
  }, [frame.iconUrl]);

  const authorIsProUser = useUserLevel(frame.author) === 'pro';

  return (
    <div onClick={handleLaunch}>
      <div
        className={cn(
          'border-hairline flex w-full flex-row p-3 border-default',
          {
            'cursor-pointer hover:bg-overlay-faint': !disabled,
          },
        )}
      >
        <div className="border-hairline mr-3 flex size-10 min-w-10 items-center justify-center rounded-[8px] border bg-faint border-faint">
          {!imageError && !isLoading ? (
            <Image
              width={40}
              height={40}
              src={frame.iconUrl}
              alt={frame.name}
              className="rounded-[8px] object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <FrameImageIcon size={20} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 grow flex-col">
          <div className="truncate text-base font-semibold">{frame.name}</div>
          {frame.author && (
            <div className="flex flex-row items-center gap-1">
              <div className="truncate text-xs text-muted">
                by {resolveUsernameShort(frame.author)}
              </div>
              {authorIsProUser && <FarcasterProBadge size={14} />}
            </div>
          )}
        </div>
        <div className="ml-3 flex items-center">
          <DefaultButton
            onClick={handleLaunch}
            variant="normal"
            size="sm"
            className="h-[30px] min-w-[60px] !text-sm"
            disabled={disabled}
          >
            Open
          </DefaultButton>
        </div>
      </div>
    </div>
  );
};

export { TopFramesFrameCard };
