import { ApiCast } from 'farcaster-client-data';

import { getLanguageDisplayNameFallback } from '~/utils/languageDisplayNameFallback';

const languageDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : undefined;

const getLanguageDisplayName = (languageIsoCode: string | undefined) => {
  if (!languageIsoCode) {
    return undefined;
  }

  const fallbackName = getLanguageDisplayNameFallback(languageIsoCode);
  if (fallbackName) {
    return fallbackName;
  }

  try {
    const displayName = languageDisplayNames?.of(languageIsoCode);
    if (
      displayName &&
      displayName.toLowerCase() !== languageIsoCode.toLowerCase()
    ) {
      return displayName;
    }
  } catch {
    // Hermes and some Android WebViews lack full ICU data for DisplayNames.
  }

  return undefined;
};

const castHasTranslation = (cast: ApiCast) => {
  return typeof cast.translation?.text !== 'undefined';
};

const castHasPendingTranslation = (cast: ApiCast) => {
  return cast.translation?.status === 'PENDING';
};

const getCastTranslationSourceLanguageName = (cast: ApiCast) => {
  const sourceLanguageIsoCode = cast.translation?.sourceLanguageIsoCode;

  return getLanguageDisplayName(sourceLanguageIsoCode) ?? 'another language';
};

const getCastDisplayText = ({
  cast,
  showOriginal,
}: {
  cast: ApiCast;
  showOriginal: boolean;
}) => {
  if (showOriginal || !castHasTranslation(cast)) {
    return cast.text;
  }

  return cast.translation?.text ?? cast.text;
};

export {
  castHasPendingTranslation,
  castHasTranslation,
  getCastDisplayText,
  getCastTranslationSourceLanguageName,
  getLanguageDisplayName,
};
