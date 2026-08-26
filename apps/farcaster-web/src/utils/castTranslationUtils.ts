import { ApiCast } from 'farcaster-client-data';

const languageDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : undefined;

const getLanguageDisplayName = (languageIsoCode: string | undefined) => {
  if (!languageIsoCode) {
    return undefined;
  }

  try {
    return languageDisplayNames?.of(languageIsoCode) ?? languageIsoCode;
  } catch {
    return languageIsoCode;
  }
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

/** Caller must admin-gate before passing showOriginal=false. */
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
