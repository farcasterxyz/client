import { ApiCast, ApiUser } from 'farcaster-client-data';
import { FC } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { useFastOgImageWithFallback } from '~/utils/imageUtils';
import { getProfileCastsUrl } from '~/utils/profileUtils';

type ProfileCastsHeadProps = {
  casts: ApiCast[];
  user: ApiUser;
};

const ProfileCastsHead: FC<ProfileCastsHeadProps> = ({ casts, user }) => {
  const { host } = useRequest();

  const firstCast = casts[0];

  const title = `${user.displayName}${
    user.username ? ` (@${user.username})` : ''
  } on Farcaster`;

  const bio = user.profile.bio.text || '';
  const description = bio
    ? `${bio} — Follow @${user.username} on Farcaster to see their casts and join the conversation.`
    : `Follow @${user.username} on Farcaster to see their casts and join the conversation.`;

  const { imageUrl, size } = useFastOgImageWithFallback(user.pfp?.url, 256);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      imageWidth={size}
      imageHeight={size}
      modifiedAt={firstCast?.timestamp}
      title={title}
      type="article"
      url={getProfileCastsUrl({ host, user })}
    />
  );
};

ProfileCastsHead.displayName = 'ProfileCastsHead';

export { ProfileCastsHead };
