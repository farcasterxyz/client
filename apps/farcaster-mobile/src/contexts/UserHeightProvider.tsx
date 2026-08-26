import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';

type Heights = Record<string, number | undefined>;

type UserHeightKeyParam = {
  fid: number;
  hasAndShowsBio: boolean;
  hideFollowsYou: boolean;
  isFollowingViewer: boolean;
  withNoWrapperStyles: boolean;
  showSocialProof: boolean;
};

type UserHeightContextValue = {
  getUserHeight: (keyParam: UserHeightKeyParam) => number | undefined;
  setUserHeight: (keyParam: UserHeightKeyParam, height: number) => void;
};

const UserHeightContext = createContext<UserHeightContextValue>({
  getUserHeight: () => undefined,
  setUserHeight: () => undefined,
});

const buildKey = ({
  fid,
  hasAndShowsBio,
  hideFollowsYou,
  isFollowingViewer,
  withNoWrapperStyles,
  showSocialProof,
}: UserHeightKeyParam) =>
  [
    fid,
    hasAndShowsBio,
    hideFollowsYou,
    isFollowingViewer,
    withNoWrapperStyles,
    showSocialProof,
  ].join('|');

type UserHeightProviderProps = {
  children: ReactNode;
};

const UserHeightProvider: FC<UserHeightProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'UserHeightProvider',
  });

  const heights = useRef<Heights>({}).current;

  const getUserHeight = useCallback(
    (keyParam: UserHeightKeyParam) => {
      const key = buildKey(keyParam);
      return heights[key];
    },
    [heights],
  );

  const setUserHeight = useCallback(
    (keyParam: UserHeightKeyParam, height: number) => {
      const key = buildKey(keyParam);
      if (!heights[key] || (heights[key] as number) < height) {
        heights[key] = height;
      }
    },
    [heights],
  );

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'UserHeightProvider',
  });

  return (
    <UserHeightContext.Provider value={{ getUserHeight, setUserHeight }}>
      {children}
    </UserHeightContext.Provider>
  );
});

const useUserHeight = () => useContext(UserHeightContext);

export { UserHeightProvider, useUserHeight };
