import { ScreenTitle } from 'farcaster-expo';
import React from 'react';

import { HeaderSearchButton } from '~/components/headers/HeaderSearchButton';
import { useTopBar } from '~/components/TopBar';

const InboxHeader: React.FC<{ onSearchPress?: () => void }> = React.memo(
  ({ onSearchPress }) => {
    const title = React.useMemo(() => <ScreenTitle title="Direct Casts" />, []);

    const { topBar } = useTopBar({
      leftIcon: undefined,
      title,
      rightIcon: <HeaderSearchButton onPress={onSearchPress ?? (() => {})} />,
    });

    return topBar;
  },
);

InboxHeader.displayName = 'InboxHeader';

export { InboxHeader };
