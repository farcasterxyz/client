import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { analyticsClient } from '~/analyticsClient';
import { browserPreferenceStorageKey } from '~/constants/Storage';

export enum BrowserPreference {
  IN_APP = 'in_app',
  SYSTEM = 'system',
}

type BrowserPreferenceContextType = {
  browserPreference: BrowserPreference;
  setBrowserPreference: (preference: BrowserPreference) => void;
};

export const BrowserPreferenceContext =
  createContext<BrowserPreferenceContextType>({
    browserPreference: BrowserPreference.IN_APP,
    setBrowserPreference: () => {},
  });

export const BrowserPreferenceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // useMMKVString reads synchronously from MMKV, so there is no async loading flash.
  const [rawPreference, setRawPreference] = useMMKVString(
    browserPreferenceStorageKey,
  );

  // Validate the stored value; fall back to IN_APP if missing or unrecognized.
  const browserPreference: BrowserPreference = useMemo(() => {
    if (
      rawPreference === BrowserPreference.IN_APP ||
      rawPreference === BrowserPreference.SYSTEM
    ) {
      return rawPreference;
    }
    return BrowserPreference.IN_APP;
  }, [rawPreference]);

  const setBrowserPreference = useCallback(
    (newPreference: BrowserPreference) => {
      setRawPreference(newPreference);
      analyticsClient.setPersonProperties({
        browserPreference: newPreference,
      });
    },
    [setRawPreference],
  );

  const contextValue = useMemo(
    () => ({ browserPreference, setBrowserPreference }),
    [browserPreference, setBrowserPreference],
  );

  return (
    <BrowserPreferenceContext.Provider value={contextValue}>
      {children}
    </BrowserPreferenceContext.Provider>
  );
};

export const useBrowserPreference = () => useContext(BrowserPreferenceContext);
