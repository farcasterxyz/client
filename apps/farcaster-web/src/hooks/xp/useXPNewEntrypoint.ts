import React, { useCallback } from 'react';

const XP_INTRO_KEY = 'xp_intro_shown_v3';

export const useXPNewEntrypoint = () => {
  const [shouldShowIntro, setShouldShowIntroState] =
    React.useState<boolean>(false);
  React.useEffect(() => {
    const value = localStorage.getItem(XP_INTRO_KEY);
    if (value !== 'true') {
      setShouldShowIntroState(true);
    }
  }, [setShouldShowIntroState]);

  const setShouldShowIntro = useCallback(() => {
    setShouldShowIntroState(false);
    localStorage.setItem(XP_INTRO_KEY, 'true');
  }, []);
  return { shouldShowIntro, setShouldShowIntro };
};
