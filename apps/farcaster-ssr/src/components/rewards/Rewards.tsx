import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';

const getUrl = ({ host }: { host: string | undefined }) => {
  const path = `${appPathPrefix}/mini-apps/rewards`;

  return `${host}${path}`;
};

const Head: FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return `Mini App Leaderboard`;
  }, []);

  const description = useMemo(() => {
    return `Top mini apps on Farcaster`;
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

const Rewards: FC = () => {
  return (
    <>
      <Head
        imageUrl={
          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b18e5e8a-e180-463f-8d34-25151d8ea100/original'
        }
      />
    </>
  );
};

Rewards.displayName = 'Rewards';

export { Rewards };
