import { CheckIcon } from '@primer/octicons-react';
import cn from 'classnames';
import {
  ApiFrameEmbedNextExtended,
  preserveQueryParams,
} from 'farcaster-client-data';
import {
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import { RotateCwIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameImageIcon } from '~/components/icons/FrameImageIcon';
import { Image } from '~/components/images/Image';
import { Tooltip } from '~/components/Tooltip';
import { LaunchContext } from '~/contexts/MiniAppProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useViewToken } from '~/hooks/useViewToken';

const BORDER_RADIUS = 12;

type FeedFrameAttachmentProps = {
  frameEmbed: ApiFrameEmbedNextExtended;
  context: LaunchContext;
  disabled?: boolean;
  debug?: boolean;
  refreshable?: boolean;
  onRefreshClick?: () => void;
  onLaunchMiniApp?: () => void;
  height?: number;
  width?: number;
};

const RefreshButton = ({ onRefreshClick }: { onRefreshClick: () => void }) => {
  const [refreshed, setRefreshed] = useState(false);

  const refresh = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setRefreshed(true);
      onRefreshClick();

      setTimeout(() => {
        setRefreshed(false);
      }, 2000);
    },
    [onRefreshClick],
  );

  return (
    <Tooltip
      trigger={
        <DefaultButton
          onClick={refresh}
          className="absolute right-3 top-3 flex size-8 items-center justify-center p-0"
          title=""
          aria-label=""
          variant="secondary"
          size="sm"
        >
          {refreshed ? (
            <CheckIcon className="text-green-500" size={16} />
          ) : (
            <RotateCwIcon
              size="small"
              className="text-gray-500 dark:text-gray-400"
            />
          )}
        </DefaultButton>
      }
      content={<div className="px-1 text-sm text-white">Refresh metadata</div>}
    />
  );
};

export const FrameEmbedNext: React.FC<FeedFrameAttachmentProps> = React.memo(
  ({
    frameEmbed: frameEmbedExtended,
    context,
    disabled = false,
    debug = false,
    refreshable = false,
    onRefreshClick,
    onLaunchMiniApp,
    height,
    width,
  }) => {
    const { launchMiniApp } = useMinimizableWindowContext();
    const viewToken = useViewToken();
    const { frameUrl, frameEmbed } = frameEmbedExtended;

    const domain = useMemo(() => {
      try {
        return new URL(frameUrl).hostname;
      } catch {
        return '';
      }
    }, [frameUrl]);
    const { data: frameDetailsData } = useNonSuspenseFrameDetails({
      domain,
      enabled: !!domain,
    });
    const frameDetails = useGloballyCachedFrame(frameDetailsData);

    const aspectRatio = 1.5;
    const [showPlaceholder, setShowPlaceholder] = useState(
      !frameEmbed?.imageUrl,
    );

    useEffect(() => {
      setShowPlaceholder(!frameEmbed?.imageUrl);
    }, [frameEmbed?.imageUrl]);

    const handleClick = useCallback(
      (e: React.SyntheticEvent) => {
        if (disabled) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();

        const action = frameEmbed?.button?.action;
        if (
          action?.type === 'launch_frame' ||
          action?.type === 'launch_miniapp'
        ) {
          launchMiniApp({
            context,
            launchConfig: {
              type: 'manifest',
              url: action?.url
                ? preserveQueryParams({
                    launchUrl: action.url,
                    sourceUrl: frameUrl,
                  })
                : frameUrl,
            },
            debug,
          });
          onLaunchMiniApp?.();
        } else if (action?.type === 'view_token') {
          viewToken({
            url: frameUrl,
            token: action?.token,
          });
        }
      },
      [
        frameEmbed?.button?.action,
        launchMiniApp,
        onLaunchMiniApp,
        viewToken,
        frameUrl,
        context,
        debug,
        disabled,
      ],
    );

    const handleOnError = useCallback(() => {
      setShowPlaceholder(true);
    }, []);

    const handleOnLoad = useCallback(() => {
      setShowPlaceholder(false);
    }, []);

    if (frameDetails?.harmful && !debug) {
      return null;
    }

    return (
      <div
        className="shrink-0 overflow-hidden border border-default"
        style={{ borderRadius: BORDER_RADIUS, height, width }}
      >
        <div
          className={cn('relative bg-faint', {
            'cursor-pointer': !disabled,
          })}
          onClick={handleClick}
        >
          {frameEmbed?.imageUrl && (
            <Image
              src={frameEmbed.imageUrl}
              alt={frameEmbed?.button?.title || 'Frame image'}
              className={`${showPlaceholder ? 'opacity-0' : 'opacity-100'}`}
              style={{
                height: typeof height !== 'undefined' ? height - 48 : undefined,
                aspectRatio,
                width,
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              onError={handleOnError}
              onLoad={handleOnLoad}
            />
          )}
          {showPlaceholder && (
            <div
              className={cn(
                'flex items-center justify-center',
                frameEmbed?.imageUrl ? 'absolute inset-0' : '',
              )}
              style={{
                aspectRatio,
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            >
              <FrameImageIcon size={48} />
            </div>
          )}
          {refreshable && onRefreshClick && (
            <RefreshButton onRefreshClick={onRefreshClick} />
          )}
        </div>
        <DefaultButton
          onClick={handleClick}
          className="flex h-12 w-full items-center justify-center rounded-none text-lg font-semibold active:!border-none disabled:opacity-50"
          disabled={disabled}
          variant="tertiary"
        >
          {frameEmbed?.button?.title}
        </DefaultButton>
      </div>
    );
  },
);
