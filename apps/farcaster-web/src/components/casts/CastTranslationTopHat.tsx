import { Languages } from 'lucide-react';
import { FC, memo, MouseEvent } from 'react';

import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';

type CastTranslationTopHatProps = {
  isPending?: boolean;
  sourceLanguageName: string;
  showOriginal: boolean;
  toggleLabel: string;
  onToggle: () => void;
};

const CastTranslationTopHat: FC<CastTranslationTopHatProps> = memo((props) => {
  const onToggleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (props.isPending) {
    return (
      <FeedItemTopHatContainer icon={<Languages size={12} />}>
        translation pending...
      </FeedItemTopHatContainer>
    );
  }
  const { sourceLanguageName, showOriginal, toggleLabel, onToggle } = props;

  return (
    <FeedItemTopHatContainer
      icon={<Languages size={12} />}
      trailing={
        <button
          type="button"
          className="shrink-0 font-medium text-link hover:underline"
          aria-pressed={showOriginal}
          aria-label={
            showOriginal ? 'Show translated text' : 'Show original text'
          }
          onClick={(event) => {
            onToggleClick(event);
            onToggle();
          }}
        >
          {toggleLabel}
        </button>
      }
    >
      translated from {sourceLanguageName}
    </FeedItemTopHatContainer>
  );
});

CastTranslationTopHat.displayName = 'CastTranslationTopHat';

export { CastTranslationTopHat };
