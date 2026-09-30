import { useLocation } from 'react-router-dom';

import {
  appDevelopersPathPrefix,
  appInboxPathPrefix,
  appSettingsPathPrefix,
} from '~/constants/routePrefixes';

const usePageLayoutSize = () => {
  const location = useLocation();
  if (location.pathname.startsWith(`${appSettingsPathPrefix}`)) {
    return 'full';
  }

  if (
    location.pathname.startsWith(`${appInboxPathPrefix}`) ||
    location.pathname.endsWith('/stats')
  ) {
    return 'lg';
  }

  if (location.pathname.startsWith(`${appDevelopersPathPrefix}`)) {
    return 'full';
  }

  return 'base';
  return 'base';
};

export { usePageLayoutSize };
