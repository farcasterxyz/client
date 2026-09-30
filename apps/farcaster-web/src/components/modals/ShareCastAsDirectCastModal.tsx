import { AnalyticsEvent } from 'farcaster-analytics';
import {
  type ApiCast,
  type ApiDirectCastMessageMetadata,
  type ApiUser,
  getCastURL,
} from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  useNonSuspenseSearchUsers,
  useSendDirectCast,
  useShareCast,
} from 'farcaster-client-hooks';
import { generateMessageId } from 'farcaster-cryptography';
import React from 'react';

import {
  type DirectCastTarget,
  SearchForDirectCastTargets,
} from '~/components/directCasts/SearchForDirectCastTargets';
import { TextInput } from '~/components/forms/TextInput';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { ShareCastAsDirectCastToast } from '~/components/toasts/ShareCastAsDirectCastToast';
import { MAX_DIRECT_CAST_TEXT_LENGTH } from '~/constants/casts';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { toast } from '~/utils/toast';

import { DefaultModalActionButtons } from './DefaultModalActionButtons';
import { DefaultModalContent } from './DefaultModalContent';
import { DefaultModalHeader } from './DefaultModalHeader';

const MAX_NUM_SELECTED_TARGETS = 12;

type ShareCastAsDirectCastModalProps = {
  cast: ApiCast;
  onClose: () => void;
};

const ShareCastAsDirectCastModal: React.FC<ShareCastAsDirectCastModalProps> =
  React.memo(({ cast, onClose }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent>
            <DefaultModalHeader title="Share cast" onClose={onClose} />
            <React.Suspense
              fallback={
                <span className="flex size-full flex-row items-center justify-center py-8">
                  <LoadingIndicator />
                </span>
              }
            >
              <ShareCastAsDirectCastModalContent
                cast={cast}
                onClose={onClose}
              />
            </React.Suspense>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  });

type ShareCastAsDirectCastModalContentProps = {
  cast: ApiCast;
  onClose: () => void;
};

const ShareCastAsDirectCastModalContent: React.FC<
  ShareCastAsDirectCastModalContentProps
