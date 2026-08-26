import React, { FC, memo, ReactNode, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import { analyticsClient } from '~/analyticsClient';

import { useDeviceId } from './DeviceProvider';
import { useVersion } from './VersionProvider';

type AppSessionProviderProps = {
  children: ReactNode;
};

const AppSessionProvider: FC<AppSessionProviderProps> = memo(({ children }) => {
  const [appSessionId] = useState(() => v4());
  const {
    device: { deviceId },
  } = useDeviceId();
  const {
    nativeApplicationVersion,
    nativeBuildVersion,
    releaseChannel,
    updateId,
  } = useVersion();

  useEffect(() => {
    analyticsClient.setEnvelopeContext({
      appSessionId,
      deviceId,
      appBuild: nativeBuildVersion,
      appVersion: nativeApplicationVersion,
      releaseChannel,
      updateId,
    });
  }, [
    appSessionId,
    deviceId,
    nativeApplicationVersion,
    nativeBuildVersion,
    releaseChannel,
    updateId,
  ]);

  return <>{children}</>;
});

AppSessionProvider.displayName = 'AppSessionProvider';

export { AppSessionProvider };
