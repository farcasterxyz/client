import { EditorState } from 'draft-js';
import debounce from 'lodash/debounce';
import React from 'react';

import { getComposerInstance } from '~/utils/linkify/linkifyUtils';

const isOpenGraphLinkMatch = (match: { schema?: string; text: string }) => {
  return (
    typeof match.schema === 'undefined' ||
    match.schema === '' ||
    match.schema === 'http:' ||
    match.schema === 'https:' ||
    match.schema === 'farcaster:'
  );
};

const useLinkifyComposerPlugin = () => {
  const [openGraphLinks, setOpenGraphLinks] = React.useState<string[]>([]);
  // The editor text that produced `openGraphLinks`. Consumers gate URL-embed
  // sync on `openGraphLinksScannedText === currentEditorText` so the candidate
  // set is never stale during the linkify debounce window.
  const [openGraphLinksScannedText, setOpenGraphLinksScannedText] =
    React.useState<string>('');

  const linkifyComposerLinkifyInstance = React.useMemo(() => {
    return getComposerInstance();
  }, []);

  const getNonTokenLinkMatches = React.useCallback(
    (text: string) => {
      const matches = linkifyComposerLinkifyInstance.match(text);
      if (!matches || matches.length === 0) {
        return [];
      }
      return matches.filter((o) => !o.text.startsWith('$'));
    },
    [linkifyComposerLinkifyInstance],
  );

  const getOpenGraphLinkMatches = React.useCallback(
    (text: string) => getNonTokenLinkMatches(text).filter(isOpenGraphLinkMatch),
    [getNonTokenLinkMatches],
  );

  const immediateSetOpenGraphLink = React.useCallback(
    (text: string) => {
      const filteredMatchesForOpenGraph = getOpenGraphLinkMatches(text);
      if (filteredMatchesForOpenGraph.length !== 0) {
        setOpenGraphLinks(
          Array.from(
            new Set(filteredMatchesForOpenGraph.map(({ url }) => url)),
          ),
        );
      } else {
        setOpenGraphLinks([]);
      }
      setOpenGraphLinksScannedText(text);
    },
    [getOpenGraphLinkMatches],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetOpenGraphLink = React.useCallback(
    debounce(
      (es: EditorState) =>
        immediateSetOpenGraphLink(es.getCurrentContent().getPlainText()),
      750,
      { leading: true },
    ),
    [],
  );

  return {
    debouncedSetOpenGraphLink,
    getNonTokenLinkMatches,
    immediateSetOpenGraphLink,
    openGraphLinks,
    openGraphLinksScannedText,
  };
};

export { isOpenGraphLinkMatch, useLinkifyComposerPlugin };
