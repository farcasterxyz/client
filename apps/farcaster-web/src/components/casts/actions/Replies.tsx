import { AnalyticsEvent } from 'farcaster-analytics';
import {
  CastClickType,
  resolveUsername,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import { FC, memo, useState } from 'react';

import { CastReactionAction } from '~/components/casts/actions/CastReactionAction';
import { CastActionProps } from '~/components/casts/actions/types';
import { AlertModal } from '~/components/modals/AlertModal';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
const ReplyIcon: React.FC = () => {
  return (
    <svg width="19" height="18" viewBox="0 0 19 18" fill="none">
      <path
        d="M1.625 3.09375C1.625 2.007 2.507 1.125 3.59375 1.125H15.4062C16.493 1.125 17.375 2.007 17.375 3.09375V11.5312C17.375 12.0534 17.1676 12.5542 16.7984 12.9234C16.4292 13.2926 15.9284 13.5 15.4062 13.5H10.6925L7.79787 16.3946C7.56843 16.6232 7.27646 16.7787 6.95876 16.8416C6.64106 16.9045 6.31185 16.8719 6.01263 16.748C5.71341 16.6241 5.45757 16.4144 5.27736 16.1453C5.09716 15.8762 5.00065 15.5597 5 15.2359V13.5H3.59375C3.07161 13.5 2.57085 13.2926 2.20163 12.9234C1.83242 12.5542 1.625 12.0534 1.625 11.5312V3.09375ZM3.59375 2.8125C3.51916 2.8125 3.44762 2.84213 3.39488 2.89488C3.34213 2.94762 3.3125 3.01916 3.3125 3.09375V11.5312C3.3125 11.6865 3.4385 11.8125 3.59375 11.8125H5.84375C6.06753 11.8125 6.28214 11.9014 6.44037 12.0596C6.59861 12.2179 6.6875 12.4325 6.6875 12.6562V15.12L9.7475 12.06C9.82574 11.9816 9.91867 11.9194 10.021 11.8769C10.1233 11.8344 10.233 11.8125 10.3438 11.8125H15.4062C15.4808 11.8125 15.5524 11.7829 15.6051 11.7301C15.6579 11.6774 15.6875 11.6058 15.6875 11.5312V3.09375C15.6875 3.01916 15.6579 2.94762 15.6051 2.89488C15.5524 2.84213 15.4808 2.8125 15.4062 2.8125H3.59375Z"
        className="fill-tertiary"
      />
    </svg>
  );
};

const Replies: FC<CastActionProps> = memo(
  ({ cast, isFocused, disabled, includeReason }) => {
    const isSignedIn = useIsSignedIn();
    const trackCastClick = useTrackCastClick();
    const { trackEvent } = useAnalytics();

    const [isComposingCast, setIsComposingCast] = useState(false);
    const [showBlockedAlert, setShowBlockedAlert] = useState(false);

    return (
      <>
        <CastReactionAction
          icon={<ReplyIcon />}
          count={cast.replies.count}
          isFocused={!!isFocused}
          variant="purple"
          disabled={!isSignedIn || disabled || cast.replyDisabled}
          onClick={() => {
            if (cast.author.viewerContext?.blockedBy) {
              setShowBlockedAlert(true);
            } else {
              trackCastClick({ type: CastClickType.Reply });
              trackEvent(AnalyticsEvent.AddCastModalShown, undefined);

              setIsComposingCast(true);
            }
          }}
        />
        {isComposingCast && (
          <ComposeCastModal
            onClose={() => {
              setIsComposingCast(false);
            }}
            intent={{
              parentCastHash: cast.hash,
              parentCast: cast,
              ...(includeReason ? { includeReason } : {}),
            }}
          />
        )}
        {showBlockedAlert && (
          <AlertModal onOk={() => setShowBlockedAlert(false)}>
            <div className="pb-3 text-lg font-semibold">Unable to reply</div>
            <div>
              {resolveUsername({
                username: cast.author.username,
                fid: cast.author.fid,
              })}{' '}
              has blocked you. You cannot reply to their casts.
            </div>
          </AlertModal>
        )}
      </>
    );
  },
);

Replies.displayName = 'Replies';

export { Replies };
