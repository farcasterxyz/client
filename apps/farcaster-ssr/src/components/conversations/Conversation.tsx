import { ApiCast } from 'farcaster-client-data';
import { FC } from 'react';

import { Cast } from '~/components/casts/Cast';
import { getConversationUrl } from '~/utils/conversationUtils';

import { OGHead } from '../meta/OGHead';
import { ConversationHead } from './ConversationHead';

type ConversationProps = {
  casts: ApiCast[];
  focusedCast: ApiCast;
};

const Conversation: FC<ConversationProps> = ({
  casts,
  focusedCast,
}: ConversationProps) => {
  const conversationUrl = getConversationUrl({
    cast: focusedCast,
    host: 'https://farcaster.xyz',
  });
  return (
    <>
      <OGHead
        title={`${focusedCast.author.displayName} (@${focusedCast.author.username}) cast on Farcaster`}
        description={focusedCast.embeds?.processedCastText?.slice(0, 150) || ''}
        type="article"
        author={focusedCast.author.displayName}
        imageUrl={focusedCast.embeds?.images[0]?.sourceUrl}
        imageWidth={focusedCast.embeds?.images[0]?.media?.width}
        imageHeight={focusedCast.embeds?.images[0]?.media?.height}
        publishedAt={focusedCast.timestamp}
        url={conversationUrl}
      />
      <ConversationHead casts={casts} focusedCast={focusedCast} />
      <div>
        {casts.map((cast) => (
          <Cast key={cast.hash} cast={cast} />
        ))}
      </div>
    </>
  );
};

Conversation.displayName = 'Conversation';

export { Conversation };
