import { FC } from 'react';

import { routes } from '~/constants/routes';
import { useIsCurrentRoute } from '~/hooks/navigation/useIsCurrentRoute';
import { Container } from '~/layouts/Container';
import { MainContent } from '~/layouts/MainContent';
import { UnauthedLeftSideBar } from '~/layouts/UnauthedLeftSideBar';
import { UnauthedRightSideBar } from '~/layouts/UnauthedRightSideBar';

const UnauthedLayout: FC = () => {
  const hideChromesOnDownload = useIsCurrentRoute(routes.download);
  const hideChromesOnSignup = useIsCurrentRoute(routes.signup);
  const hideChromesOnRoute = hideChromesOnDownload || hideChromesOnSignup;

  return (
    <Container>
      {!hideChromesOnRoute && <UnauthedLeftSideBar />}
      <MainContent />
      {!hideChromesOnRoute && <UnauthedRightSideBar />}
    </Container>
  );
};

export { UnauthedLayout };
