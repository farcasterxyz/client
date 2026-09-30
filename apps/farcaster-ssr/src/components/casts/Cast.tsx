import { ApiCast } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { Avatar } from '~/components/avatars/Avatar';
import { LinkToProfile } from '~/components/links/LinkToProfile';

type CastProps = {
  cast: ApiCast;
};

const Cast: FC<CastProps> = ({ cast }) => {
  const castText = useMemo(() => {
    if (cast.text.length !== 0) {
      return cast.text;
    }
    // If cast doesn't have a length, it must have an embed.
    // We will default to rendering the first OG preview URL.
    if (cast.embeds && cast.embeds.urls.length !== 0) {
      return cast.embeds.urls[0].openGraph.url;
    }
    // Fallback to empty string.
    return '';
  }, [cast.embeds, cast.text]);

  return (
    <div>
      <div>
        <Avatar user={cast.author} />
      </div>
      <div>
        <div>
          <LinkToProfile user={cast.author}>
            {cast.author.displayName}
          </LinkToProfile>
        </div>
        <h1>@{cast.author.username}</h1>
        <div>{castText}</div>
      </div>
      <div>
        <div>
          {cast.replies.count} {cast.replies.count > 1 ? 'replies' : 'reply'}
        </div>
        <div>
          {cast.recasts.count} {cast.recasts.count > 1 ? 'recasts' : 'recast'}
        </div>
        <div>
          {cast.reactions.count}{' '}
          {cast.reactions.count > 1 ? 'reactions' : 'reaction'}
        </div>
        <hr />
      </div>
    </div>
  );
};

Cast.displayName = 'Cast';

export { Cast };
