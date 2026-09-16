export function isAndroid(): boolean {
  return (
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
  );
}

export function isSmallIOS(): boolean {
  return (
    typeof navigator !== 'undefined' && /iPhone|iPod/.test(navigator.userAgent)
  );
}

export function isLargeIOS(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
}

export function isSafari(): boolean {
  return (
    !!navigator.vendor &&
    navigator.vendor.indexOf('Apple') > -1 &&
    !!navigator.userAgent &&
    navigator.userAgent.indexOf('CriOS') === -1 &&
    navigator.userAgent.indexOf('FxiOS') === -1
  );
}

const INAPP_BROWSER_USER_AGENTS = [
  'FBAN',
  'FBAV',
  'Instagram',
  'Line',
  'Twitter',
  'Snapchat',
  'Telegram',
  'Viber',
  'WeChat',
  'WhatsApp',
  'YandexBrowser',
  'Zalo',
  'Zomato',
  'WebView',
];

export function isInAppBrowser(): boolean {
  return INAPP_BROWSER_USER_AGENTS.some((userAgent) =>
    navigator.userAgent.includes(userAgent),
  );
}

export function isIOS(): boolean {
  return isSmallIOS() || isLargeIOS();
}

export function isMobile(): boolean {
  return isAndroid() || isIOS();
}

export function isIOSSystemBrowser(): boolean {
  return isIOS() && !isInAppBrowser();
}
