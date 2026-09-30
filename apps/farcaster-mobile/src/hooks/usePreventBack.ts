import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';

type UsePreventBack = {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  disabled?: boolean;
};

export const usePreventBack = ({
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  disabled = false,
}: UsePreventBack) => {
  const disablePreventBackRef = useRef(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (disabled) {
        return;
      }

      return navigation.addListener('beforeRemove', (e) => {
        if (!disablePreventBackRef.current) {
          // Prevent default behavior of leaving the screen
          e.preventDefault();

          // Prompt the user before leaving the screen
          Alert.alert(title, message, [
            {
              text: confirmText,
              style: 'destructive',
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () => navigation.dispatch(e.data.action),
            },
            {
              text: cancelText,
              isPreferred: true,
              onPress: () => {
                /** no-op **/
              },
            },
          ]);
        }
      });
    }, [navigation, disabled, cancelText, confirmText, title, message]),
  );

  const disablePreventBack = useCallback(() => {
    disablePreventBackRef.current = true;
  }, []);

  return {
    disablePreventBack,
  };
};
