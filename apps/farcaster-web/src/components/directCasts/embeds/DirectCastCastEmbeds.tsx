import classNames from 'classnames';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';
import React from 'react';

import { QuoteCast } from '~/components/attachments/QuoteCast';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type DirectCastCastEmbedsProps = {
  conversation: ApiDirectCastConversationInfoV3;
  directCast: ApiDirectCastMessageV3;
  castEmbeds: ApiQuoteCastEmbed[];
  wrapperHasContentAboveEmbed: boolean;
};

const DirectCastCastEmbeds: React.FC<DirectCastCastEmbedsProps> = React.memo(
  ({ castEmbeds, directCast, wrapperHasContentAboveEmbed }) => {
    const { fid: currentUserFid } = useCurrentUser();
    const selfDirectCast = directCast.senderFid === currentUserFid;

    return (
      <>
        {castEmbeds.map((cast) => (
          <div
            key={cast.hash}
            className={classNames(
              'relative flex w-full grow flex-col  justify-stretch place-self-start border border-default',
              selfDirectCast
                ? 'bg-self-direct-cast-embed'
                : 'bg-direct-cast-embed',
              wrapperHasContentAboveEmbed
                ? 'rounded-t-0 rounded-b-[10px]'
                : 'rounded-lg rounded-b-[10px]',
            )}
          >
            <QuoteCast
              cast={cast}
              skipBorderStyles={true}
              variant="direct-cast"
            />
          </div>
        ))}
      </>
    );
  },
);

export { DirectCastCastEmbeds };
