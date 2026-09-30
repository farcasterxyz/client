import { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '~/components/Text';
import { showDirectCastMessageReactionsPromptKey } from '~/constants/Storage';
import { useDirectCastToTakeAction } from '~/contexts/DirectCastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type DirectCastReactionsProps = {
  currentUserFid: number;
  directCast: ApiDirectCastMessageV3;
};

const DirectCastReactions: React.FC<DirectCastReactionsProps> = React.memo(
  ({ currentUserFid, directCast }) => {
    const t = useTheme();

    const { setDirectCastToTakeAction } = useDirectCastToTakeAction();

    const { showGlobalPrompt } = useGlobalPrompts();

    const selfDirectCast = React.useMemo(() => {
      return directCast.senderFid === currentUserFid;
    }, [currentUserFid, directCast.senderFid]);

    const reactions = React.useMemo(() => {
      return directCast.reactions;
    }, [directCast.reactions]);

    const reactionCount = React.useMemo(
      () =>
        reactions.reduce((sum, reactionSummary) => {
          return reactionSummary.count + sum;
        }, 0),
      [reactions],
    );

    const recentReactions = React.useMemo(() => {
      return reactions.slice(0, 3);
    }, [reactions]);

    if (reactionCount === 0) {
      return null;
    }

    return (
      <Pressable
        style={[
          t.flex,
          t.relative,
          t.pL2,
          t.relative,
          !selfDirectCast ? t.flexRow : t.flexRowReverse,
          { top: -8 },
        ]}
        onPress={() => {
          setDirectCastToTakeAction(directCast);

          showGlobalPrompt({
            key: showDirectCastMessageReactionsPromptKey,
          });
        }}
      >
        <View
          style={[
            t.directCasts.bg,
            t.p1,
            t.pX2,
            t.flexShrink,
            t.flex,
            t.flexRow,
            t.roundedFull,
            t.borderDefault,
            t.borderHairline,
          ]}
        >
          {recentReactions.map(({ reaction }) => (
            <Text key={reaction} style={[t.texts.primary, t.textXs]}>
              {reaction}
            </Text>
          ))}
          <Text style={[t.texts.secondary, t.fontBold, t.textXs, t.pL1]}>
            {reactionCount}
          </Text>
        </View>
      </Pressable>
    );
  },
);

export { DirectCastReactions };