> = ({ cast, onClose }) => {
  const { trackEvent } = useAnalytics();

  const [selectedTargets, setSelectedTargets] = React.useState<
    DirectCastTarget[]
  >([]);
  const [query, setQuery] = React.useState('');

  const sendDirectCast = useSendDirectCast();

  const { data: shareCastTargetData } = useShareCast({ castHash: cast.hash });

  const currentUser = useCurrentUser();

  const [directCastMessage, setDirectCastMessage] = React.useState<
    string | undefined
  >(undefined);

  const {
    data: searchedResults,
    onEndReached,
    isFetchingNextPage,
  } = useNonSuspenseSearchUsers({
    q: query,
    excludeSelf: true,
    includeDirectCastAbility: true,
  });

  const initialResults = React.useMemo(() => {
    return shareCastTargetData?.result.targets || [];
  }, [shareCastTargetData]);

  const combinedResults = React.useMemo(() => {
    const searchedUsers =
      searchedResults?.pages.flatMap(({ result: { users } }) => users) || [];

    const transformedSearchedUsers = (): DirectCastTarget[] =>
      searchedUsers.map((user) => ({
        type: 'user',
        content: user,
      }));

    const transformedInitialResults = (): DirectCastTarget[] =>
      initialResults.map((target) => {
        if (target.type === 'user') {
          return { type: 'user', content: target.content.user };
        }
        if (target.type === 'group-conversation') {
          return { type: 'group', content: target.content.conversation };
        }
        // This should never happen, but TypeScript requires a return statement
        throw new Error('Invalid target type');
      });

    if (query !== '') {
      return transformedSearchedUsers();
    }

    const combinedTargets = [
      ...transformedSearchedUsers(),
      ...transformedInitialResults().filter(
        (target) =>
          target.type === 'group' ||
          !searchedUsers.some(
            (user) => user.fid === (target.content as ApiUser).fid,
          ),
      ),
    ];

    // Capping the max amount of targets shown to 12 for now
    return combinedTargets.slice(0, 12);
  }, [searchedResults, initialResults, query]);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const optimisticDirectCastMetadata = React.useMemo(() => {
    const optimisticMetadata: ApiDirectCastMessageMetadata = {
      casts: [
        {
          author: cast.author,
          hash: cast.hash,
          text: cast.text,
          threadHash: cast.threadHash,
          timestamp: cast.timestamp,
          deleted: cast.deleted,
          embeds: cast.embeds,
          parentAuthor: cast.parentAuthor,
          parentHash: cast.parentHash,
          parentSource: cast.parentSource,
          channel: cast.channel,
        },
      ],
    };

    return optimisticMetadata;
  }, [
    cast.author,
    cast.channel,
    cast.deleted,
    cast.embeds,
    cast.hash,
    cast.parentAuthor,
    cast.parentHash,
    cast.parentSource,
    cast.text,
    cast.threadHash,
    cast.timestamp,
  ]);

  const onSendPress = React.useCallback(() => {
    if (selectedTargets.length === 0) {
      return;
    }

    trackEvent(AnalyticsEvent.ShareCastDirectCast, {
      targets: selectedTargets.length,
    });

    // Also capping the possible targets users can blast a message here.
    const cappedSelectedTargets = selectedTargets.slice(
      0,
      MAX_NUM_SELECTED_TARGETS,
    );

    const castURL = getCastURL({
      castUsername: cast.author.username,
      castHash: cast.hash,
    });

    const message =
      typeof directCastMessage !== 'undefined' && directCastMessage !== ''
        ? `${castURL} ${directCastMessage}`
        : castURL;

    const messageSenderContext = {
      displayName: currentUser.displayName,
      fid: currentUser.fid,
      pfp: currentUser.pfp,
      username: currentUser.username,
    };

    for (const target of cappedSelectedTargets) {
      const messageId = generateMessageId();
      if (target.type === 'user') {
        const conversationId = buildNonGroupConversationId({
          participantFids: [target.content.fid, currentUser.fid],
        });
        void sendDirectCast({
          data: {
            conversationId: conversationId,
            fid: currentUser.fid,
            recipientFids: [target.content.fid],
            messageId: messageId,
            message: message,
            type: 'text',
            optimisticMetadata: optimisticDirectCastMetadata,
            senderContext: messageSenderContext,
          },
        });
        continue;
      }

      const group = target.content;
      void sendDirectCast({
        data: {
          conversationId: group.conversationId,
          fid: currentUser.fid,
          recipientFids: group.participants
            .map(({ fid }) => fid)
            .filter((participantFid) => participantFid !== currentUser.fid),
          message: message,
          messageId: messageId,
          type: 'text',
          optimisticMetadata: optimisticDirectCastMetadata,
          senderContext: messageSenderContext,
          conversationCategory: group.viewerContext.category,
        },
      });
    }

    onClose();

    const toastMessage =
      selectedTargets.length === 1
        ? 'Message sent'
        : 'Messages sent separately';

    toast({
      message: <ShareCastAsDirectCastToast message={toastMessage} />,
      type: 'custom',
      toastId: `share-cast-toast-${cast.hash}`,
      position: 'bottom-center',
    });
  }, [
    cast.author.username,
    cast.hash,
    currentUser.displayName,
    currentUser.fid,
    currentUser.pfp,
    currentUser.username,
    directCastMessage,
    onClose,
    optimisticDirectCastMetadata,
    selectedTargets,
    sendDirectCast,
    trackEvent,
  ]);

  return (
    <div className="flex size-full flex-col justify-between overflow-hidden">
      <SearchForDirectCastTargets
        onSelectionChanged={setSelectedTargets}
        searchInputRef={searchInputRef}
        results={combinedResults}
        showEmptyResultsView={false}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        onQueryStringChange={setQuery}
        maxNumSelectedTargets={MAX_NUM_SELECTED_TARGETS}
      />
      <div className="flex flex-col gap-y-4 rounded-b-md border-t p-[16px] bg-app border-default">
        {selectedTargets.length !== 0 && (
          <TextInput
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              setDirectCastMessage(e.target.value);
            }}
            maxLength={MAX_DIRECT_CAST_TEXT_LENGTH}
            value={directCastMessage}
            autoFocus={true}
            placeholder={'Write a message...'}
            className="focus:outline-hidden border px-[12px] py-[10px] border-faint"
          />
        )}
        <DefaultModalActionButtons
          isLoading={false}
          isPrimaryButtonDisabled={selectedTargets.length === 0}
          onPrimaryButtonClick={onSendPress}
          primaryButtonLabel={
            selectedTargets.length === 0
              ? 'Select users'
              : selectedTargets.length > 1
                ? 'Send separately'
                : 'Send a message'
          }
        />
      </div>
    </div>
  );
};

ShareCastAsDirectCastModal.displayName = 'ShareCastAsDirectCastModal';

export { ShareCastAsDirectCastModal };
