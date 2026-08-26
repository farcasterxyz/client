import React from 'react';

type DirectCastsAnimationsHistoryContextValue = {
  animatedMessages: Set<string>;
  updateAnimatedMessages: ({ messageId }: { messageId: string }) => void;
  highlightedMessage: string | undefined;
  highlightedMessageViewKey: string | undefined;
  updateHighlightedMessage: ({ messageId }: { messageId: string }) => void;
  cleanUpHighlightedMessage: () => void;
};

const DirectCastsAnimationsHistoryContext =
  React.createContext<DirectCastsAnimationsHistoryContextValue>({} as never);

type DirectCastsAnimationsHistoryProviderProps = {
  children: React.ReactNode;
};

const DirectCastsAnimationsHistoryProvider: React.FC<
  DirectCastsAnimationsHistoryProviderProps
> = ({ children }) => {
  const [animatedMessages, setAnimatedMessages] = React.useState<Set<string>>(
    new Set(),
  );

  const [highlightedMessage, setHighlightedMessage] = React.useState<
    string | undefined
  >(undefined);
  const [highlightedMessageViewKey, setHighlightedMessageViewKey] =
    React.useState<string | undefined>(undefined);

  const updateAnimatedMessages = React.useCallback(
    ({ messageId }: { messageId: string }) => {
      setTimeout(
        () => setAnimatedMessages((value) => new Set(value.add(messageId))),
        300,
      );
    },
    [],
  );

  const updateHighlightedMessage = React.useCallback(
    ({ messageId }: { messageId: string }) => {
      setHighlightedMessage(messageId);
      // Alternative here is to have an object for each message id and the count
      // however this is a faster lookup for all context users and easier to manage
      // as a simple string value once we have a proper key generator working.
      setHighlightedMessageViewKey((previousMessageViewKey) => {
        if (typeof previousMessageViewKey === 'undefined') {
          return `${messageId}:1`;
        }
        if (previousMessageViewKey.indexOf(messageId) === -1) {
          return `${messageId}:1`;
        }
        return `${messageId}:${Number(previousMessageViewKey.split(':')[1]) + 1}`;
      });
    },
    [],
  );

  const cleanUpHighlightedMessage = React.useCallback(() => {
    setHighlightedMessage(undefined);
  }, []);

  const value = React.useMemo(
    () => ({
      animatedMessages,
      updateAnimatedMessages,
      highlightedMessage,
      highlightedMessageViewKey,
      updateHighlightedMessage,
      cleanUpHighlightedMessage,
    }),
    [
      animatedMessages,
      highlightedMessage,
      highlightedMessageViewKey,
      updateAnimatedMessages,
      updateHighlightedMessage,
      cleanUpHighlightedMessage,
    ],
  );

  return (
    <DirectCastsAnimationsHistoryContext.Provider value={value}>
      {children}
    </DirectCastsAnimationsHistoryContext.Provider>
  );
};

const useDirectCastsAnimationsHistory = () =>
  React.useContext(DirectCastsAnimationsHistoryContext);

export {
  DirectCastsAnimationsHistoryProvider,
  useDirectCastsAnimationsHistory,
};
