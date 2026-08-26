import { ApiSpammyRepliesNotificationGroup } from 'farcaster-client-data';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { FlagIcon } from '~/components/casts/actions/icons/FlagIcon';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

type SpammyRepliesNotificationGroupProps = {
  notificationGroup: ApiSpammyRepliesNotificationGroup;
};

const SpammyRepliesNotificationGroup: FC<SpammyRepliesNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        clickable={false}
      >
        <NotificationIcon variant="yellow">
          <div className="pt-[3px]">
            <FlagIcon />
          </div>
        </NotificationIcon>
        <div>
          <div className="mb-2 w-full min-w-0">
            Warning: your account is at risk of being labelled spammy
          </div>
          <ExternalLink
            href={getNotionLinkTarget({ to: 'spammy-replies' })}
            title={'Learn more'}
            className="align-right self-center text-inherit"
          >
            <DefaultButton className="min-w-[100px]" size="sm" variant="muted">
              {'Learn more'}
            </DefaultButton>
          </ExternalLink>
        </div>
      </NotificationGroupContainer>
    );
  });

SpammyRepliesNotificationGroup.displayName = 'SpammyRepliesNotificationGroup';

export { SpammyRepliesNotificationGroup };
