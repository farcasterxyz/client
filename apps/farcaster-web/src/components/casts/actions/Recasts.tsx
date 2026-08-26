import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import { FC, memo, useMemo, useState } from 'react';

import { CastReactionAction } from '~/components/casts/actions/CastReactionAction';
import { CastActionProps } from '~/components/casts/actions/types';
import { AlertModal } from '~/components/modals/AlertModal';
import { RecastOptions } from '~/components/popovers/RecastOptions';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

type RecastIconProps = { active: boolean };

const RecastIcon: React.FC<RecastIconProps> = ({ active }) => {
  return (
    <svg
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill="none"
      className={active ? '' : 'text-[#a5a5a5] dark:text-[#6a6a6a]'}
    >
      <path
        d="M2.41813 9.00562C2.5282 8.99243 2.63979 9.00106 2.74652 9.03101C2.85326 9.06096 2.95305 9.11166 3.04018 9.18019C3.12732 9.24873 3.20009 9.33377 3.25434 9.43044C3.3086 9.52712 3.34327 9.63354 3.35638 9.74362C3.49975 10.9294 3.98324 12.0483 4.7485 12.9653C5.51375 13.8823 6.52806 14.5583 7.669 14.9115C8.80994 15.2648 10.0287 15.2803 11.1783 14.9562C12.3279 14.632 13.359 13.9821 14.1474 13.0849L12.7929 11.7304C12.7534 11.691 12.7266 11.6409 12.7157 11.5863C12.7048 11.5316 12.7104 11.475 12.7317 11.4235C12.753 11.3721 12.7891 11.3281 12.8355 11.2972C12.8818 11.2663 12.9363 11.2499 12.992 11.25H17.0938C17.1683 11.25 17.2399 11.2796 17.2926 11.3324C17.3454 11.3851 17.375 11.4567 17.375 11.5312V15.633C17.3751 15.6887 17.3587 15.7432 17.3278 15.7895C17.2969 15.8359 17.2529 15.872 17.2014 15.8933C17.15 15.9146 17.0934 15.9202 17.0387 15.9093C16.9841 15.8984 16.934 15.8716 16.8946 15.8321L15.3421 14.2796C14.3288 15.3996 13.0148 16.2046 11.5568 16.5988C10.0988 16.993 8.55817 16.9597 7.11854 16.5029C5.67891 16.0461 4.40095 15.1851 3.43693 14.0224C2.47291 12.8597 1.86348 11.4443 1.68125 9.945C1.66806 9.83493 1.67668 9.72333 1.70664 9.6166C1.73659 9.50986 1.78729 9.41008 1.85582 9.32294C1.92436 9.23581 2.0094 9.16303 2.10607 9.10878C2.20275 9.05452 2.30917 9.01985 2.41925 9.00675L2.41813 9.00562ZM9.5 2.8125C8.62026 2.81157 7.75049 2.99869 6.94897 3.36132C6.14745 3.72396 5.4327 4.25372 4.85263 4.91512L6.20713 6.26962C6.24656 6.30896 6.27343 6.35912 6.28432 6.41374C6.29522 6.46836 6.28965 6.52499 6.26832 6.57644C6.24699 6.6279 6.21086 6.67186 6.16452 6.70276C6.11817 6.73366 6.0637 6.7501 6.008 6.75H1.90625C1.83166 6.75 1.76012 6.72037 1.70738 6.66762C1.65463 6.61488 1.625 6.54334 1.625 6.46875V2.367C1.6249 2.3113 1.64134 2.25682 1.67224 2.21048C1.70314 2.16414 1.7471 2.12801 1.79855 2.10668C1.85001 2.08535 1.90663 2.07978 1.96126 2.09068C2.01588 2.10157 2.06604 2.12844 2.10538 2.16787L3.65788 3.72037C4.67122 2.6004 5.98518 1.79536 7.4432 1.40118C8.90122 1.00699 10.4418 1.04029 11.8815 1.49708C13.3211 1.95388 14.5991 2.81493 15.5631 3.97763C16.5271 5.14033 17.1365 6.55566 17.3187 8.055C17.3453 8.27728 17.2825 8.50101 17.1441 8.67697C17.0057 8.85292 16.803 8.96669 16.5807 8.99325C16.3585 9.0198 16.1347 8.95697 15.9588 8.81856C15.7828 8.68016 15.6691 8.47753 15.6425 8.25525C15.4605 6.75419 14.7352 5.37173 13.6035 4.36895C12.4718 3.36617 11.0121 2.8125 9.5 2.8125Z"
        fill={active ? '#28D02C' : 'currentColor'}
      />
    </svg>
  );
};

const Recasts: FC<CastActionProps> = memo((props) => {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return <RecastsWithCurrentUser {...props} />;
  }

  return <RecastsWithoutCurrentUser {...props} />;
});

Recasts.displayName = 'Recasts';

const RecastsWithCurrentUser: FC<CastActionProps> = memo((props) => {
  const currentUser = useCachedCurrentUser();

  return <RecastsContent {...props} currentUser={currentUser} />;
});

RecastsWithCurrentUser.displayName = 'RecastsWithCurrentUser';

const RecastsWithoutCurrentUser: FC<CastActionProps> = memo((props) => {
  return <RecastsContent {...props} currentUser={undefined} />;
});

RecastsWithoutCurrentUser.displayName = 'RecastsWithoutCurrentUser';

type RecastsContentProps = CastActionProps & {
  currentUser: ApiUser | undefined;
};

const RecastsContent: FC<RecastsContentProps> = memo(
  ({ cast, currentUser, isFocused, disabled, includeReason }) => {
    const [showBlockedAlert, setShowBlockedAlert] = useState(false);

    const recastCount = useMemo(() => {
      return cast.combinedRecastCount || cast.recasts.count;
    }, [cast.combinedRecastCount, cast.recasts.count]);

    const castReactionAction = useMemo(() => {
      return (
        <CastReactionAction
          icon={<RecastIcon active={!!cast.viewerContext?.recast} />}
          count={recastCount}
          isActive={cast.viewerContext?.recast}
          isFocused={!!isFocused}
          variant="green"
          disabled={!currentUser || disabled}
        />
      );
    }, [
      cast.viewerContext?.recast,
      currentUser,
      isFocused,
      recastCount,
      disabled,
    ]);

    if (cast.author.viewerContext?.blockedBy) {
      return (
        <>
          <CastReactionAction
            icon={<RecastIcon active={!!cast.viewerContext?.recast} />}
            count={recastCount}
            isActive={cast.viewerContext?.recast}
            isFocused={!!isFocused}
            variant="green"
            disabled={!currentUser || disabled}
            onClick={() => setShowBlockedAlert(true)}
          />
          {showBlockedAlert && (
            <AlertModal onOk={() => setShowBlockedAlert(false)}>
              <div className="pb-3 text-lg font-semibold">
                Unable to quote or recast
              </div>
              <div>
                {resolveUsername({
                  username: cast.author.username,
                  fid: cast.author.fid,
                })}{' '}
                has blocked you. You cannot quote or recast their casts.
              </div>
            </AlertModal>
          )}
        </>
      );
    }

    if (typeof currentUser !== 'undefined' && !disabled) {
      return (
        <RecastOptions cast={cast} includeReason={includeReason}>
          {castReactionAction}
        </RecastOptions>
      );
    }

    return castReactionAction;
  },
);

RecastsContent.displayName = 'RecastsContent';

export { Recasts };
