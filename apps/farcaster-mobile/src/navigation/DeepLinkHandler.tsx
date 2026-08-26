import { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import { useHandleDeepLink } from '~/hooks/navigation/useHandleDeepLink';
import { FullParamList } from '~/types';

type DeepLinkHandlerProps = {
  navigationRef: NavigationContainerRefWithCurrent<FullParamList>;
};

function DeepLinkHandler({ navigationRef }: DeepLinkHandlerProps) {
  useHandleDeepLink(navigationRef);
  return null;
}

export { DeepLinkHandler };
