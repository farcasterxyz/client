import React from 'react';

import { getItem, setItem } from '~/utils/storageUtils';

type DraftValue = string;

type Drafts = { [conversationId: string]: DraftValue };

type DirectCastsDraftsContextValue = {
  getExistingDraft: ({
    conversationId,
  }: {
    conversationId: string;
  }) => DraftValue | undefined;
  saveDraft: ({
    conversationId,
    text,
  }: {
    conversationId: string;
    text: string;
  }) => void;
  discardDraft: ({ conversationId }: { conversationId: string }) => void;
};

const DirectCastsDraftsContext =
  React.createContext<DirectCastsDraftsContextValue>({} as never);

type DirectCastsDraftsProviderProps = {
  children: React.ReactNode;
};

const DirectCastsDraftsProvider: React.FC<DirectCastsDraftsProviderProps> = ({
  children,
}) => {
  const [drafts, setDrafts] = React.useState<Drafts>({});

  const getExistingDraft = React.useCallback(
    ({ conversationId }: { conversationId: string }) => {
      return drafts[conversationId] || undefined;
    },
    [drafts],
  );

  const discardDraft = React.useCallback(
    ({ conversationId }: { conversationId: string }) => {
      setDrafts((prev) => {
        delete prev[conversationId];
        return { ...prev };
      });
    },
    [],
  );

  const saveDraft = React.useCallback(
    ({ conversationId, text }: { conversationId: string; text: string }) => {
      if (text !== '') {
        setDrafts((prev) => ({ ...prev, [conversationId]: text }));
      } else {
        discardDraft({ conversationId });
      }
    },
    [discardDraft],
  );

  const initialize = React.useCallback(async () => {
    const stored = await getItem({ key: 'dc-drafts', fallback: {} });
    setDrafts(stored);
  }, []);

  React.useEffect(() => {
    setItem({ key: 'dc-drafts', value: drafts });
  }, [drafts]);

  React.useLayoutEffect(() => {
    initialize();
  }, [initialize]);

  const value = React.useMemo(
    () => ({
      getExistingDraft,
      saveDraft,
      discardDraft,
    }),
    [discardDraft, getExistingDraft, saveDraft],
  );

  return (
    <DirectCastsDraftsContext.Provider value={value}>
      {children}
    </DirectCastsDraftsContext.Provider>
  );
};

const useDirectCastsDrafts = () => React.useContext(DirectCastsDraftsContext);

export { DirectCastsDraftsProvider, useDirectCastsDrafts };
