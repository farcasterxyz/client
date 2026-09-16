import { PinIcon } from '@primer/octicons-react';
import { FC, memo } from 'react';

import { MegaphoneIcon } from '~/components/casts/actions/icons/Megaphone';
import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';

const PinLabel: FC<{ isFocusedCast: boolean; showAsAnnouncement?: boolean }> =
  memo(({ isFocusedCast, showAsAnnouncement }) => {
    if (isFocusedCast) {
      return null;
    }

    if (showAsAnnouncement) {
      return (
        <div className="mb-1">
          <FeedItemTopHatContainer
            icon={
              <span className="text-link">
                <MegaphoneIcon size={14} />
              </span>
            }
          >
            <span className="font-semibold text-link">Announcement</span>
          </FeedItemTopHatContainer>
        </div>
      );
    }

    return (
      <FeedItemTopHatContainer icon={<PinIcon size={12} />}>
        Pinned
      </FeedItemTopHatContainer>
    );
  });

PinLabel.displayName = 'PinLabel';

export { PinLabel };
