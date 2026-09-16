import { ApiAuthSession } from 'farcaster-client-data';

function extractOS(ua: string): string | undefined {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua) && !/Android/.test(ua)) return 'Linux';

  const androidMatch = ua.match(/Android\s*([\d.]+)?/);
  if (androidMatch) {
    // Try to extract device model: "Android 14; Pixel 8"
    const modelMatch = ua.match(/Android\s*[\d.]*;\s*([^);]+)/);
    if (modelMatch) {
      const model = modelMatch[1]
        .replace(/Build\/.*/, '')
        .replace(/\s+$/, '')
        .trim();
      if (model && model.length > 0 && model.length <= 20) return model;
    }
    return 'Android';
  }

  return undefined;
}

function extractBrowser(ua: string): string | undefined {
  // Order matters: check more specific before generic
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera\//.test(ua)) return 'Opera';
  if (/Brave/.test(ua)) return 'Brave';
  if (/Vivaldi/.test(ua)) return 'Vivaldi';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  return undefined;
}

export function parseUserAgent(userAgent: string | undefined): string {
  if (!userAgent || userAgent.trim() === '') {
    return 'Unknown device';
  }

  // Warpcast app client
  if (userAgent.includes('Warpcast')) {
    if (
      userAgent.includes('iOS') ||
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    ) {
      return 'Warpcast on iPhone';
    }
    if (userAgent.includes('Android')) {
      return 'Warpcast on Android';
    }
    return 'Warpcast';
  }

  // Farcaster native app UA: "Farcaster/519 CFNetwork/..." or "Farcaster/123 Dalvik/..."
  if (/^Farcaster\//.test(userAgent)) {
    if (/CFNetwork|Darwin/.test(userAgent)) {
      return 'Farcaster on iOS';
    }
    if (/Dalvik|Android/.test(userAgent)) {
      return 'Farcaster on Android';
    }
    return 'Farcaster app';
  }

  // CFNetwork without Farcaster prefix (generic iOS app)
  if (/CFNetwork|Darwin/.test(userAgent) && !/Mozilla/.test(userAgent)) {
    return 'iOS app';
  }

  // Dalvik without Farcaster prefix (generic Android app)
  if (/Dalvik/.test(userAgent)) {
    return 'Android app';
  }

  // OkHttp (Android HTTP client used by native Android apps)
  if (/okhttp\//.test(userAgent)) {
    return 'Android app';
  }

  const os = extractOS(userAgent);
  const browser = extractBrowser(userAgent);

  // Both OS and browser detected
  if (browser && os) {
    return `${browser} on ${os}`;
  }

  // Only OS
  if (os) {
    if (/iPhone|iPad/.test(os)) return `${os} (Safari)`;
    return os;
  }

  // Only browser
  if (browser) {
    return browser;
  }

  // Fallback: generic mobile/desktop detection
  if (/Mobile|mobile/.test(userAgent)) return 'Mobile browser';
  if (/Mozilla|Gecko/.test(userAgent)) return 'Web browser';

  // Truncate any unknown agents to a short label
  if (userAgent.length > 25) {
    return userAgent.substring(0, 22) + '...';
  }

  return userAgent;
}

export function formatSessionDate(timestamp: number | undefined): string {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const COUNTRY_FALLBACK: Record<string, string> = {
  AF: 'Afghanistan',
  AL: 'Albania',
  DZ: 'Algeria',
  AR: 'Argentina',
  AU: 'Australia',
  AT: 'Austria',
  AZ: 'Azerbaijan',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BR: 'Brazil',
  BG: 'Bulgaria',
  CA: 'Canada',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  HR: 'Croatia',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  EG: 'Egypt',
  FI: 'Finland',
  FR: 'France',
  DE: 'Germany',
  GH: 'Ghana',
  GR: 'Greece',
  HK: 'Hong Kong',
  HU: 'Hungary',
  IN: 'India',
  ID: 'Indonesia',
  IR: 'Iran',
  IQ: 'Iraq',
  IE: 'Ireland',
  IL: 'Israel',
  IT: 'Italy',
  JP: 'Japan',
  JO: 'Jordan',
  KZ: 'Kazakhstan',
  KE: 'Kenya',
  KR: 'South Korea',
  KW: 'Kuwait',
  LB: 'Lebanon',
  MY: 'Malaysia',
  MX: 'Mexico',
  MA: 'Morocco',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  NG: 'Nigeria',
  NO: 'Norway',
  PK: 'Pakistan',
  PE: 'Peru',
  PH: 'Philippines',
  PL: 'Poland',
  PT: 'Portugal',
  QA: 'Qatar',
  RO: 'Romania',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  ZA: 'South Africa',
  ES: 'Spain',
  SE: 'Sweden',
  CH: 'Switzerland',
  TW: 'Taiwan',
  TH: 'Thailand',
  TR: 'Turkey',
  UA: 'Ukraine',
  AE: 'United Arab Emirates',
  GB: 'United Kingdom',
  US: 'United States',
  VN: 'Vietnam',
};

export function formatCountryCode(
  code: string | undefined,
): string | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  try {
    if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const name = regionNames.of(upper);
      if (name && name !== upper) return name;
    }
  } catch {
    // fall through to static map
  }
  return COUNTRY_FALLBACK[upper] ?? code;
}

export function extractAppVersion(
  userAgent: string | undefined,
): string | undefined {
  if (!userAgent) return undefined;
  const match = userAgent.match(/^(?:Farcaster|Warpcast)\/([\d.]+)/);
  return match ? `v${match[1]}` : undefined;
}

export function sortSessions(sessions: ApiAuthSession[]): ApiAuthSession[] {
  return [...sessions].sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;

    const aTime = a.createdAt ?? a.expiresAt;
    const bTime = b.createdAt ?? b.expiresAt;
    return bTime - aTime;
  });
}
