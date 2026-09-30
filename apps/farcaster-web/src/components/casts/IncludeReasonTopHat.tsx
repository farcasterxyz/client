import { HistoryIcon } from '@primer/octicons-react';
import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { Sparkle } from 'lucide-react';
import React, { FC, memo } from 'react';

import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';

type IncludeReasonTopHatProps = {
  includeReasonType: Extract<
    ApiCastFeedIncludeReason['type'],
    'evergreen-following-author' | 'high-quality-unfollowed'
  >;
};

const IncludeReasonTopHat: FC<IncludeReasonTopHatProps> = memo(
  ({ includeReasonType }) => {
    const label =
      includeReasonType === 'high-quality-unfollowed'
        ? {
            icon: <Sparkle size={12} className="text-faint" />,
            text: 'relevant for you',
          }
        : {
            icon: <HistoryIcon size={12} />,
            text: 'in case you missed it',
          };

    return (
      <FeedItemTopHatContainer icon={label.icon}>
        {label.text}
      </FeedItemTopHatContainer>
    );
  },
);

IncludeReasonTopHat.displayName = 'IncludeReasonTopHat';

export { IncludeReasonTopHat };
