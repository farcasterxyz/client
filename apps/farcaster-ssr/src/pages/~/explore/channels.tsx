import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

const title = 'Explore channels';
const description = 'All Farcaster channels on Farcaster';

export default function ExploreChannelsPage() {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description={description}
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title={title}
        type="website"
        url={`${host}${appPathPrefix}/explore/channels`}
      />
      <div>{title}</div>
      <div>{description}</div>
    </>
  );
}
