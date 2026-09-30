import { Ionicons } from '@expo/vector-icons';
import {
  ApiCastQuoteNotificationGroup,
  ApiNotificationCastQuote,
} from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';
import { GitHubTopHatIcon } from '~/components/images/GitHubTopHatIcon';
import { XTopHatIcon } from '~/components/images/XTopHatIcon';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationAccessoryBackground } from './shared/NotificationAccessoryBackground';
import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CastQuoteNotificationGroupProps = {
  group: ApiCastQuoteNotificationGroup;
};

const CastQuoteNotificationGroup: FC<CastQuoteNotificationGroupProps> = memo(
  ({ group }) => {
    const t = useTheme();

    const { fid: currentUserFid } = useCurrentUser_UNSAFE();
    const push = usePush();
    const firstPreviewItem = group.previewItems[0] as ApiNotificationCastQuote;

    const replyCast = React.useMemo(
      () =>
        firstPreviewItem.type === 'cast-quote'
          ? firstPreviewItem.content.cast
          : undefined,
      [firstPreviewItem],
    );

    const xURLMention = React.useMemo(() => {
      if (
        typeof replyCast !== 'undefined' &&
        typeof replyCast.embeds !== 'undefined' &&
        typeof replyCast.embeds.casts === 'undefined' &&
        replyCast.embeds.urls.findIndex(
          ({ openGraph: { domain } }) =>
            domain === 'x.com' || domain === 'twitter.com',
        ) !== -1
      ) {
        return true;
      }

      return false;
    }, [replyCast]);

    const gitHubURLMention = React.useMemo(() => {
      if (
        typeof replyCast !== 'undefined' &&
        typeof replyCast.embeds !== 'undefined' &&
        typeof replyCast.embeds.casts === 'undefined' &&
        !xURLMention &&
        replyCast.embeds.urls.findIndex(
          ({ openGraph: { domain } }) => domain === 'github.com',
        ) !== -1
      ) {
        return true;
      }

      return false;
    }, [replyCast, xURLMention]);

    if (replyCast) {
      const notADirectReply = replyCast.parentAuthor?.fid !== currentUserFid;

      return (
        <>
          {xURLMention && (
            <FeedItemTopHatContainer
              avatarDiameter={48}
              icon={<XTopHatIcon size={13} color={t.colors.text.tertiary} />}
              text="Mention"
            />
          )}
          {gitHubURLMention && (
            <FeedItemTopHatContainer
              avatarDiameter={48}
              icon={
                <GitHubTopHatIcon size={13} color={t.colors.text.tertiary} />
              }
              text="Mention"
            />
          )}
          <Cast
            cast={replyCast}
            omitMenuActions={true}
            prefixReplyingToWithYou={notADirectReply}
            isHighlighted={group.isUnread}
          />
        </>
      );
    }

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Cast', {
            castHash: firstPreviewItem.content.cast.hash,
          });
        }}
      >
        <NotificationIcon variant="blue">
          {(iconColor, backgroundColor) => (
            <NotificationAccessoryBackground backgroundColor={backgroundColor}>
              <Ionicons name="chatbox" size={18} color={iconColor} />
            </NotificationAccessoryBackground>
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="replied to your cast"
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

CastQuoteNotificationGroup.displayName = 'CastQuoteNotificationGroup';

export { CastQuoteNotificationGroup };
