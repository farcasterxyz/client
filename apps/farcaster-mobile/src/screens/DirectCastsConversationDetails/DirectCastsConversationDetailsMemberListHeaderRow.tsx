import * as React from 'react';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

const directCastsConversationDetailsMemberListHeaderRowHeight = 33;

const DirectCastsConversationDetailsMemberListHeaderRow: React.FC<{
  memberCount: number;
}> = React.memo(({ memberCount }) => {
  const t = useTheme();
  return (
    <Text
      style={[
        t.pX1,
        t.pY2,
        t.texts.secondary,
        t.fontSemibold,
        { height: directCastsConversationDetailsMemberListHeaderRowHeight },
      ]}
    >
      Members ({memberCount})
    </Text>
  );
});

export {
  DirectCastsConversationDetailsMemberListHeaderRow,
  directCastsConversationDetailsMemberListHeaderRowHeight,
};
