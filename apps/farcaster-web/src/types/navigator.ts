export type StandaloneAppNavigator = Navigator & {
  renderedAsStandaloneApp: () => boolean;
  setAppBadge?: (count: number) => void;
  clearAppBadge?: () => void;
};
