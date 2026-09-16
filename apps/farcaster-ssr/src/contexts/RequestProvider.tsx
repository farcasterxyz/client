import { createContext, FC, ReactNode, useContext } from 'react';

import { ogHost } from '~/constants/og';

type RequestContextValue = {
  host: string;
};

const RequestContext = createContext<RequestContextValue>({
  host: ogHost,
});

type RequestProviderProps = { children: ReactNode; host: string | undefined };

const RequestProvider: FC<RequestProviderProps> = ({ children }) => {
  return (
    <RequestContext.Provider value={{ host: ogHost }}>
      {children}
    </RequestContext.Provider>
  );
};

RequestProvider.displayName = 'RequestProvider';

const useRequest = () => useContext(RequestContext);

export { RequestProvider, useRequest };
