import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

const title = 'Farcaster Recovery';
const description = 'Recover your account.';

export default function RecoveryInitiatePage() {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description={description}
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title={title}
        type="website"
        url={`${host}${appPathPrefix}/recovery-init`}
      />
    </>
  );
}
