import { ApiSelectedInterest } from 'farcaster-client-data';
import cloneDeep from 'lodash/cloneDeep';
import React, { createContext, FC, ReactNode, useContext } from 'react';

type ChannelSelectedInterestKey = `channelKey:${string}`;
type WrappedSelectedInterestKey = `groupType:${string}`;
type CollectionSelectedInterstKey = `collectionSlug:${string}`;

type SelectedOnboardingInterestKey =
  | ChannelSelectedInterestKey
  | WrappedSelectedInterestKey
  | CollectionSelectedInterstKey;

type SelectedInterests = {
  [key: SelectedOnboardingInterestKey]: ApiSelectedInterest;
};

type SelectedInterestsContextValue = {
  selectedInterests: SelectedInterests;
  addChannelSelectedInterest: ({ channelKey }: { channelKey: string }) => void;
  removeChannelSelectedInterest: ({
    channelKey,
  }: {
    channelKey: string;
  }) => void;
  addWrappedSelectedInterest: ({ groupType }: { groupType: string }) => void;
  removeWrappedSelectedInterest: ({ groupType }: { groupType: string }) => void;
};

const SelectedInterestsContext = createContext<SelectedInterestsContextValue>(
  {} as never,
);

type SelectedInterestsProviderProps = {
  children: ReactNode;
};

const SelectedInterestsProvider: FC<SelectedInterestsProviderProps> = ({
  children,
}) => {
  const [interests, setInterests] = React.useState<SelectedInterests>({});

  const composeSelectedInterestChannelKey = React.useCallback(
    ({ channelKey }: { channelKey: string }): ChannelSelectedInterestKey => {
      return `channelKey:${channelKey}`;
    },
    [],
  );

  const composeSelectedInterestWrappedKey = React.useCallback(
    ({ groupType }: { groupType: string }): WrappedSelectedInterestKey => {
      return `groupType:${groupType}`;
    },
    [],
  );

  const addChannelSelectedInterest = React.useCallback(
    ({ channelKey }: { channelKey: string }) => {
      const key = composeSelectedInterestChannelKey({ channelKey });

      const clonedInterests = cloneDeep(interests);

      clonedInterests[key] = {
        type: 'channel',
        content: { channelKey },
      };

      setInterests(clonedInterests);
    },
    [composeSelectedInterestChannelKey, interests],
  );

  const removeChannelSelectedInterest = React.useCallback(
    ({ channelKey }: { channelKey: string }) => {
      const key = composeSelectedInterestChannelKey({ channelKey });

      const clonedInterests = cloneDeep(interests);

      delete clonedInterests[key];

      setInterests(clonedInterests);
    },
    [composeSelectedInterestChannelKey, interests],
  );

  const addWrappedSelectedInterest = React.useCallback(
    ({ groupType }: { groupType: string }) => {
      const key = composeSelectedInterestWrappedKey({ groupType });

      const clonedInterests = cloneDeep(interests);

      clonedInterests[key] = {
        type: 'wrapped',
        content: { groupType },
      };

      setInterests(clonedInterests);
    },
    [composeSelectedInterestWrappedKey, interests],
  );

  const removeWrappedSelectedInterest = React.useCallback(
    ({ groupType }: { groupType: string }) => {
      const key = composeSelectedInterestWrappedKey({ groupType });

      const clonedInterests = cloneDeep(interests);

      delete clonedInterests[key];

      setInterests(clonedInterests);
    },
    [composeSelectedInterestWrappedKey, interests],
  );

  return (
    <SelectedInterestsContext.Provider
      value={{
        selectedInterests: interests,
        addChannelSelectedInterest,
        removeChannelSelectedInterest,
        addWrappedSelectedInterest,
        removeWrappedSelectedInterest,
      }}
    >
      {children}
    </SelectedInterestsContext.Provider>
  );
};

SelectedInterestsProvider.displayName = 'SelectedInterestsProvider';

const useSelectedInterests = () => useContext(SelectedInterestsContext);

export { SelectedInterestsProvider, useSelectedInterests };
