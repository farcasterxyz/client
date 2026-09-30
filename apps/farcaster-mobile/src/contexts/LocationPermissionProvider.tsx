import * as Location from 'expo-location';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  lastKnownLocationInfoKey,
  updateLocationEnabledKey,
} from '~/constants/Storage';
import { SyncLocationPermissionsError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { getItem, setItem } from '~/utils/StorageUtils';

type LocationPermissionContext = {
  permission: Location.PermissionStatus | undefined;
  locationEnabled: boolean;
  setPermission: (permission: Location.PermissionStatus) => void;
  saveLocationEnabled: (enabled: boolean) => void;
  locationInfo: LocationPair | undefined;
};

const LocationPermissionContext = createContext<LocationPermissionContext>({
  permission: undefined as never,
  locationEnabled: false,
  setPermission: () => undefined,
  saveLocationEnabled: () => undefined,
  locationInfo: undefined as never,
});

type LocationPermissionProviderProps = {
  children: ReactNode;
};

const isDistanceOver100Mi = (
  lat1: number,
  long1: number,
  lat2: number,
  long2: number,
) => {
  return (
    Math.acos(
      Math.sin((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.cos(((long2 - long1) * Math.PI) / 180),
    ) *
      3963 >
    100
  );
};

type LocationPair = {
  latitude: number;
  longitude: number;
};

const LocationPermissionProvider: FC<LocationPermissionProviderProps> = memo(
  ({ children }) => {
    const [permission, setPermission] = useState<Location.PermissionStatus>();
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [locationInfo, setLocationInfo] = useState<LocationPair>();

    useEffect(() => {
      (async () => {
        try {
          setLocationEnabled(
            await getItem({
              key: updateLocationEnabledKey,
              fallback: false,
            }),
          );
          setLocationInfo(
            await getItem<LocationPair>({
              key: lastKnownLocationInfoKey,
              fallback: {
                latitude: 0,
                longitude: 0,
              },
            }),
          );
        } catch (error) {
          trackError(new SyncLocationPermissionsError({ error }));
        }
      })();
    }, []);

    const saveLocationEnabled = (value: boolean) => {
      (async () => {
        await setItem({
          key: updateLocationEnabledKey,
          value: value,
        });
        setLocationEnabled(value);
      })();
    };

    const locationInfoRef = React.useRef(locationInfo);
    locationInfoRef.current = locationInfo;

    useEffect(() => {
      if (!locationEnabled) {
        return;
      }
      let subscription: Location.LocationSubscription | undefined;
      (async () => {
        try {
          const { status: currentPermission } =
            await Location.requestForegroundPermissionsAsync();
          setPermission(currentPermission);
          if (currentPermission === Location.PermissionStatus.GRANTED) {
            subscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.Lowest,
                distanceInterval: 100,
              },
              (obj) => {
                const current = locationInfoRef.current;
                if (
                  current &&
                  isDistanceOver100Mi(
                    current.latitude,
                    current.longitude,
                    obj.coords.latitude,
                    obj.coords.longitude,
                  )
                ) {
                  setLocationInfo({
                    latitude: obj.coords.latitude,
                    longitude: obj.coords.longitude,
                  });
                }
              },
            );
          }
        } catch (error) {
          trackError(new SyncLocationPermissionsError({ error }));
        }
      })();
      return () => {
        subscription?.remove();
      };
    }, [locationEnabled, setLocationInfo]);

    return (
      <LocationPermissionContext.Provider
        value={{
          permission,
          locationEnabled,
          saveLocationEnabled,
          setPermission,
          locationInfo,
        }}
      >
        {children}
      </LocationPermissionContext.Provider>
    );
  },
);

LocationPermissionContext.displayName = 'LocationPermissionContext';

const useLocationPermission = () => useContext(LocationPermissionContext);

export { LocationPair, LocationPermissionProvider, useLocationPermission };
