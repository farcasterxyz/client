import { ApiLocation, ApiUser } from 'farcaster-client-data';
import { useCallback, useEffect } from 'react';

export type FormLocation = {
  query: string;
  pristine: boolean;
  staged: ApiLocation | undefined;
};

const useChangeLocationQuery = (
  user: ApiUser,
  setLocation: (location: FormLocation) => void,
) =>
  useCallback(
    (text: string): void => {
      if (text) {
        setLocation({
          query: text,
          pristine: false,
          staged: undefined,
        });
      } else {
        if (user.profile.location?.description) {
          setLocation({
            query: '',
            pristine: false,
            staged: {
              placeId: '',
              description: '',
            },
          });
        } else {
          setLocation({
            query: '',
            pristine: false,
            staged: undefined,
          });
        }
      }
    },
    [user.profile.location?.description, setLocation],
  );

const useSelectLocationPrediction = (
  user: ApiUser,
  setLocation: (location: FormLocation) => void,
) =>
  useCallback(
    (prediction: ApiLocation): void => {
      if (prediction.placeId === user.profile.location?.placeId) {
        setLocation({
          query: user.profile.location.description,
          pristine: true,
          staged: undefined,
        });
      } else {
        setLocation({
          query: prediction.description,
          pristine: false,
          staged: {
            placeId: prediction.placeId,
            description: prediction.description,
          },
        });
      }
    },
    [user.profile.location, setLocation],
  );

const useSyncLocationQueryToUser = (
  user: ApiUser,
  setLocation: (location: FormLocation) => void,
) =>
  useEffect(() => {
    const existing = user.profile.location?.description;
    setLocation({
      query: existing || '',
      pristine: true,
      staged: undefined,
    });
  }, [user.profile.location?.description, setLocation]);

export {
  useChangeLocationQuery,
  useSelectLocationPrediction,
  useSyncLocationQueryToUser,
};
