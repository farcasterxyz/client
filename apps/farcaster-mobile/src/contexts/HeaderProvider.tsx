import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

import { HeaderOptions } from '~/types';

type HeaderContextValue = {
  getHeaderOptions: (key: string) => HeaderOptions;
  setHeaderOptions: (key: string, options: HeaderOptions) => void;
};

const HeaderContext = createContext<HeaderContextValue>({
  getHeaderOptions: () => ({}),
  setHeaderOptions: () => undefined,
});

type HeaderProviderProps = {
  children: ReactNode;
};

const HeaderProvider: FC<HeaderProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'HeaderProvider',
  });

  const [allHeaderOptions, setAllHeaderOptions] = useState<
    Record<string, HeaderOptions | undefined>
  >({});

  const getHeaderOptions = useCallback(
    (key: string) => {
      return allHeaderOptions[key] || {};
    },
    [allHeaderOptions],
  );

  const setHeaderOptions = useCallback(
    (key: string, options: HeaderOptions) => {
      setAllHeaderOptions((prevAllHeaderOptions) => ({
        ...prevAllHeaderOptions,
        [key]: options,
      }));
    },
    [],
  );

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'HeaderProvider',
  });

  const value = React.useMemo(
    () => ({ getHeaderOptions, setHeaderOptions }),
    [getHeaderOptions, setHeaderOptions],
  );

  return (
    <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
  );
});

HeaderProvider.displayName = 'HeaderProvider';

const useHeader = () => useContext(HeaderContext);

export { HeaderProvider, useHeader };
