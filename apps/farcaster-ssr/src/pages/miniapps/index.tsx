import { ApiFrame } from 'farcaster-client-data';

import { OGHead } from '~/components/meta/OGHead';
import { MiniApp } from '~/components/miniapps/Miniapp';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { apiClient } from '~/utils/ApiClient';
import { getImageUrl } from '~/utils/imageUtils';
import { getAbsoluteUrl } from '~/utils/urlUtils';

export async function getServerSideProps() {
  const topFramesResponse = await apiClient.getTopFrames({ limit: 100 });

  const topFrames = topFramesResponse.data.result.frames;

  return { props: { topFrames } };
}

export default function MiniappsPage({ topFrames }: { topFrames: ApiFrame[] }) {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        title={'Top Farcaster Mini Apps'}
        description=""
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        type="website"
        url={getAbsoluteUrl({ host, path: '/miniapps' })}
      />
      <div>
        <h1>Top Farcaster Mini Apps</h1>
        <div>
          {topFrames.map((frame) => (
            <MiniApp
              key={frame.id}
              frame={frame}
              embed={null}
              ogMetadata={null}
              isInCollection={true}
              description={frame.description ?? null}
            />
          ))}
        </div>
      </div>
    </>
  );
}
