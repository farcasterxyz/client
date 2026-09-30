import {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

const scrollPositionHistoryTTL = 1000 * 60 * 5;
const updateScrollPositionHistoryInterval = 1000;
const cleanupScrollPositionHistoryInterval = 1000 * 60 * 5;

const root = document.getElementById('root')!;

type ScrollContextValue = {
  getLastScrolledAt: () => number;
};

const ScrollContext = createContext<ScrollContextValue>({
  getLastScrolledAt: () => 0,
});

type ScrollProviderProps = {
  children: ReactNode;
};

const ScrollProvider: FC<ScrollProviderProps> = memo(({ children }) => {
  const lastScrolledAtRef = useRef(0);
  const scrollPositionHistory = useRef(
    new Map<string, { scrollTop: number; timestamp: number }>(),
  ).current;

  useEffect(() => {
    let cleanupScrollPositionHistoryTimeout: ReturnType<typeof setTimeout>;
    let updateScrollPositionHistoryTimeout: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      lastScrolledAtRef.current = Date.now();
    };

    function onPopState() {
      const entry = scrollPositionHistory.get(location.href);

      if (entry) {
        requestAnimationFrame(() => {
          root.scrollTo(0, entry.scrollTop);
        });
      }
    }

    function updateScrollPositionHistory() {
      scrollPositionHistory.set(location.href, {
        scrollTop: root.scrollTop,
        timestamp: Date.now(),
      });

      scheduleUpdateScrollPositionHistory();
    }

    function cleanupScrollPositionHistory() {
      const threshold = Date.now() - scrollPositionHistoryTTL;
      for (const [key, { timestamp }] of scrollPositionHistory) {
        if (timestamp < threshold) {
          scrollPositionHistory.delete(key);
        }
      }

      scheduleCleanupScrollPositionHistory();
    }

    function scheduleUpdateScrollPositionHistory() {
      scrollPositionHistory.set(location.href, {
        scrollTop: root.scrollTop,
        timestamp: Date.now(),
      });

      updateScrollPositionHistoryTimeout = setTimeout(
        updateScrollPositionHistory,
        updateScrollPositionHistoryInterval,
      );
    }

    function scheduleCleanupScrollPositionHistory() {
      cleanupScrollPositionHistoryTimeout = setTimeout(
        cleanupScrollPositionHistory,
        cleanupScrollPositionHistoryInterval,
      );
    }

    root.addEventListener('scroll', onScroll);
    window.addEventListener('popstate', onPopState);
    scheduleUpdateScrollPositionHistory();
    scheduleCleanupScrollPositionHistory();

    cleanupScrollPositionHistoryTimeout = setTimeout(
      cleanupScrollPositionHistory,
      cleanupScrollPositionHistoryInterval,
    );

    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPopState);
      clearTimeout(cleanupScrollPositionHistoryTimeout);
      clearTimeout(updateScrollPositionHistoryTimeout);
    };
  }, [scrollPositionHistory]);

  const getLastScrolledAt = useCallback(() => {
    return lastScrolledAtRef.current;
  }, []);

  return (
    <ScrollContext.Provider value={{ getLastScrolledAt }}>
      {children}
    </ScrollContext.Provider>
  );
});

ScrollProvider.displayName = 'ScrollProvider';

const useScroll = () => useContext(ScrollContext);

export { ScrollProvider, useScroll };
