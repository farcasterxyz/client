import {
  ApiFrameEmbedNext,
  ApiFrameEmbedNextExtended,
  domainFromUrl,
  isPublicUrl,
} from 'farcaster-client-data';
import { useMemo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameEmbedNext } from '~/components/frames/FrameEmbedNext';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { ImageFactsTable } from './ImageFactsTable';

const PreviewMiniAppEmbed = ({
  title = 'Embed Preview',
  appUrl,
  frameEmbedConfig,
  disabled,
}: {
  title?: string;
  appUrl: string;
  frameEmbedConfig: ApiFrameEmbedNext | undefined;
  disabled?: boolean;
}) => {
  const currentUser = useCurrentUser();
  const { launchMiniApp } = useMinimizableWindowContext();

  const launchUrl =
    frameEmbedConfig?.button?.action?.type === 'launch_frame' ||
    frameEmbedConfig?.button?.action?.type === 'launch_miniapp'
      ? (frameEmbedConfig?.button?.action?.url ?? appUrl)
      : undefined;

  const frameEmbedExtended = useMemo(() => {
    if (!launchUrl || !frameEmbedConfig) {
      return undefined;
    }

    return {
      frameUrl: launchUrl,
      frameEmbed: frameEmbedConfig,
      imageAspectRatio: frameEmbedConfig?.aspectRatio ?? '3:2',
      author: currentUser,
    } as ApiFrameEmbedNextExtended;
  }, [frameEmbedConfig, launchUrl, currentUser]);

  const resolvedDisabled = useMemo(() => {
    if (disabled) {
      return disabled;
    }
    if (!frameEmbedExtended) {
      return true;
    }
    return (
      (frameEmbedExtended.frameEmbed?.button?.action?.type !== 'launch_frame' &&
        frameEmbedExtended.frameEmbed?.button?.action?.type !==
          'launch_miniapp') ||
      !launchUrl ||
      !isPublicUrl(launchUrl)
    );
  }, [disabled, frameEmbedExtended, launchUrl]);

  const handleLaunch = () => {
    if (disabled || !launchUrl) {
      return;
    }

    launchMiniApp({
      context: {
        type: 'dev_preview',
      },
      launchConfig: {
        type: 'standalone',
        name: domainFromUrl(appUrl),
        url: launchUrl,
        author: currentUser,
      },
      debug: true,
    });
  };

  const isValidFrameEmbed = useMemo(() => {
    if (!frameEmbedExtended) {
      return false;
    }

    return launchUrl && isPublicUrl(launchUrl);
  }, [frameEmbedExtended, launchUrl]);

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-1">
        <div className="text-base font-medium">{title}</div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex h-[358px] w-full flex-col items-center justify-center gap-2 rounded-lg bg-faint lg:w-[470px]">
          {isValidFrameEmbed ? (
            <div className="min-h-[197px] w-[300px] rounded-lg shadow-lg bg-app">
              <div className="border-default">
                <FrameEmbedNext
                  frameEmbed={frameEmbedExtended!}
                  context={{
                    type: 'dev_preview',
                  }}
                  debug
                  disabled={resolvedDisabled}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="font-medium text-muted">
                Preview not available
              </div>
              <div className="text-sm text-muted">
                This URL won't show up as a Mini App embed when shared.
              </div>
            </div>
          )}
          {!isValidFrameEmbed && appUrl && (
            <div className="pt-4 text-muted">
              <DefaultButton onClick={handleLaunch}>
                Open URL as Mini App
              </DefaultButton>
            </div>
          )}
        </div>
        {frameEmbedConfig?.imageUrl && (
          <ImageFactsTable imageUrl={frameEmbedConfig.imageUrl} />
        )}
      </div>
    </div>
  );
};

export { PreviewMiniAppEmbed };
