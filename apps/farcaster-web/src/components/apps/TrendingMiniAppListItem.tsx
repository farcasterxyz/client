import classNames from 'classnames';
import { ApiRankedMiniApp } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { useState } from 'react';

import { FrameImageIcon } from '~/components/icons/FrameImageIcon';
import { Image } from '~/components/images/Image';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';

export interface TrendingMiniAppListItemProps {
  item: ApiRankedMiniApp;
  index: number;
  noBorder?: boolean;
}
export const TrendingMiniAppListItem: React.FC<TrendingMiniAppListItemProps> =
  React.memo(({ item, index, noBorder }) => {
    const { launchMiniApp } = useMinimizableWindowContext();
    const [imageError, setImageError] = useState(false);
    const username = item.miniApp.author
      ? resolveUsername({
          username: item.miniApp.author.username,
          fid: item.miniApp.author.fid,
        }).replace('@', '')
      : undefined;

    const handleFrameClick = () => {
      launchMiniApp({
        context: {
          type: 'launcher',
        },
        launchConfig: {
          type: 'standalone',
          name: item.miniApp.name || '',
          url: item.miniApp.homeUrl || '',
          splashImageUrl: item.miniApp.splashImageUrl || '',
          splashBackgroundColor: item.miniApp.splashBackgroundColor || '',
          author: item.miniApp.author,
        },
      });
    };

    return (
      <div
        className={classNames(
          'min-h-8 border-b bg-card border-faint',
          noBorder && 'border-none',
        )}
      >
        <div className="flex min-w-0 flex-row items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-1 flex-row items-start gap-3">
            {/* Rank */}
            <div className="w-8 pt-1 text-center text-lg font-semibold text-tertiary">
              #{index + 1}
            </div>

            {/* Icon */}
            <div
              className={classNames(
                'border-hairline relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border bg-overlay-faint border-faint',
                'cursor-pointer hover:bg-hover',
              )}
              onClick={handleFrameClick}
            >
              {!imageError ? (
                <Image
                  src={item.miniApp.iconUrl || ''}
                  alt={item.miniApp.name || ''}
                  className="h-12 w-12 rounded-[10px] object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <FrameImageIcon size={28} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex w-full flex-col items-start justify-center space-y-0">
              <div
                className={classNames(
                  'font-semibold text-default',
                  'cursor-pointer hover:underline',
                )}
                onClick={handleFrameClick}
              >
                {item.miniApp.name}
              </div>
              {item.miniApp.description && (
                <div className="text-sm text-tertiary">
                  {item.miniApp.description}
                </div>
              )}
              {item.miniApp.author && username && (
                <div className="flex flex-row items-center gap-1">
                  <span className="text-sm text-tertiary">by</span>
                  <LinkToProfile
                    user={{ fid: item.miniApp.author.fid, username }}
                    title={username}
                    className="text-action-primary text-sm hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {username}
                  </LinkToProfile>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

TrendingMiniAppListItem.displayName = 'TrendingMiniAppListItem';
