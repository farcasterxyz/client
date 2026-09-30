import { ApiDirectCastUrlEmbedDisplayMode } from 'farcaster-client-data';

const storageKeyForMessage = (messageId: string) =>
  `dc-hide-url-embed:${messageId}`;

const displayModeStorageKeyForMessage = (messageId: string) =>
  `dc-url-embed-display-mode:${messageId}`;

const isDirectCastUrlEmbedHidden = (messageId: string): boolean => {
  try {
    return sessionStorage.getItem(storageKeyForMessage(messageId)) === '1';
  } catch {
    return false;
  }
};

const hideDirectCastUrlEmbedForViewer = (messageId: string): void => {
  try {
    sessionStorage.setItem(storageKeyForMessage(messageId), '1');
  } catch {
    // ignore quota / private mode
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dc-url-embed-hidden', { detail: { messageId } }),
    );
  }
};

const getDirectCastUrlEmbedDisplayMode = (
  messageId: string,
): ApiDirectCastUrlEmbedDisplayMode | undefined => {
  try {
    const v = sessionStorage.getItem(
      displayModeStorageKeyForMessage(messageId),
    );
    if (v === 'compact' || v === 'large') {
      return v;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const setDirectCastUrlEmbedDisplayMode = (
  messageId: string,
  mode: ApiDirectCastUrlEmbedDisplayMode,
): void => {
  try {
    sessionStorage.setItem(displayModeStorageKeyForMessage(messageId), mode);
  } catch {
    // ignore quota / private mode
  }
};

export {
  getDirectCastUrlEmbedDisplayMode,
  hideDirectCastUrlEmbedForViewer,
  isDirectCastUrlEmbedHidden,
  setDirectCastUrlEmbedDisplayMode,
};
