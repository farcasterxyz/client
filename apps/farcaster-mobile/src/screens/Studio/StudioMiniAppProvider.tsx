import * as React from 'react';

import { MinimizedMiniAppContext } from '~/contexts/MinimizedMiniAppProvider';

/**
 * Provides a MinimizedMiniAppContext with no-op close/minimize/maximize
 * for rendering a MiniApp inline (not in a BottomSheet).
 */
function StudioMiniAppProvider({ children }: { children: React.ReactNode }) {
  const [miniAppLoadingMessage, setMiniAppLoadingMessage] = React.useState<
    string | null
  >(null);

  const context = React.useMemo(
    () => ({
      setOpenMiniApp: () => {},
      minimizedMiniApp: undefined,
      maximizeMiniApp: () => {},
      minimizeMiniApp: () => {},
      closeMiniApp: () => {},
      disableGesturesForCurrentMiniApp: () => {},
      currentlyMinimized: false,
      isMiniAppActive: false,
      isMiniAppFullyExpanded: false,
      miniAppLoadingMessage,
      setMiniAppLoadingMessage,
    }),
    [miniAppLoadingMessage],
  );

  return (
    <MinimizedMiniAppContext.Provider value={context}>
      {children}
    </MinimizedMiniAppContext.Provider>
  );
}

export { StudioMiniAppProvider };
