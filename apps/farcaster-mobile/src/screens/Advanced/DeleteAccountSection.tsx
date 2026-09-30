import { useRequestAccountDelete } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

const DeleteAccountSection: FC = () => {
  const t = useTheme();
  const requestAccountDelete = useRequestAccountDelete();
  const toast = useToast();
  const [isRequesting, setIsRequesting] = React.useState<boolean>(false);

  const onDeleteAccountPress = React.useCallback(async () => {
    setIsRequesting(true);
    try {
      await requestAccountDelete();
      toast.show('Account deletion request made', {
        placement: 'top',
      });
    } catch (error) {
      trackError(error);
      toast.show('Failed to request account deletion', {
        placement: 'top',
      });
    } finally {
      setIsRequesting(false);
    }
  }, [requestAccountDelete, toast]);

  return (
    <>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          Delete your Farcaster client account
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        After clicking, you'll need to confirm this action by clicking the link
        sent to your email.
      </Text>
      <Text style={[t.texts.primary, t.fontBold, t.textSm]}>
        Deletions are permanent—proceed with caution.
      </Text>
      <View style={[t.mT6, t.mB4]}>
        <AtomsButton
          onPress={onDeleteAccountPress}
          hierarchy="danger"
          size="l"
          // loading={isRequesting}
          disabled={isRequesting}
          // style={[t.mT6]}
        >
          Delete account
        </AtomsButton>
      </View>
    </>
  );
};

export { DeleteAccountSection };
