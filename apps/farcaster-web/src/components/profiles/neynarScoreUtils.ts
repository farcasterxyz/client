import { ApiUserProfile } from 'farcaster-client-data';

type NeynarScoreInfo = {
  effectiveScore?: number;
  originalScore?: number;
  overridden: boolean;
  overrideScore?: number;
  overriddenByFid?: number;
  overrideReason?: string;
};

type UserProfileWithNeynarScoreInfo = ApiUserProfile & {
  neynarScoreInfo?: NeynarScoreInfo;
};

const formatNeynarScore = (score?: number) => {
  if (typeof score !== 'number') {
    return 'n/a';
  }

  return score.toFixed(2).replace(/\.?0+$/, '');
};

const getDisplayedNeynarScore = (
  userProfile: UserProfileWithNeynarScoreInfo,
) => {
  return (
    userProfile.neynarScoreInfo?.effectiveScore ??
    userProfile.neynarScoreInfo?.overrideScore ??
    userProfile.user.neynarScore
  );
};

const getNeynarScoreBorderColor = (
  userProfile: UserProfileWithNeynarScoreInfo,
) => {
  if (userProfile.neynarScoreInfo?.overridden) {
    return '#d97706';
  }

  return typeof getDisplayedNeynarScore(userProfile) === 'number'
    ? '#0ea5e9'
    : '#777777';
};

export {
  formatNeynarScore,
  getDisplayedNeynarScore,
  getNeynarScoreBorderColor,
  type NeynarScoreInfo,
  type UserProfileWithNeynarScoreInfo,
};
