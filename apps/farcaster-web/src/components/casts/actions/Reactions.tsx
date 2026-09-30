import {
  CastReactionType,
  getLikeIconType,
  LikeIconType,
  useCreateCastLike,
  useDeleteCastLike,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo, useState } from 'react';

import {
  CastReactionAction,
  CastReactionActionProps,
} from '~/components/casts/actions/CastReactionAction';
import { ThemedReactionIcon } from '~/components/casts/actions/icons/ThemedReactionIcon';
import { CastActionProps } from '~/components/casts/actions/types';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { trackError } from '~/utils/errorUtils';

type HeartIconProps = {
  active: boolean;
};

const HeartIcon: React.FC<HeartIconProps> = ({ active }) => {
  if (active) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9.41738 16.7648L9.38813 16.7805C9.26819 16.8426 9.13508 16.8751 9 16.8751C8.86492 16.8751 8.73182 16.8426 8.61188 16.7805L8.60287 16.776L8.58263 16.7648C8.46482 16.7039 8.34853 16.6401 8.23387 16.5735C6.86271 15.7931 5.56911 14.8838 4.37063 13.8577C2.30063 12.0724 0 9.39375 0 6.1875C0 3.1905 2.34675 1.125 4.78125 1.125C6.52163 1.125 8.04712 2.02725 9 3.3975C9.95288 2.02725 11.4784 1.125 13.2188 1.125C15.6532 1.125 18 3.1905 18 6.1875C18 9.39375 15.6994 12.0724 13.6294 13.8577C12.3293 14.9693 10.9178 15.9434 9.41738 16.7648L9.39712 16.776L9.39038 16.7794H9.38813L9.41738 16.7648Z"
          className="fill-danger"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 16.0312L9.38813 16.7805C9.26819 16.8426 9.13508 16.8751 9 16.8751C8.86492 16.8751 8.73182 16.8426 8.61188 16.7805L8.60287 16.776L8.58263 16.7648C8.46482 16.7039 8.34853 16.6401 8.23387 16.5735C6.86271 15.7931 5.56911 14.8838 4.37063 13.8577C2.30062 12.0724 0 9.39375 0 6.1875C0 3.1905 2.34675 1.125 4.78125 1.125C6.52163 1.125 8.04712 2.02725 9 3.3975C9.95288 2.02725 11.4784 1.125 13.2188 1.125C15.6532 1.125 18 3.1905 18 6.1875C18 9.39375 15.6994 12.0724 13.6294 13.8577C12.3293 14.9693 10.9178 15.9434 9.41738 16.7648L9.39712 16.776L9.39038 16.7794H9.38813L9 16.0312ZM4.78125 2.8125C3.27825 2.8125 1.6875 4.122 1.6875 6.1875C1.6875 8.60625 3.465 10.8495 5.47312 12.5798C6.56874 13.5169 7.74949 14.3496 9 15.0671C10.2505 14.3496 11.4313 13.5169 12.5269 12.5798C14.535 10.8495 16.3125 8.60625 16.3125 6.1875C16.3125 4.122 14.7218 2.8125 13.2188 2.8125C11.6741 2.8125 10.2836 3.92175 9.81112 5.5755C9.76137 5.75232 9.6552 5.90804 9.50877 6.01895C9.36235 6.12986 9.18369 6.18989 9 6.18989C8.81631 6.18989 8.63765 6.12986 8.49123 6.01895C8.3448 5.90804 8.23863 5.75232 8.18888 5.5755C7.71637 3.92175 6.32587 2.8125 4.78125 2.8125Z"
        className="fill-tertiary"
      />
    </svg>
  );
};

type ReactionsProps = CastActionProps;

const Reactions: FC<ReactionsProps> = memo(
  ({ cast, isFocused, disabled, includeReason }) => {
    const trackCastReaction = useTrackCastReaction();
    const isSignedIn = useIsSignedIn();

    const createCastLike = useCreateCastLike();
    const deleteCastLike = useDeleteCastLike();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const active = !!cast.viewerContext?.reacted;
    const iconType = useMemo<LikeIconType>(
      () => getLikeIconType(cast.text),
      [cast.text],
    );
    const activeColor = getReactionActiveColor(iconType);
    const variant = getReactionVariant(iconType);
    const icon =
      iconType === 'default' ? (
        <HeartIcon active={active} />
      ) : (
        <ThemedReactionIcon active={active} iconType={iconType} />
      );

    return (
      <CastReactionAction
        activeColor={activeColor}
        icon={icon}
        count={cast.reactions.count}
        isFocused={!!isFocused}
        isActive={!!cast.viewerContext?.reacted}
        variant={variant}
        disabled={!isSignedIn || disabled}
        onClick={async () => {
          if (isSubmitting) {
            return;
          }

          try {
            setIsSubmitting(true);
            trackCastReaction({
              castHash: cast.hash,
              type: CastReactionType.Like,
              undo: !!cast.viewerContext?.reacted,
              castFid: cast.author.fid,
              ...(includeReason ? { includeReason } : {}),
            });

            if (cast.viewerContext?.reacted) {
              try {
                await deleteCastLike({ cast });
              } catch (error) {
                // TODO: Add proper UI for error
                trackError(error);
                alert(error);
              }
            } else {
              try {
                await createCastLike({ cast });
              } catch (error) {
                // TODO: Add proper UI for error
                trackError(error);
                alert(error);
              }
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    );
  },
);

Reactions.displayName = 'Reactions';

const getReactionVariant = (
  iconType: LikeIconType,
): CastReactionActionProps['variant'] => {
  switch (iconType) {
    case 'default':
    case 'noggles':
    case 'rainbow-wallet':
      return 'red';
    case 'ga':
    case 'gm':
    case 'gn':
      return 'green';
    case 'degen':
    case 'farcaster':
    case 'clanker':
      return 'purple';
    case 'wowow':
    default:
      return 'green';
  }
};

const getReactionActiveColor = (iconType: LikeIconType): string | undefined => {
  switch (iconType) {
    case 'ga':
      return '#B8A34D';
    case 'gm':
      return '#F38234';
    case 'gn':
      return '#9170F6';
    case 'farcaster':
    case 'degen':
    case 'clanker':
      return undefined;
    default:
      return undefined;
  }
};

export { Reactions };
