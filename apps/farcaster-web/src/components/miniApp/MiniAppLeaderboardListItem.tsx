import classNames from 'classnames';
import { ApiFrame } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FrameImageIcon } from '~/components/icons/FrameImageIcon';
import { Image } from '~/components/images/Image';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';

export interface MiniAppListItemProps {
  item: ApiFrame;
  rightSection?: React.ReactNode;
  noBorder?: boolean;
}

export const MiniAppListItem: React.FC<MiniAppListItemProps> = React.memo(
  ({ item, rightSection, noBorder }) => {
    const { launchMiniApp } = useMinimizableWindowContext();
    const [imageError, setImageError] = useState(false);
    const username = item.author
      ? resolveUsername({
          username: item.author.username,
          fid: item.author.fid,
        }).replace('@', '')
      : undefined;

    const handleFrameClick = () => {
      launchMiniApp({
        context: {
          type: 'launcher',
        },
        launchConfig: {
          type: 'standalone',
          name: item.name || '',
          url: item.homeUrl || '',
          splashImageUrl: item.splashImageUrl || '',
          splashBackgroundColor: item.splashBackgroundColor || '',
          author: item.author,
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
            <div
              className={classNames(
                'border-hairline relative h-14 w-14 shrink-0 rounded-[11.2px] border bg-overlay-faint border-faint',
                'cursor-pointer hover:bg-hover',
              )}
              onClick={handleFrameClick}
            >
              {!imageError ? (
                <Image
                  src={item.iconUrl || ''}
                  alt={item.name || ''}
                  className="size-full rounded-[11.2px] object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <FrameImageIcon size={32} />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-stretch justify-center space-y-0.5">
              <div
                className={classNames(
                  'font-semibold text-default',
                  'cursor-pointer hover:underline',
                )}
                onClick={handleFrameClick}
              >
                {item.name}
              </div>
              {item.description ? (
                <div className="line-clamp-2 break-words text-sm text-tertiary">
                  {item.description}
                </div>
              ) : null}
              {item.author && username && (
                <div className="flex min-w-0 flex-row flex-wrap items-center gap-1">
                  <div className="text-sm text-default">by</div>
                  <div className="flex items-center">
                    <Avatar
                      user={item.author}
                      size="xs"
                      hideFollowButton
                      style={{ marginTop: '5px' }}
                      withDetailsPopover
                    />
                  </div>
                  <LinkToProfileWithSummaryTooltip
                    title={username}
                    user={item.author}
                  >
                    <div
                      className={classNames(
                        '!font-base text-action-primary text-sm  hover:underline',
                      )}
                    >
                      {username}
                    </div>
                  </LinkToProfileWithSummaryTooltip>
                </div>
              )}
            </div>
          </div>
          {rightSection}
        </div>
      </div>
    );
  },
);

MiniAppListItem.displayName = 'MiniAppListItem';
