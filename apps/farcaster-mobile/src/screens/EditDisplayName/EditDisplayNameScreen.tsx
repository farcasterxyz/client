import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useUpdateUser } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { EditableFormField } from '~/components/EditableFormField';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';
import { HomeStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { sleep } from '~/utils/PromiseUtils';

type EditDisplayNameScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'EditDisplayName'
>;

const EditDisplayNameScreen = buildScreen<EditDisplayNameScreenProps>(
  { name: 'EditDisplayName' },
  () => {
    const t = useTheme();

    const currentUser = useCurrentUser_UNSAFE();
    const updateUser = useUpdateUser();

    const [displayName, setDisplayName] = useState(
      currentUser.displayName || '',
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
      return (
        displayName &&
        displayName !== currentUser.displayName &&
        Buffer.byteLength(displayName, 'utf8') <= 32
      );
    }, [currentUser.displayName, displayName]);

    const { setOptions } = useNavigation();
    const pop = usePop();

    const toast = useToast();

    const submit = useCallback(async () => {
      setIsSubmitting(true);
      try {
        await updateUser({ displayName });

        await sleep(500); // Wait a second for invalidations
        toast.show('Display name updated successfully');
        pop();
      } catch (err) {
        trackError(err);
        toast.show('Error updating display name', {
          type: 'danger',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [updateUser, displayName, toast, pop]);

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
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect
          label="Display name"
          maxLength={32}
          onChangeText={setDisplayName}
          placeholder="My name is..."
          value={displayName}
        />
        <Text style={[t.textBase, t.texts.secondary, t.mT2]}>
          Your full name — up to 32 characters.
        </Text>
      </View>
    );
  },
);

EditDisplayNameScreen.displayName = 'EditDisplayNameScreen';

export { EditDisplayNameScreen };
