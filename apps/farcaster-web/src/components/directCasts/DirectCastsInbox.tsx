import { ApiDirectCastConversationViewCategory } from 'farcaster-client-data';
import React from 'react';

import { DirectCastsArchivedInbox } from './DirectCastsArchivedInbox';
import { DirectCastsDefaultInbox } from './DirectCastsDefaultInbox';
import { DirectCastsRequestsInbox } from './DirectCastsRequestsInbox';
import { DirectCastsSearchInbox } from './DirectCastsSearchInbox';

type DirectCastsInboxPropsType = {
  activeConversationId: string | undefined;
  filter: string | undefined;
  inboxCategory: ApiDirectCastConversationViewCategory;
};

const DirectCastsInbox: React.FC<DirectCastsInboxPropsType> = React.memo(
  ({ activeConversationId, filter, inboxCategory }) => {
    if (typeof filter !== 'undefined') {
      return (
        <DirectCastsSearchInbox
          activeConversationId={activeConversationId}
          filter={filter}
          category={inboxCategory}
        />
      );
    }

    if (inboxCategory === 'archived') {
      return (
        <DirectCastsArchivedInbox activeConversationId={activeConversationId} />
      );
    }

    if (inboxCategory === 'request') {
      return (
        <DirectCastsRequestsInbox
          activeConversationId={activeConversationId}
          category="request"
        />
      );
    }

    if (inboxCategory === 'void') {
      return (
        <DirectCastsRequestsInbox
          activeConversationId={activeConversationId}
          category="void"
        />
      );
    }

    return (
      <DirectCastsDefaultInbox activeConversationId={activeConversationId} />
    );
  },
);

DirectCastsInbox.displayName = 'DirectCastsInbox';

export { DirectCastsInbox };
