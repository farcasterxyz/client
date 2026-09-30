import { ApiCastBody } from 'farcaster-client-data';
import React, { createContext, FC, ReactNode, useContext } from 'react';

export type GlobalPromptData = {
  joinChannelViaInviteCode?: { channelKey: string; inviteCode: string };
  directCastInvite?: { conversationId: string };
  installCoinbaseWallet?: { castHash: string };
  userBoostInfo?: { showCastButton: boolean };
  remoteSiwfRequest?: { token: string };
  creatorReward?: {
    rewardCents: number;
    rewardDate: string;
    txHash: string;
    txChainId: number;
  };
  composerAction?: {
    url?: string;
    cast: ApiCastBody;
  };
};

type GlobalPromptsContext = {
  activePromptKey: string | undefined;
  // Bumped on every `showGlobalPrompt` call — even when the key is unchanged.
  // Lets a prompt re-present itself in response to a repeated request that
  // would otherwise be a no-op (setting state to the same value bails out).
  promptNonce: number;
  getActiveGlobalPromptKey: () => string | undefined;
  showGlobalPrompt: ({
    key,
    globalPromptData,
  }: {
    key: string;
    globalPromptData?: GlobalPromptData;
  }) => void;
  hideGlobalPrompt: () => void;
  hideGlobalPromptAndClearData: () => void;
  globalData: GlobalPromptData;
};

const GlobalPromptsContext = createContext<GlobalPromptsContext>({
  activePromptKey: undefined,
  promptNonce: 0,
  getActiveGlobalPromptKey: () => undefined,
  showGlobalPrompt: () => undefined,
  hideGlobalPrompt: () => undefined,
  hideGlobalPromptAndClearData: () => undefined,
  globalData: {},
});

type GlobalPromptsProviderProps = {
  children: ReactNode;
};

const GlobalPromptsProvider: FC<GlobalPromptsProviderProps> = ({
  children,
}) => {
  const [activePromptKey, setActivePromptKey] = React.useState<
    string | undefined
  >(undefined);
  const [promptNonce, setPromptNonce] = React.useState(0);
  const [globalData, setGlobalData] = React.useState<GlobalPromptData>({});

  const getActiveGlobalPromptKey = React.useCallback(() => {
    return activePromptKey;
  }, [activePromptKey]);

  const showGlobalPrompt = React.useCallback(
    ({
      key,
      globalPromptData,
    }: {
      key: string;
      globalPromptData?: GlobalPromptData;
    }) => {
      if (globalPromptData) {
        setGlobalData((current) => ({ ...current, ...globalPromptData }));
      }

      setActivePromptKey(key);
      // Always bump the nonce so a repeated request for the same key still
      // signals consumers to (re-)present, even though `activePromptKey` itself
      // didn't change.
      setPromptNonce((n) => n + 1);
    },
    [],
  );

  const hideGlobalPrompt = React.useCallback(() => {
    setActivePromptKey(undefined);
  }, []);

  const hideGlobalPromptAndClearData = React.useCallback(() => {
    setActivePromptKey(undefined);
    setGlobalData({});
  }, []);

  const value = React.useMemo(
    () => ({
      activePromptKey,
      promptNonce,
      getActiveGlobalPromptKey,
      showGlobalPrompt,
      hideGlobalPrompt,
      hideGlobalPromptAndClearData,
      globalData,
    }),
    [
      activePromptKey,
      promptNonce,
      getActiveGlobalPromptKey,
      showGlobalPrompt,
      hideGlobalPrompt,
      hideGlobalPromptAndClearData,
      globalData,
    ],
  );

  return (
    <GlobalPromptsContext.Provider value={value}>
      {children}
    </GlobalPromptsContext.Provider>
  );
};

const useGlobalPrompts = () => useContext(GlobalPromptsContext);

export { GlobalPromptsProvider, useGlobalPrompts };
