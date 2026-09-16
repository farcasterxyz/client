import {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type LinkDetailsPopoverManagerContextValue = {
  activePopoverId: string | undefined;
  setActivePopoverId: (popoverId: string | undefined) => void;
  canShowPopover: ({ popoverId }: { popoverId: string }) => boolean;
};

const LinkDetailsPopoverManagerContext =
  createContext<LinkDetailsPopoverManagerContextValue>({
    activePopoverId: undefined,
    setActivePopoverId: () => {},
    canShowPopover: () => false,
  });

type LinkDetailsPopoverManagerProviderProps = {
  children: ReactNode;
};

const LinkDetailsPopoverManagerProvider: FC<LinkDetailsPopoverManagerProviderProps> =
  memo(({ children }) => {
    const [activePopoverId, setActivePopoverId] = useState<string>();

    const canShowPopover = useCallback(
      ({ popoverId }: { popoverId: string }) => {
        return activePopoverId === undefined && popoverId !== activePopoverId;
      },
      [activePopoverId],
    );

    useEffect(() => {
      return () => {
        setActivePopoverId(undefined);
      };
    }, []);

    return (
      <LinkDetailsPopoverManagerContext.Provider
        value={{
          activePopoverId,
          setActivePopoverId,
          canShowPopover,
        }}
      >
        {children}
      </LinkDetailsPopoverManagerContext.Provider>
    );
  });

LinkDetailsPopoverManagerProvider.displayName =
  'LinkDetailsPopoverManagerProvider';

const usePopover = () => useContext(LinkDetailsPopoverManagerContext);

export { LinkDetailsPopoverManagerProvider, usePopover };
