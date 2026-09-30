import { ApiCast, ApiUser } from 'farcaster-client-data';
import { FC } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { useFastOgImageWithFallback } from '~/utils/imageUtils';
import { getProfileCastsAndRepliesUrl } from '~/utils/profileUtils';

type ProfileCastsAndRepliesHeadProps = {
  casts: ApiCast[];
  user: ApiUser;
};

const ProfileCastsAndRepliesHead: FC<ProfileCastsAndRepliesHeadProps> = ({
  casts,
  user,
}) => {
  const { host } = useRequest();

  const firstCast = casts[0];

  const displayName = user.displayName || user.username || `!${user.fid}`;
  const usernameDisplay = user.username ? ` (@${user.username})` : '';
  const title = `${displayName}${usernameDisplay} casts and replies on Farcaster`;

  const bio = user.profile.bio.text || '';
  const description = bio
    ? `All posts and replies by @${user.username} on Farcaster. ${bio}`
    : `All posts and replies by @${user.username} on Farcaster.`;

  const { imageUrl, size } = useFastOgImageWithFallback(user.pfp?.url, 256);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      imageHeight={size}
      imageWidth={size}
      modifiedAt={firstCast?.timestamp}
      title={title}
      type="article"
      url={getProfileCastsAndRepliesUrl({ host, user })}
    />
  );
};

ProfileCastsAndRepliesHead.displayName = 'ProfileCastsAndRepliesHead';

export { ProfileCastsAndRepliesHead };
