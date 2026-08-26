import {
  buildNonGroupConversationId,
  useOptimisticallyAddNewDirectCastConversationToInbox,
  useUserByFid,
} from 'farcaster-client-hooks';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

const DirectCastsInboxCreatePage: React.FC = React.memo(() => {
  const { fid } = useParams('directCastsCreate');

  const { text } = useSearchParams('directCastsCreate');

  const currentUser = useCurrentUser();

  const navigateToDirectCastsConversation =
    useNavigateToDirectCastsConversation();
  const navigateToDirectCastsInbox = useNavigateToDirectCastsInbox();

  const { data: target } = useUserByFid({ fid });

  const addNewOptimisticConversation =
    useOptimisticallyAddNewDirectCastConversationToInbox();

  React.useEffect(() => {
    if (
      typeof target === 'undefined' ||
      target === null ||
      target.result.user.fid === currentUser.fid
    ) {
      navigateToDirectCastsInbox();
      return;
    }

    const conversationId = buildNonGroupConversationId({
      participantFids: [target.result.user.fid, currentUser.fid],
    });

    addNewOptimisticConversation({
      currentUser: currentUser,
      conversationId,
      counterParties: [target.result.user],
    });

    navigateToDirectCastsConversation({
      conversationId: conversationId,
      text: text || undefined,
    });
  }, [
    addNewOptimisticConversation,
    currentUser,
    fid,
    navigateToDirectCastsConversation,
    navigateToDirectCastsInbox,
    target,
    text,
  ]);

  return (
    <Page meta={{ title: 'Direct Casts / Farcaster' }}>
      <BorderedMainContent className="flex flex-col lg:w-[1023px] lg:flex-row">
        <FullScreenLoadingIndicator />
      </BorderedMainContent>
    </Page>
  );
});

DirectCastsInboxCreatePage.displayName = 'DirectCastsInboxCreatePage';

export { DirectCastsInboxCreatePage };
