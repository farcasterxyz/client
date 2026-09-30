import React from 'react';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLinkifyText } from '~/hooks/useLinkifyText';

type ListChannelDescriptionProps = {
  description: string;
  descriptionMentionedUsernames: string[] | undefined;
  style: 'default' | 'notification' | 'notification-vertical';
};

const ListChannelDescription: React.FC<ListChannelDescriptionProps> = ({
  style,
  description,
  descriptionMentionedUsernames,
}) => {
  const t = useTheme();

  const { linkifiedText: channelDescription } = useLinkifyText({
    text: description.replace(/\n/g, ' '),
    mentions: descriptionMentionedUsernames,
    // We are okay only linkifying links for channel headers at this time
    channelMentions: [],
    options: {
      applyInvertedLinkStyles: [],
      skipFarcasterLinkTruncate: true,
      treatImageUrlsAsLinks: true,
      skipURLTruncates: false,
    },
  });

  return (
    <Text
      style={[
        t.texts.primary,
        style === 'default' ? t.textBase : t.textSm,
        t.mT1,
      ]}
    >
      {channelDescription}
    </Text>
  );
};

export { ListChannelDescription };
