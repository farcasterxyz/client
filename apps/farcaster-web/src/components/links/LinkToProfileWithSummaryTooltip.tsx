import { useUserByUsername } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';

import { HoverCardTooltip } from '~/components/HoverCardTooltip';
import {
  LinkToProfileCasts,
  LinkToProfileCastsProps,
} from '~/components/links/LinkToProfileCasts';
import { ProfileTooltipSummary } from '~/components/profiles/ProfileTooltipSummary';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

type LinkToProfileWithSummaryTooltipContentProps = {
  username: string;
};

const LinkToProfileWithSummaryTooltipContent: React.FC<
  LinkToProfileWithSummaryTooltipContentProps
> = ({ username }) => {
  const userByUsername = useUserByUsername({ username });

  const user = useMemo(() => {
    return userByUsername.data?.result.user;
  }, [userByUsername.data?.result.user]);

  if (!user) {
    return <></>;
  }

  return <ProfileTooltipSummary user={user} />;
};

type LinkToProfileProps = LinkToProfileCastsProps;

const LinkToProfileWithSummaryTooltip: React.FC<LinkToProfileProps> = (
  props,
) => {
  const isSignedIn = useIsSignedIn();

  const trigger = React.useMemo(() => {
    return <LinkToProfileCasts {...props} />;
  }, [props]);

  const content = React.useMemo(() => {
    if (typeof props.user.username === 'undefined') {
      return null;
    }

    return (
      <LinkToProfileWithSummaryTooltipContent username={props.user.username} />
    );
  }, [props.user.username]);

  if (!isSignedIn || typeof props.user.username === 'undefined') {
    return trigger;
  }

  return (
    <HoverCardTooltip
      trigger={trigger}
      content={content}
      className="h-min w-auto"
    />
  );
};

export { LinkToProfileWithSummaryTooltip };
