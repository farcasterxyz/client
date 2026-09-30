import { useEffect } from 'react';

import { useOnCurrentNavLinkClicked } from '~/contexts/OnCurrentNavLinkClickedProvider';

const useSetOnCurrentNavLinkClicked = (onClick: () => Promise<unknown>) => {
  const { setOnCurrentNavLinkClicked } = useOnCurrentNavLinkClicked();

  useEffect(() => {
    setOnCurrentNavLinkClicked(() => onClick);
  }, [onClick, setOnCurrentNavLinkClicked]);
};

export { useSetOnCurrentNavLinkClicked };
