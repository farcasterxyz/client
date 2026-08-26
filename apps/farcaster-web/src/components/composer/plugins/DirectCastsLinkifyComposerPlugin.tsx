import createLinkifyPlugin from '@draft-js-plugins/linkify';
import { EditorState } from 'draft-js';
import debounce from 'lodash/debounce';
import React from 'react';

import { getDirectCastsComposerInstance } from '~/utils/linkify/linkifyUtils';

const useDirectCastsLinkifyComposerPlugin = () => {
  const [shouldCheckMetadata, setShouldCheckMetadata] =
    React.useState<boolean>(false);

  const linkifyComposerLinkifyInstance = React.useMemo(() => {
    return getDirectCastsComposerInstance();
  }, []);

  const plugin = React.useMemo(() => {
    return createLinkifyPlugin({
      customExtractLinks: (text: string) =>
        linkifyComposerLinkifyInstance.match(text),
    });
  }, [linkifyComposerLinkifyInstance]);

  const immediateSetOpenGraphLink = React.useCallback(
    (text: string) => {
      const matches = linkifyComposerLinkifyInstance.match(text);

      if (matches && matches.length > 0) {
        setShouldCheckMetadata(true);
      } else {
        setShouldCheckMetadata(false);
      }
    },
    [linkifyComposerLinkifyInstance],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetOpenGraphLink = React.useCallback(
    debounce(
      (es: EditorState) =>
        immediateSetOpenGraphLink(es.getCurrentContent().getPlainText()),
      350,
      { leading: true },
    ),
    [],
  );

  return {
    plugin,
    debouncedSetOpenGraphLink,
    immediateSetOpenGraphLink,
    shouldCheckMetadata,
  };
};

export { useDirectCastsLinkifyComposerPlugin };
