import { ApiDiscoveryApp } from 'farcaster-client-data';
import { FC } from 'react';

import { AppHead } from './AppHead';

type AppProps = {
  app: ApiDiscoveryApp;
};

const App: FC<AppProps> = ({ app }: AppProps) => {
  return (
    <>
      <AppHead app={app} />
      <div>{app.app.name}</div>
      <div>{app.app.description}</div>
    </>
  );
};

App.displayName = 'App';

export { App };
