import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

type CallbackType = () => void;

type PubSubContextType = {
  sub: (queue: string, callback: CallbackType) => () => void;
  pub: (queue: string) => void;
};

const PubSubContext = createContext<PubSubContextType>({
  sub: () => () => {},
  pub: () => {},
});

type PubSubProviderProps = {
  children: ReactNode;
};

const PubSubProvider: FC<PubSubProviderProps> = memo(({ children }) => {
  const subs = useRef<Record<string, Record<string, CallbackType>>>({});

  const unsub = useCallback((queue: string, id: string) => {
    const queueSubs = subs.current[queue];
    if (!queueSubs) {
      return;
    }

    const sub = queueSubs[id];
    if (!sub) {
      return;
    }

    if (Object.keys(queueSubs).length === 1) {
      // This is the last sub -> delete queue
      delete subs.current[queue];
    } else {
      delete queueSubs[id];
    }
  }, []);

  const sub = useCallback(
    (queue: string, callback: CallbackType) => {
      let queueSubs = subs.current[queue];
      if (!queueSubs) {
        queueSubs = {};
        subs.current[queue] = queueSubs;
      }

      // Using a random string so that we can easily add/remove subs
      const subId = (Math.random() + 1).toString(36).substring(2);

      queueSubs[subId] = callback;

      // Return unsub function which caller can directly return from useEffect
      return () => {
        unsub(queue, subId);
      };
    },
    [unsub],
  );

  const pub = useCallback((queue: string) => {
    const queueSubs = subs.current[queue];
    if (!queueSubs) {
      return;
    }

    for (const sub of Object.values(queueSubs)) {
      sub();
    }
  }, []);

  const value = useMemo(() => ({ sub, pub }), [pub, sub]);

  return (
    <PubSubContext.Provider value={value}>{children}</PubSubContext.Provider>
  );
});

const usePubSub = () => useContext(PubSubContext);

export { PubSubProvider, usePubSub };
