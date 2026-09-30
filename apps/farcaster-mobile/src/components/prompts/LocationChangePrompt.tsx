import { useBottomSheet } from '@gorhom/bottom-sheet';
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import {
  lastKnownLocationInfoKey,
  updateLocationPromptInfoKey,
} from '~/constants/Storage';
import {
  LocationPair,
  useLocationPermission,
} from '~/contexts/LocationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { PromptInfo } from '~/types';
import { getItem, setItem } from '~/utils/StorageUtils';

import { Prompt } from './Prompt';

const LocationChangePrompt: FC = memo(() => {
  const { permission, locationInfo } = useLocationPermission();
  const [existingLocation, setExistingLocation] = useState<LocationPair>();

  useEffect(() => {
    (async () => {
      if (!existingLocation) {
        setExistingLocation(
          await getItem<LocationPair>({
            key: lastKnownLocationInfoKey,
            fallback: {
              latitude: 0,
              longitude: 0,
            },
          }),
        );
      }
    })();
  }, [existingLocation]);

  const shouldPresent = useCallback(
    ({ hasPresentedThisSession }: PromptInfo) => {
      return (
        !!existingLocation &&
        !!locationInfo &&
        (existingLocation.latitude !== locationInfo.latitude ||
          existingLocation.longitude !== locationInfo.longitude) &&
        !hasPresentedThisSession
      );
    },
    [existingLocation, locationInfo],
  );

  if (permission && locationInfo) {
    return (
      <Prompt
        shouldPresent={shouldPresent}
        height={286}
        storageKey={updateLocationPromptInfoKey}
      >
        <LocationChangePromptContent
          locationInfo={locationInfo}
          setExistingLocation={setExistingLocation}
        />
      </Prompt>
    );
  } else {
    return <></>;
  }
});

LocationChangePrompt.displayName = 'LocationChangePrompt';

const LocationChangePromptContent: FC<{
  locationInfo: LocationPair;
  setExistingLocation: (pair: LocationPair) => void;
}> = ({ locationInfo, setExistingLocation }) => {
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const navigate = useNavigate();

  const setLocationToCurrent = async () => {
    await setItem({
      key: lastKnownLocationInfoKey,
      value: {
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
      },
    });
    setExistingLocation({
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude,
    });
  };

  return (
    <View style={[t.hFull, t.justifyBetween, t.p4]}>
      <View style={[t.hFull, t.justifyBetween]}>
        <Text
          style={[
            t.textBase,
            t.texts.primary,
            t.textXl,
            t.fontSemibold,
            t.textCenter,
          ]}
        >
          In a new city?
        </Text>
        <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
          Change your location to find other Farcasters nearby
        </Text>
        <View>
          <Button
            title="Change location"
            style={[t.mB4]}
            variant="normal"
            fontWeight="bold"
            onPress={async () => {
              await setLocationToCurrent();
              navigate('EditLocation', {});
              forceClose();
            }}
          />
          <Button
            title="Not now"
            variant="muted"
            fontWeight="normal"
            onPress={async () => {
              await setLocationToCurrent();
              forceClose();
            }}
          />
        </View>
      </View>
    </View>
  );
};

export { LocationChangePrompt };
