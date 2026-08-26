// eslint-disable-next-line no-restricted-imports
import LinkifyIt from 'linkify-it';
import { createContext, FC, memo, ReactNode, useContext } from 'react';

import { getDefaultLinkifyInstance } from '~/utils/linkify/linkifyUtils';

type LinkifyContextValue = {
  defaultLinkifyInstance: LinkifyIt;
};

const LinkifyContext = createContext<LinkifyContextValue>({
  defaultLinkifyInstance: undefined as never,
});

type LinkifyProviderProps = {
  children: ReactNode;
};

const defaultLinkifyInstance = getDefaultLinkifyInstance();

const LinkifyProvider: FC<LinkifyProviderProps> = memo(({ children }) => {
  return (
    <LinkifyContext.Provider value={{ defaultLinkifyInstance }}>
      {children}
    </LinkifyContext.Provider>
  );
});

LinkifyProvider.displayName = 'LinkifyProvider';

const useLinkify = () => useContext(LinkifyContext);

export { LinkifyProvider, useLinkify };
