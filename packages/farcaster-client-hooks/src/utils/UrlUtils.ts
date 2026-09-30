/**
 * Validates if a string is a valid URL
 * @param url - The string to validate
 * @returns true if the string is a valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObject = new URL(url);

    // Check if the protocol is http or https
    const validProtocols = ['http:', 'https:'];
    if (!validProtocols.includes(urlObject.protocol)) {
      return false;
    }

    // Check if there's a hostname
    if (!urlObject.hostname) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid URL with additional options
 * @param url - The string to validate
 * @param options - Validation options
 * @returns true if the string is a valid URL according to the options, false otherwise
 */
export function isValidUrlWithOptions(
  url: string,
  options: {
    allowedProtocols?: string[];
    requireTLD?: boolean;
    allowLocalhost?: boolean;
    allowIP?: boolean;
  } = {},
): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const {
    allowedProtocols = ['http:', 'https:'],
    requireTLD = false,
    allowLocalhost = true,
    allowIP = true,
  } = options;

  try {
    const urlObject = new URL(url);

    // Check protocol
    if (!allowedProtocols.includes(urlObject.protocol)) {
      return false;
    }

    // Check hostname
    if (!urlObject.hostname) {
      return false;
    }

    // Check for localhost
    if (
      !allowLocalhost &&
      (urlObject.hostname === 'localhost' || urlObject.hostname === '127.0.0.1')
    ) {
      return false;
    }

    // Check for IP addresses
    if (!allowIP) {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;
      if (
        ipv4Regex.test(urlObject.hostname) ||
        ipv6Regex.test(urlObject.hostname)
      ) {
        return false;
      }
    }

    // Check for TLD if required
    if (requireTLD) {
      const parts = urlObject.hostname.split('.');
      if (parts.length < 2 || parts[parts.length - 1].length < 2) {
        // Skip TLD check for localhost and IPs
        if (
          urlObject.hostname !== 'localhost' &&
          !/^(\d{1,3}\.){3}\d{1,3}$/.test(urlObject.hostname)
        ) {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by ensuring it has a protocol
 * @param url - The URL to normalize
 * @param defaultProtocol - The protocol to use if none is present (default: 'https://')
 * @returns The normalized URL or null if invalid
 */
export function normalizeUrl(
  url: string,
  defaultProtocol: string = 'https://',
): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let normalizedUrl = url.trim();

  // If no protocol is present, add the default
  if (!normalizedUrl.match(/^[a-zA-Z]+:\/\//)) {
    normalizedUrl = defaultProtocol + normalizedUrl;
  }

  // Validate the normalized URL
  if (isValidUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  return null;
}

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract the domain from
 * @returns The domain or null if invalid
 */
export function getDomain(url: string): string | null {
  try {
    const urlObject = new URL(url);
    return urlObject.hostname;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL is from a specific domain
 * @param url - The URL to check
 * @param domain - The domain to check against
 * @param includeSubdomains - Whether to include subdomains (default: true)
 * @returns true if the URL is from the specified domain
 */
export function isUrlFromDomain(
  url: string,
  domain: string,
  includeSubdomains: boolean = true,
): boolean {
  const urlDomain = getDomain(url);
  if (!urlDomain) {
    return false;
  }

  const normalizedDomain = domain.toLowerCase();
  const normalizedUrlDomain = urlDomain.toLowerCase();

  if (includeSubdomains) {
    return (
      normalizedUrlDomain === normalizedDomain ||
      normalizedUrlDomain.endsWith('.' + normalizedDomain)
    );
  }

  return normalizedUrlDomain === normalizedDomain;
}

/**
 * Sanitizes a URL by removing tracking parameters and fragments
 * @param url - The URL to sanitize
 * @param removeFragment - Whether to remove the fragment/hash (default: true)
 * @param removeTracking - Whether to remove common tracking parameters (default: true)
 * @returns The sanitized URL or null if invalid
 */
export function sanitizeUrl(
  url: string,
  removeFragment: boolean = true,
  removeTracking: boolean = true,
): string | null {
  if (!isValidUrl(url)) {
    return null;
  }

  try {
    const urlObject = new URL(url);

    // Remove fragment if requested
    if (removeFragment) {
      urlObject.hash = '';
    }

    // Remove common tracking parameters if requested
    if (removeTracking) {
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'ref',
        'source',
        'mc_eid',
        '_ga',
        '_gl',
        'yclid',
        'msclkid',
        'twclid',
        'li_fat_id',
        'igshid',
        's_cid',
      ];

      trackingParams.forEach((param) => {
        urlObject.searchParams.delete(param);
      });
    }

    return urlObject.toString();
  } catch {
    return null;
  }
}
