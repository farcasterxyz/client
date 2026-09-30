const useCanGoBack = () => {
  // https://caniuse.com/?search=canGoBack
  const navigationCanGoBack = (
    window as unknown as { navigation?: { canGoBack: undefined | boolean } }
  ).navigation?.canGoBack;

  if (navigationCanGoBack === undefined) {
    return true;
  }

  return navigationCanGoBack;
};

export { useCanGoBack };
