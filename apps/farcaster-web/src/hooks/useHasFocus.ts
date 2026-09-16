import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const useHasFocus = () => {
  const [hasFocus, setHasFocus] = useState(document.hasFocus());

  // We use the location to trigger a re-run of the effect when there is a navigation change.
  // This is necessary because otherwise the `onBlur` can trigger when the navigation event starts,
  // although the `onFocus` will not run. Unclear if this happens in all circumstances,
  // but it does when using nested routing like direct cast conversations.
  const location = useLocation();

  useEffect(() => {
    setHasFocus(document.hasFocus());

    const onFocus = () => setHasFocus(true);
    const onBlur = () => setHasFocus(false);

    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);

    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, [location]);

  return hasFocus;
};

export { useHasFocus };
