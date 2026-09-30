import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useUpdateUser } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { EditableFormField } from '~/components/EditableFormField';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';
import { HomeStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { sleep } from '~/utils/PromiseUtils';

type EditBioScreenProps = NativeStackScreenProps<HomeStackParamList, 'EditBio'>;

const EditBioScreen = buildScreen<EditBioScreenProps>(
  { name: 'EditBio' },
  () => {
    const t = useTheme();

    const user = useCurrentUser_UNSAFE();

    const updateUser = useUpdateUser();

    const [bioText, setBioText] = useState(user.profile?.bio.text ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = bioText !== user.profile?.bio.text;

    const { setOptions } = useNavigation();
    const pop = usePop();

    const toast = useToast();

    const { trackEvent } = useAnalytics();

    const submit = useCallback(async () => {
      setIsSubmitting(true);
      try {
        await updateUser({ bio: bioText });
        await sleep(500); // Wait a second for invalidations
        toast.show('Bio updated successfully');

        if (user.profile?.bio.text) {
          trackEvent(AnalyticsEvent.UpdatedBio, {});
        } else {
          trackEvent(AnalyticsEvent.CreatedBio, {});
        }
        pop();
      } catch (err) {
        trackError(err);
        toast.show('Error updating bio', {
          type: 'danger',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [bioText, pop, toast, trackEvent, updateUser, user.profile?.bio.text]);

    useEffect(() => {
      setOptions({
        headerRight: () => (
          <HeaderRightSubmit
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={submit}
          />
        ),
      });
    }, [canSubmit, isSubmitting, setOptions, submit]);

    return (
      <View style={[t.hFull, t.p4]}>
        <EditableFormField
          label="Bio"
          keyboardType="default"
          maxLength={160}
          onChangeText={setBioText}
          placeholder="What I'm working on..."
          value={bioText}
          multiline={true}
          numberOfLines={4}
        />
        <Text style={[t.textBase, t.texts.secondary, t.mT2]}>
          Tell us a little more about yourself — up to 160 characters.
        </Text>
      </View>
    );
  },
);

EditBioScreen.displayName = 'EditBioScreen';

export { EditBioScreen };
