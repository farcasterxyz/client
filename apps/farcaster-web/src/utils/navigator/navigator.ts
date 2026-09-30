import { StandaloneAppNavigator } from '~/types';

type ExtendedWindow = typeof window & {
  navigator: StandaloneAppNavigator;
};

const extendedWindow = window as ExtendedWindow;

const renderedAsStandaloneWindow = () => {
  return (
    extendedWindow &&
    extendedWindow.navigator &&
    // The mode is set to 'standalone' when Chrome engine renders the outer window
    extendedWindow.matchMedia('(display-mode: standalone)').matches
  );
};

const setAppBadge = ({ count }: { count: number }) => {
  if (
    renderedAsStandaloneWindow() &&
    typeof extendedWindow.navigator.setAppBadge === 'function'
  ) {
    extendedWindow.navigator.setAppBadge(count);
  }
};

const resetAppBadge = () => {
  if (
    renderedAsStandaloneWindow() &&
    typeof extendedWindow.navigator.clearAppBadge === 'function'
  ) {
    extendedWindow.navigator.clearAppBadge();
  }
};

export { renderedAsStandaloneWindow, resetAppBadge, setAppBadge };
