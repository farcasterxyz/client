import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getEnsVerificationError,
  isHandledFetchError,
} from 'farcaster-client-data';
import { useAddUserUsername, validateEnsName } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Button } from '~/components/Button';
import { EditableFormField } from '~/components/EditableFormField';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { usePush } from '~/hooks/navigation/usePush';
import { HomeStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type AddENSUsernameScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'AddENSUsername'
>;

const AddENSUsernameScreen = buildScreen<AddENSUsernameScreenProps>(
  { name: 'AddENSUsername' },
  () => {
    const t = useTheme();
    const pop = usePop();
    const toast = useToast();
    const { setOptions } = useNavigation();
    const push = usePush();

    const addUserUsername = useAddUserUsername();

    const [ensName, setENSName] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string>();
    const [showConnectAddressLink, setShowConnectAddressLink] =
      useState<boolean>(false);

    const onConnectAddressPress = useCallback(() => {
      push('ConnectAddress', {});
    }, [push]);

    const description = useMemo(() => {
      if (typeof validationError === 'undefined') {
        return '';
      }

      if (showConnectAddressLink) {
        return (
          <View style={[t.flex, t.flexCol, t.itemsStart]}>
            <Text style={[t.textBase, t.texts.danger]}>{validationError}</Text>
            <Button
              onPress={onConnectAddressPress}
              title={'Connect address'}
              variant="mutedSecondary"
              size="sm"
              style={[t.mT4, t.pX0]}
            />
          </View>
        );
      }

      return validationError;
    }, [
      onConnectAddressPress,
      showConnectAddressLink,
      t.flex,
      t.flexCol,
      t.itemsStart,
      t.mT4,
      t.pX0,
      t.textBase,
      t.texts.danger,
      validationError,
    ]);

    const canSubmit = useMemo(() => {
      return typeof ensName !== 'undefined';
    }, [ensName]);

    const submit = useCallback(async () => {
      setIsSubmitting(true);
      try {
        if (canSubmit && typeof ensName !== 'undefined') {
          const validationResult = validateEnsName(ensName);
          if (!validationResult.valid) {
            setValidationError(validationResult.error);
            setShowConnectAddressLink(false);
            return;
          }

          await addUserUsername({
            username: {
              name: ensName,
              type: 'ens_l1',
            },
          });
          toast.show('ENS added');
          pop();
        }
      } catch (error) {
        if (isHandledFetchError(error) && error.responseData.errors.length) {
          const message = error.responseData.errors[0].message;
          setValidationError(message);
          setShowConnectAddressLink(
            getEnsVerificationError(error)?.data.showConnectAddressLink ||
              false,
          );
        }

        trackError(error);
      } finally {
        setIsSubmitting(false);
      }
    }, [addUserUsername, canSubmit, ensName, pop, toast]);

    useEffect(() => {
      setOptions({
        headerRight: () => (
          <HeaderRightSubmit
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={submit}
            actionTextOverload={'Add'}
          />
        ),
      });
    }, [canSubmit, isSubmitting, setOptions, submit]);

    return (
      <View style={[t.hFull, t.p4]}>
        <EditableFormField
          autoCapitalize="none"
          autoCorrect={false}
          label="Add ENS"
          onChangeText={setENSName}
          placeholder="farcaster.eth"
          value={ensName}
          withLabel={false}
          autoFocus={true}
        />
        <Text style={[t.textBase, t.texts.danger, t.mT2]}>{description}</Text>
      </View>
    );
  },
);

AddENSUsernameScreen.displayName = 'AddENSUsernameScreen';

export { AddENSUsernameScreen };
