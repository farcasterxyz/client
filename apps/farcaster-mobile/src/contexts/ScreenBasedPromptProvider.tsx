import React, {
  createContext,
  FC,
  MutableRefObject,
  ReactNode,
  useContext,
  useRef,
} from 'react';

type PromptContext = {
  isPromptActiveRef: MutableRefObject<boolean>;
};

const PromptContext = createContext({
  isPromptActiveRef: { current: false },
});

type ScreenBasedPromptProviderProps = {
  children: ReactNode;
};

const ScreenBasedPromptProvider: FC<ScreenBasedPromptProviderProps> = ({
  children,
}) => {
  const isPromptActiveRef = useRef(false);

  return (
    <PromptContext.Provider value={{ isPromptActiveRef }}>
      {children}
    </PromptContext.Provider>
  );
};

const useScreenBasedPrompt = () => useContext(PromptContext);

export { ScreenBasedPromptProvider, useScreenBasedPrompt };
