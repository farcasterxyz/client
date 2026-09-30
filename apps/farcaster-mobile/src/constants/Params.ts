export const loginChannelIdParam = 'channel-id';

export type LoginChannelIdSource =
  | 'search_params'
  | 'channel_id_param'
  | 'href_regex'
  | null;

/**
 * Extract sync channel id from login deep links. Prefer URLSearchParams; fall back
 * to parsing `href` for Android cases where the query is present but not exposed
 * on searchParams (redirect / intent quirks).
 */
const getLoginChannelIdFromUrlWithSource = (
  parsedUrl: URL,
): { channelId: string | null; source: LoginChannelIdSource } => {
  const fromParams = parsedUrl.searchParams.get(loginChannelIdParam);
  if (fromParams) {
    return { channelId: fromParams, source: 'search_params' };
  }
  const underscore = parsedUrl.searchParams.get('channel_id');
  if (underscore) {
    return { channelId: underscore, source: 'channel_id_param' };
  }
  const m = parsedUrl.href.match(/[?&#]channel(?:-|_)id=([^&#]+)/i);
  if (m?.[1]) {
    try {
      return {
        channelId: decodeURIComponent(m[1]),
        source: 'href_regex',
      };
    } catch {
      return { channelId: m[1], source: 'href_regex' };
    }
  }
  return { channelId: null, source: null };
};

const getLoginChannelIdFromUrl = (parsedUrl: URL): string | null => {
  return getLoginChannelIdFromUrlWithSource(parsedUrl).channelId;
};

export const utmMediumParam = 'utm_medium';
export const utmCampaignParam = 'utm_campaign';

export { getLoginChannelIdFromUrl, getLoginChannelIdFromUrlWithSource };
