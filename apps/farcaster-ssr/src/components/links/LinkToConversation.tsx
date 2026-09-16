import { ApiCast } from 'farcaster-client-data';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import { useRequest } from '~/contexts/RequestProvider';
import { getConversationUrl } from '~/utils/conversationUtils';

type LinkToConversationProps = {
  cast: ApiCast;
  children: ReactNode;
};

const LinkToConversation: FC<LinkToConversationProps> = ({
  cast,
  children,
}) => {
  const { host } = useRequest();
  return <Link href={getConversationUrl({ cast, host })}>{children}</Link>;
};

LinkToConversation.displayName = 'LinkToConversation';

export { LinkToConversation };
