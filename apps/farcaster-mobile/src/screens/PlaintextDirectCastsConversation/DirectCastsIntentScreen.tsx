import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  buildNonGroupConversationId,
  useUserByFid,
} from 'farcaster-client-hooks';
import React from 'react';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { PlaintextDirectCastsStackParamList } from '~/types';

type DirectCastsIntentScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsIntent'
>;

const DirectCastsIntentScreen = buildScreen<DirectCastsIntentScreenProps>(
  {
    name: 'DirectCastsIntent',
    avoidKeyboard: true,
    insetTop: true,
  },
  ({ route: { params } }) => {
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const { data: target } = useUserByFid({ fid: params.targetFid });

    const { replace } = useNavigationMethods();

    const replaceRouteFromDirectCastsIntent = React.useCallback(() => {
      if (
        typeof target === 'undefined' ||
        target === null ||
        params.targetFid === currentUserFid
      ) {
        replace('PlaintextDirectCasts', {});

        return;
      }

      const conversationId = buildNonGroupConversationId({
        participantFids: [target.result.user.fid, currentUserFid],
      });

      replace('PlaintextDirectCastsConversation', {
        counterParty: target.result.user,
        conversationId: conversationId,
        create: true,
        intentText: params.intentText,
      });
    }, [currentUserFid, params.intentText, params.targetFid, replace, target]);

    useFocusEffect(
      React.useCallback(() => {
        // Navigation stack is acting up with replacing the route when user already loaded the app.
        // We are adding an artifical delay here (1 second although long is guaranteed for this low
        // usage feature).
        setTimeout(replaceRouteFromDirectCastsIntent, 1_000);
      }, [replaceRouteFromDirectCastsIntent]),
    );

    return <FullScreenLoadingIndicator debugName="DirectCastsIntentScreen" />;
  },
);

DirectCastsIntentScreen.displayName = 'DirectCastsIntentScreen';

export { DirectCastsIntentScreen };
