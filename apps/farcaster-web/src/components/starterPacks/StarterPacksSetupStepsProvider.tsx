import {
  ApiStarterPack,
  ApiStarterPackAccountItem,
  ApiUser,
} from 'farcaster-client-data';
import React from 'react';

const steps = ['Details', 'Users'] as const;
type Step = (typeof steps)[number];

type Action =
  | { type: 'Next' }
  | { type: 'Back' }
  | { type: 'SetName'; name: string }
  | { type: 'SetDescription'; description: string }
  | { type: 'AddUser'; user: ApiUser }
  | { type: 'RemoveUser'; fid: number }
  | { type: 'AddLabel'; label: string }
  | { type: 'RemoveLabel'; label: string }
  | { type: 'SetProcessing'; processing: boolean }
  | { type: 'SetError'; error: string };

interface State {
  existingStarterPackId?: string;
  currentStep: Step;
  name?: string;
  description?: string;
  labels: string[];
  users: ApiUser[];
  processing: boolean;
  error?: string;
  transitionDirection: 'Backward' | 'Forward';
}

function reducer(state: State, action: Action): State {
  let updatedState = state;

  const currentIndex = steps.indexOf(state.currentStep);
  if (action.type === 'Next') {
    updatedState = {
      ...state,
      currentStep: steps[currentIndex + 1],
      transitionDirection: 'Forward',
    };
  } else if (action.type === 'Back') {
    updatedState = {
      ...state,
      currentStep: steps[currentIndex - 1],
      transitionDirection: 'Backward',
    };
  }

  switch (action.type) {
    case 'SetName':
      updatedState = { ...state, name: action.name };
      break;
    case 'SetDescription':
      updatedState = { ...state, description: action.description };
      break;
    case 'AddUser':
      updatedState = {
        ...state,
        users: [...state.users, action.user],
      };
      break;
    case 'RemoveUser':
      updatedState = {
        ...state,
        users: state.users.filter(({ fid }) => fid !== action.fid),
      };
      break;
    case 'AddLabel':
      updatedState = {
        ...state,
        // FIXME: Single label for now
        labels: [action.label],
      };
      break;
    case 'RemoveLabel':
      updatedState = {
        ...state,
        // FIXME: Single label for now
        labels: [],
      };
      break;
    case 'SetProcessing':
      updatedState = { ...state, processing: action.processing };
      break;
  }

  return updatedState;
}

type StarterPacksSetupStepsProviderContextValue = [
  State,
  (action: Action) => void,
];

const StarterPacksSetupStepsProviderContext =
  React.createContext<StarterPacksSetupStepsProviderContextValue>([] as never);

type StarterPacksSetupStepsProviderProps = React.PropsWithChildren & {
  existingStarterPack: ApiStarterPack | undefined;
};

export function StarterPacksSetupStepsProvider({
  children,
  existingStarterPack,
}: StarterPacksSetupStepsProviderProps) {
  const initializer = React.useCallback(() => {
    if (typeof existingStarterPack !== 'undefined') {
      return {
        existingStarterPackId: existingStarterPack.id,
        currentStep: 'Users',
        name: existingStarterPack.name,
        description: existingStarterPack.description,
        // We are not loading all users on request time, what does it mean here if we do?
        // What are the performance implications?
        labels: existingStarterPack.labels,
        users: existingStarterPack.items.map(
          (item) => (item as ApiStarterPackAccountItem).item,
        ),
        processing: false,
        transitionDirection: 'Forward',
      } satisfies State;
    }

    return {
      existingStarterPackId: undefined,
      currentStep: 'Details',
      labels: [],
      users: [],
      processing: false,
      transitionDirection: 'Forward',
    } satisfies State;
  }, [existingStarterPack]);

  const [state, dispatch] = React.useReducer(reducer, null, initializer);

  return React.useMemo(
    () => (
      <StarterPacksSetupStepsProviderContext.Provider value={[state, dispatch]}>
        {children}
      </StarterPacksSetupStepsProviderContext.Provider>
    ),
    [children, state],
  );
}

export const useStarterPacksSetupSteps = () => {
  return React.useContext(StarterPacksSetupStepsProviderContext);
};
