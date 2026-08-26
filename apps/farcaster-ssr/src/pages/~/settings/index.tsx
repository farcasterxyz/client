import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

export default function SettingsPage() {
  const { host } = useRequest();

  return (
    <OGHead
      title={'Farcaster'}
      description={'Manage your account preferences'}
      imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
      type="website"
      url={`${host}${appPathPrefix}/settings`}
    />
  );
}
