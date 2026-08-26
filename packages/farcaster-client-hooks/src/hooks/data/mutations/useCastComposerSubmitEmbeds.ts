import { useCallback } from 'react';

import {
  type CastComposerEmbedsMap,
  getEmbedsToSubmit as getEmbedsToSubmitForEmbeds,
} from './castComposerEmbedHelpers';

export function useCastComposerSubmitEmbeds({
  canonicalEmbeds,
}: {
  canonicalEmbeds: CastComposerEmbedsMap;
}): {
  getEmbedsToSubmit: (castLocalKey: number) => Promise<string[]>;
  getEmbedsToStoreForDraft: (castLocalKey: number) => Promise<string[]>;
} {
  const getEmbedsToSubmit = useCallback(
    (castLocalKey: number) => {
      return getEmbedsToSubmitForEmbeds(canonicalEmbeds[castLocalKey] ?? []);
    },
    [canonicalEmbeds],
  );

  const getEmbedsToStoreForDraft = useCallback(
    (castLocalKey: number) => {
      return getEmbedsToSubmitForEmbeds(canonicalEmbeds[castLocalKey] ?? [], {
        includeTextEmbeds: false,
      });
    },
    [canonicalEmbeds],
  );

  return {
    getEmbedsToSubmit,
    getEmbedsToStoreForDraft,
  };
}
