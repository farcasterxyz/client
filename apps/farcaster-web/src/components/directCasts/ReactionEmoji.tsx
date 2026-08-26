import React from 'react';

import { WARPLET_SHORTCODE, WARPLET_SVG_SRC } from '~/constants/customEmojis';

type ReactionEmojiProps = {
  reaction: string;
  className?: string;
};

/**
 * Renders a reaction - either as native emoji (Unicode) or as custom emoji (e.g. warplet).
 */
const ReactionEmoji: React.FC<ReactionEmojiProps> = ({
  reaction,
  className,
}) => {
  if (reaction === WARPLET_SHORTCODE) {
    return (
      <img
        src={WARPLET_SVG_SRC}
        alt="Warplet"
        className={className}
        style={{ width: '1em', height: '1em', display: 'inline-block' }}
      />
    );
  }
  return <span className={className}>{reaction}</span>;
};

export { ReactionEmoji };
