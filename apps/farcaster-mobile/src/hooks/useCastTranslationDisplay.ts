import { ApiCast } from 'farcaster-client-data';
import { useCallback, useMemo, useState } from 'react';

import {
  castHasPendingTranslation,
  castHasTranslation,
  getCastDisplayText,
  getCastTranslationSourceLanguageName,
} from '~/utils/castTranslationUtils';

const useCastTranslationDisplay = (cast: ApiCast) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const hasTranslation = castHasTranslation(cast);
  const isTranslationPending = castHasPendingTranslation(cast);

  const displayText = useMemo(() => {
    if (!hasTranslation) {
      return cast.text;
    }

    return getCastDisplayText({
      cast,
      showOriginal,
    });
  }, [cast, hasTranslation, showOriginal]);

  const sourceLanguageName = useMemo(
    () => getCastTranslationSourceLanguageName(cast),
    [cast],
  );

  const toggleTranslation = useCallback(() => {
    setShowOriginal((current) => !current);
  }, []);

  const toggleLabel = showOriginal ? 'Translate' : 'Show original';

  return {
    displayText,
    hasTranslation,
    isTranslationPending,
    showOriginal,
    sourceLanguageName,
    toggleLabel,
    toggleTranslation,
  };
};

export { useCastTranslationDisplay };
