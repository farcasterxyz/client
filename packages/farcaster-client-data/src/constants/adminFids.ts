export const NEYNAR_TEAM_FIDS = [] as const;

export const NEYNAR_SCORE_OVERRIDE_FIDS = [];

export const canOverrideNeynarScore = (fid: number) =>
  (NEYNAR_SCORE_OVERRIDE_FIDS as readonly number[]).includes(fid);

export const ADMIN_FIDS = new Set<number>([...NEYNAR_TEAM_FIDS]);
