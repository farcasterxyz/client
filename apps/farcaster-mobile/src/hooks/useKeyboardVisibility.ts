import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

function useKeyboardVisibility() {
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const showEvent =
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const hideEvent =
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(showEvent, (e) => {
      setIsVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      setIsVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [hideEvent, showEvent]);

  return { keyboardHeight, isVisible };
}

function useKeyboardWillShow() {
  const [keyboardWillShow, setKeyboardWillShow] = useState(false);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.select({
        android: 'keyboardDidShow',
        default: 'keyboardWillShow',
      }),
      () => {
        setKeyboardWillShow(true);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.select({
        android: 'keyboardDidHide',
        default: 'keyboardWillHide',
      }),
      () => {
        setKeyboardWillShow(false);
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  return keyboardWillShow;
}

export { useKeyboardVisibility, useKeyboardWillShow };
