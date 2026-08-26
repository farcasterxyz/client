import React from 'react';
// Why are we using 'react-native-easy-markdown' instead of some other packages?
// As of 04/22, per my research there are no actively developed packages for RN
// that claims to have GitHub flavored Markdown support. Since OpenSea chose to use
// that flavor, many collections have adopted that as well. This package seems
// to do the best job when it comes to rendering all possible cobinations of URLs,
// links and twitter handles etc. hence is the choice at this time. (goksu)
//
// Update: The [original package](https://github.com/TitanInvest/react-native-easy-markdown)
// was unmaintained, so we forked to [our own repo](https://github.com/merkle-manufactory/react-native-easy-markdown)
// and merged a few previously open PRs from the original repo:
// - [Updated simple-markdown version to 0.7.2 to fix vulnerabilities](https://github.com/TitanInvest/react-native-easy-markdown/pull/11)
// - [Merge default styles with custom styles for all text nodes](https://github.com/TitanInvest/react-native-easy-markdown/pull/5)
// (nick)
// eslint-disable-next-line no-restricted-imports
import ReactNativeMarkdown from 'react-native-easy-markdown';

import { useTheme } from '~/contexts/ThemeProvider';

interface MarkdownProps {
  children: string;
}

const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  const t = useTheme();

  return (
    <ReactNativeMarkdown
      markdownStyles={{
        text: [t.texts.primary],
        link: t.texts.brand,
      }}
    >
      {children}
    </ReactNativeMarkdown>
  );
};

Markdown.displayName = 'Markdown';

export { Markdown };
