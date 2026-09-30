import { FC } from 'react';

import {
  defaultOGDescription,
  defaultOGImagePath,
  defaultOGKeywords,
  defaultOGTitle,
} from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';
import { getFallbackUrl } from '~/utils/urlUtils';

import { OGHead } from './OGHead';

const FallbackOGHead: FC = () => {
  const { host } = useRequest();

  return (
    <OGHead
      description={defaultOGDescription}
      imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
      title={defaultOGTitle}
      type="website"
      url={getFallbackUrl({ host })}
      keywords={defaultOGKeywords}
      imageHeight={630}
      imageWidth={1200}
    />
  );
};

FallbackOGHead.displayName = 'FallbackOGHead';

export { FallbackOGHead };
