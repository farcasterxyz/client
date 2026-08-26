import { ApiUserPreferences } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useSetUserPreferences } from './mutations/useSetUserPreferences';
import { useUserPreferences } from './queries/userPreferences';

export const useUserPreference = <preference extends keyof ApiUserPreferences>({
  preference,
  defaultValue,
}: {
  preference: preference;
  defaultValue?: ApiUserPreferences[preference];
}) => {
  const setUserPreferences = useSetUserPreferences(true);
  const { data: userPreferences } = useUserPreferences();

  const updateUserPreference = useCallback(
    (value: ApiUserPreferences[preference]) => {
      setUserPreferences({
        preferences: {
          [preference]: value,
        },
      });
    },
    [preference, setUserPreferences],
  );

  return [
    userPreferences.result.preferences[preference] ?? defaultValue,
    updateUserPreference,
  ] as const;
};
