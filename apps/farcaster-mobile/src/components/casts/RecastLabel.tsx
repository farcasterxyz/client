import { Octicons } from '@expo/vector-icons';
import { ApiRecaster } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

interface RecastLabelProps {
  isFocusedCast: boolean;
  recasters: ApiRecaster[] | undefined;
  recast: boolean | undefined;
}

const RecastLabel: FC<RecastLabelProps> = memo(({ recasters }) => {
  const t = useTheme();
  const { fid } = useCurrentUser_UNSAFE();

  const recasterLabels = React.useMemo(() => {
    if (typeof recasters === 'undefined') {
      return null;
    }

    // We want to display 'You' for the user and display that first if they recasted
    // If that's not the case always fallback to current user profile being visited for the first
    // recaster name. If that is not available either, randomly display rest. (goksu)
    const firstRecaster =
      recasters.find((recaster) => recaster.fid === fid) || recasters[0];

    const orderedRecasters = [firstRecaster].concat(
      recasters.filter(({ fid }) => fid !== firstRecaster.fid),
    );

    switch (orderedRecasters.length) {
      case 1:
        return <RecasterLabel recaster={orderedRecasters[0]} />;

      default:
        return (
          <>
            <RecasterLabel recaster={orderedRecasters[0]} /> and{' '}
            {orderedRecasters.length - 1}{' '}
            {orderedRecasters.length - 1 === 1 ? 'other' : 'others'}
          </>
        );
    }
  }, [recasters, fid]);

  if (typeof recasters === 'undefined' || recasters.length === 0) {
    return null;
  }

  return (
    <View style={[t.flex, t.flexRow, t.flexShrink, t.flexGrow, t.itemsCenter]}>
      <View
        style={[
          t.flex,
          t.itemsCenter,
          t.justifyCenter,
          t.bgMuted,
          t.roundedFull,
          t.h9,
          t.w9,
        ]}
      >
        <Octicons name={'sync'} size={18} style={[t.texts.tertiary]} />
      </View>
      <Text
        style={[t.mL2, t.texts.secondary, t.textBase, t.flex1]}
        numberOfLines={2}
      >
        {recasterLabels} recasted
      </Text>
    </View>
  );
});

type RecasterLabelProps = {
  recaster: ApiRecaster;
};

const RecasterLabel: FC<RecasterLabelProps> = memo(({ recaster }) => {
  const t = useTheme();

  const currentUser = useCurrentUser_UNSAFE();

  return (
    <Text style={[t.texts.secondary]}>
      {recaster.fid === currentUser.fid
        ? 'You'
        : recaster.displayName || recaster.username}
    </Text>
  );
});

export { RecastLabel };
