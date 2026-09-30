import { ApiMiniAppQuality, ApiUserQuality } from 'farcaster-client-data';

const ensNameRegex = /^[a-z0-9]([a-z0-9-]){0,15}\.eth$/;

export const isEnsNameValid = (ensName: string) =>
  ensName.length > 0 && ensNameRegex.test(ensName);

type EnsValidationResult = { valid: true } | { valid: false; error: string };

export const validateEnsName = (ensName: string): EnsValidationResult => {
  if (!ensName.endsWith('.eth')) {
    return { valid: false, error: 'Name must end in .eth' };
  } else if (ensName.length > 20) {
    return { valid: false, error: 'Name must be 16 characters or less' };
  } else if (ensName.length <= 4) {
    return { valid: false, error: 'Name must not be empty' };
  } else if (ensName.startsWith('-')) {
    return { valid: false, error: 'Name must not start with a dash' };
  } else if (!ensNameRegex.test(ensName)) {
    return {
      valid: false,
      error: 'Name must contain only lowercase letters, numbers or dashes',
    };
  }

  return { valid: true };
};

export function getUserQualityBorderColor(quality: ApiUserQuality | undefined) {
  if (quality === 'high') {
    return '#00ff00';
  } else if (quality === 'neutral') {
    return '#00aaff';
  } else if (quality === 'low') {
    return '#ffd700';
  } else if (quality === 'spam') {
    return '#ff7700';
  } else if (quality === 'harmful') {
    return '#ff0000';
  } else if (quality === 'unranked') {
    return '#777777';
  } else if (quality === 'automated') {
    return '#dda0dd';
  }
}

export function getMiniAppQualityBorderColor(quality: ApiMiniAppQuality) {
  if (quality === 'neutral') {
    return '#00aaff';
  } else if (quality === 'harmful') {
    return '#ff0000';
  }
}

export function getEarlyWalletAdopterBorderColor() {
  return '#7C65C1';
}

export function resolveUsername({
  username,
  fid,
}: {
  username?: string | undefined;
  fid?: number | undefined;
}): string {
  if (username) {
    return `@${username}`;
  }

  if (fid) {
    return `!${fid}`;
  }

  // Unlikely that we ever hit an undefined FID - but
  // React Navigation common screens flow dicate we allow it
  // on the types. Returning empty string will be fine.
  return '';
}

export function resolveUsernameShort(
  {
    username,
    fid,
  }: {
    username?: string | undefined;
    fid?: number | undefined;
  },
  viewerFid?: number,
): string {
  if (fid !== undefined && viewerFid !== undefined && viewerFid === fid) {
    return `you`;
  }

  if (username) {
    return `${username}`;
  }

  if (fid) {
    return `!${fid}`;
  }

  // Unlikely that we ever hit an undefined FID - but
  // React Navigation common screens flow dicate we allow it
  // on the types. Returning empty string will be fine.
  return '';
}

export function resolveDisplayName({
  displayName,
  username,
  fid,
}: {
  displayName?: string | undefined;
  username?: string | undefined;
  fid?: number | undefined;
}): string {
  if (displayName) {
    return displayName;
  }

  return resolveUsername({ username, fid });
}
