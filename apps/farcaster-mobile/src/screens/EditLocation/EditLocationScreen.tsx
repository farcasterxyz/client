import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  FormLocation,
  useChangeLocationQuery,
  useSelectLocationPrediction,
  useSyncLocationQueryToUser,
  useUpdateUserLocation,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Divider } from '~/components/Divider';
import { EditableFormField } from '~/components/EditableFormField';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { FreeTextFindLocation } from '~/components/location/FreeTextFindLocation';
import { buildScreen } from '~/components/Screen';
import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useLocationPermission } from '~/contexts/LocationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';
import { HomeStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type EditLocationScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'EditLocation'
>;

const EditLocationScreen = buildScreen<EditLocationScreenProps>(
  { name: 'EditLocation' },
  () => {
    const t = useTheme();

    const currentUser = useGloballyCachedCurrentUser();

    const updateUserLocation = useUpdateUserLocation();

    const [value, setValue] = useState<FormLocation>({
      query: '',
      pristine: true,
      staged: undefined,
    });
    const onChangeText = useChangeLocationQuery(currentUser, setValue);
    const selectPrediction = useSelectLocationPrediction(currentUser, setValue);
    useSyncLocationQueryToUser(currentUser, setValue);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const canSubmit = !!value.staged;

    const { setOptions } = useNavigation();
    const pop = usePop();

    const toast = useToast();

    const { trackEvent } = useAnalytics();

    const { permission, locationEnabled, saveLocationEnabled } =
      useLocationPermission();

    const setLocation = useCallback(async () => {
      if (!value.staged) {
        throw new Error('Expected location to have been staged.');
      }

      setIsSubmitting(true);
      try {
        await updateUserLocation(value.staged);

        toast.show('Successfully updated');

        trackEvent(AnalyticsEvent.SetLocation, {
          locationDescription: value.staged.description,
        });

        pop();
      } catch (err) {
        trackError(err);
        toast.show('There was a problem updating your location.', {
          type: 'danger',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [pop, toast, trackEvent, updateUserLocation, value.staged]);

    useEffect(() => {
      setOptions({
        headerRight: () => (
          <HeaderRightSubmit
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={setLocation}
            actionTextOverload="Save"
          />
        ),
      });
    }, [canSubmit, isSubmitting, setOptions, setLocation]);
    return (
      <View style={[t.hFull, t.p4]}>
        <EditableFormField
          label="Location"
          keyboardType="default"
          maxLength={64}
          onChangeText={onChangeText}
          placeholder="Enter your metro area"
          value={value.query}
          autoCapitalize={'none'}
          autoCorrect={false}
          autoComplete={'postal-address-locality'}
          editable={!isSubmitting}
        />
        <Text style={[t.textBase, t.texts.secondary, t.mT2]}>
          Once set, your location will be public on your profile.
        </Text>
        <FreeTextFindLocation
          q={value.query}
          isVisible={!!value.query && !value.pristine && !value.staged}
          onPressPrediction={selectPrediction}
        />
        <Divider />
        <Text style={[t.texts.secondary, t.textLg]}>
          Enable location prompts
        </Text>
        <Text style={[t.textBase, t.texts.secondary, t.mT2]}>
          By granting Farcaster access to your location in-app, we will prompt
          you to update your location whenever you've moved 100+ miles from your
          last known location.
        </Text>
        <Text style={[t.textBase, t.texts.secondary, t.mT2]}>
          We don't track location history and sharing location updates are
          always opt-in.
        </Text>
        <Switch
          style={[t.mT2]}
          value={
            locationEnabled && permission === Location.PermissionStatus.GRANTED
          }
          onValueChange={(value) => {
            if (permission === Location.PermissionStatus.DENIED) {
              Alert.alert(
                'Location permission required',
                'In order to enable this feature, you need to enable Location access in your settings.',
              );
              saveLocationEnabled(!value);
            } else {
              if (value) {
                trackEvent(
                  AnalyticsEvent.EnabledLocationPromptOnSettings,
                  undefined,
                );
              } else {
                trackEvent(
                  AnalyticsEvent.DisabledLocationPromptOnSettings,
                  undefined,
                );
              }
              saveLocationEnabled(value);
            }
          }}
        />
      </View>
    );
  },
);

EditLocationScreen.displayName = 'EditLocationScreen';

export { EditLocationScreen };
