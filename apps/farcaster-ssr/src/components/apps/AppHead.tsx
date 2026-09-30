import { ApiDiscoveryApp } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getAppUrl } from '~/utils/appUtils';

type AppHeadProps = {
  app: ApiDiscoveryApp;
};

const AppHead: FC<AppHeadProps> = ({ app: discoveryApp }) => {
  const { host } = useRequest();

  const { app, slug } = discoveryApp;

  const title = useMemo(() => {
    return `${app.name} on Farcaster`;
  }, [app.name]);

  const description = useMemo(() => {
    return app.description
      ? `${app.description} — Discover and use ${app.name} on Farcaster.`
      : `Discover and use ${app.name} on Farcaster.`;
  }, [app.description, app.name]);

  const url = useMemo(() => {
    return getAppUrl({ appSlug: slug, host });
  }, [host, slug]);

  const imageUrl = useMemo(() => {
    return app.imageUrl;
  }, [app.imageUrl]);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      title={title}
      type="website"
      url={url}
    />
  );
};

AppHead.displayName = 'AppHead';

export { AppHead };
