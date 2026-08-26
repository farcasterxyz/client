import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';

const title = 'Explore Farcaster';
const description = '';

export default function ExploreChannelsPage() {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description={description}
        imageUrl={
          'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/024ecba1-ec28-4d13-90bb-4f6510ee1700/original'
        }
        imageWidth={1200}
        imageHeight={630}
        title={title}
        type="website"
        twitterCard="summary_large_image"
        url={`${host}${appPathPrefix}/explore/apps`}
      />
      <div>{title}</div>
      <div>{description}</div>
    </>
  );
}
