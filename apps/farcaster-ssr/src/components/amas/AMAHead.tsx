import { ApiAMA } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getAMAUrl } from '~/utils/amaUtils';

type AMAHeadProps = {
  ama: ApiAMA;
};

const AMAHead: FC<AMAHeadProps> = ({ ama }) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return `AMA with ${ama.guest.displayName} on Farcaster`;
  }, [ama.guest.displayName]);

  const description = useMemo(() => {
    return `Ask ${ama.guest.displayName} anything. Live Q&A session on Farcaster — read questions and answers from the community.`;
  }, [ama.guest.displayName]);

  const url = useMemo(() => {
    return getAMAUrl({ ama, host });
  }, [ama, host]);

  const imageUrl = useMemo(() => {
    return ama.thumbnailImageUrl;
  }, [ama.thumbnailImageUrl]);

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

AMAHead.displayName = 'AMAHead';

export { AMAHead };
