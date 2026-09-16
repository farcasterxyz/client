import { ApiStarterPack } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getStarterPackUrl } from '~/utils/starterPackUtils';

type StarterPackHeadProps = {
  starterPackId: string;
  starterPack: ApiStarterPack;
};

const StarterPackHead: FC<StarterPackHeadProps> = ({
  starterPackId,
  starterPack,
}) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return `${starterPack.name} Starter Pack by @${starterPack.creator.username} on Farcaster`;
  }, [starterPack.name, starterPack.creator.username]);

  const description = useMemo(() => {
    const memberCount = starterPack.itemCount || 0;
    const baseText =
      memberCount > 0
        ? `Follow ${memberCount} accounts curated by @${starterPack.creator.username}.`
        : `Accounts curated by @${starterPack.creator.username}.`;
    return starterPack.description
      ? `${baseText} ${starterPack.description}`
      : `${baseText} Get started on Farcaster with this collection.`;
  }, [
    starterPack.creator.username,
    starterPack.description,
    starterPack.itemCount,
  ]);

  const url = useMemo(() => {
    return getStarterPackUrl({ starterPackId, starterPack, host });
  }, [host, starterPack, starterPackId]);

  const imageUrl = useMemo(() => {
    return starterPack.openGraphImageUrl;
  }, [starterPack.openGraphImageUrl]);

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

StarterPackHead.displayName = 'StarterPackHead';

export { StarterPackHead };
