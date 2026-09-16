import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

type SettingsPageParams = {
  tab: string;
};

type SettingsPageProps = {
  tab: string;
  description: string;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<SettingsPageParams>,
): Promise<GetServerSidePropsResult<SettingsPageProps>> {
  const tab = context.params?.tab || '';

  const description = (() => {
    switch (tab) {
      case 'muted-keywords':
      case 'muted-words':
        return 'Muted words';
      case 'muted-accounts':
        return 'Muted accounts';
      case 'connected-accounts':
        return 'Connected accounts';
      case 'starter-packs':
        return 'Starter Packs';
      case 'advanced':
        return 'Advanced Settings';
      case 'verifications':
        return 'Verifications';
      case 'import':
        return 'Find people you follow on X / Twitter';
      default:
        return 'Farcaster';
    }
  })();

  return {
    props: { tab, description },
  };
}

export default function SettingsTabPage({
  tab,
  description,
}: SettingsPageProps) {
  const { host } = useRequest();

  return (
    <OGHead
      title={'Farcaster'}
      description={description}
      imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
      type="website"
      url={`${host}${appPathPrefix}/settings/${tab}`}
    />
  );
}
