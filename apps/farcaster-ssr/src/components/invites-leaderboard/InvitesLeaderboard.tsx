import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';

const getUrl = ({ host }: { host: string | undefined }) => {
  const path = `${appPathPrefix}/invites`;

  return `${host}${path}`;
};

const Head: FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return `Invite Leaderboard`;
  }, []);

  const description = useMemo(() => {
    return `Top inviters on Farcaster`;
  }, []);

  const url = useMemo(() => {
    return getUrl({ host });
  }, [host]);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      imageWidth={1200}
      imageHeight={630}
      title={title}
      type="website"
      twitterCard="summary_large_image"
      url={url}
    />
  );
};

const InvitesLeaderboard: FC = () => {
  return (
    <>
      <Head
        imageUrl={
          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/49435f18-8065-4314-e121-eeaf4916cc00/original'
        }
      />
    </>
  );
};

InvitesLeaderboard.displayName = 'InvitesLeaderboard';

export { InvitesLeaderboard };
