import { ApiLocation, ApiProfileToken, ApiUser } from 'farcaster-client-data';
import React from 'react';

type Action =
  | { type: 'Reset'; nextState: State }
  | { type: 'SetDisplayName'; displayName: string }
  | { type: 'SetUsername'; username: string }
  | { type: 'SetBio'; bio: string }
  | { type: 'SetPfp'; pfp: string }
  | { type: 'SetUrl'; url: string }
  | { type: 'SetBannerImageUrl'; bannerImageUrl: string }
  | { type: 'SetProfileToken'; profileToken?: ApiProfileToken };

interface State {
  displayName?: string;
  username?: string;
  bio?: string;
  pfp?: string;
  url?: string;
  bannerImageUrl?: string;
  location?: ApiLocation;
  profileToken?: ApiProfileToken;
}

function reducer(state: State, action: Action): State {
  let updatedState = state;

  switch (action.type) {
    case 'Reset':
      return action.nextState;
    case 'SetDisplayName':
      updatedState = { ...state, displayName: action.displayName };
      break;
    case 'SetBio':
      updatedState = { ...state, bio: action.bio };
      break;
    case 'SetPfp':
      updatedState = { ...state, pfp: action.pfp };
      break;
    case 'SetUrl':
      updatedState = { ...state, url: action.url };
      break;
    case 'SetBannerImageUrl':
      updatedState = { ...state, bannerImageUrl: action.bannerImageUrl };
      break;
    case 'SetProfileToken':
      updatedState = { ...state, profileToken: action.profileToken };
      break;
  }

  return updatedState;
}

type EditProfileStateProviderContextValue = [State, (action: Action) => void];

const EditProfileStateProviderContext =
  React.createContext<EditProfileStateProviderContextValue>([] as never);

type EditProfileStateProviderProps = React.PropsWithChildren & {
  user: ApiUser;
};

export function EditProfileStateProvider({
  children,
  user,
}: EditProfileStateProviderProps) {
  const composeState = React.useCallback(
    () =>
      ({
        displayName: user?.displayName,
        username: user?.username,
        bio: user?.profile.bio.text,
        pfp: user?.pfp?.url,
        bannerImageUrl: user?.profile.bannerImageUrl,
        url: user?.profile.url,
        location: user?.profile.location,
        profileToken: user?.profile.profileToken,
      }) satisfies State,
    [user],
  );

  const initializer = React.useCallback(() => {
    if (typeof user !== 'undefined') {
      return composeState();
    }

    return {
      displayName: undefined,
      username: undefined,
      bio: undefined,
      pfp: undefined,
      bannerImageUrl: undefined,
      url: undefined,
      location: undefined,
      profileToken: undefined,
    } satisfies State;
  }, [composeState, user]);

  const [state, dispatch] = React.useReducer(reducer, null, initializer);

  React.useEffect(() => {
    dispatch({ type: 'Reset', nextState: composeState() });
  }, [composeState]);

  return React.useMemo(
    () => (
      <EditProfileStateProviderContext.Provider value={[state, dispatch]}>
        {children}
      </EditProfileStateProviderContext.Provider>
    ),
    [children, state],
  );
}

export const useEditProfileState = () => {
  return React.useContext(EditProfileStateProviderContext);
};
