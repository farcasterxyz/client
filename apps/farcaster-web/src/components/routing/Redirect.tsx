import React, { FC } from 'react';

interface RedirectProps {
  url: string;
  path?: string;
}

const containsDynamicPath = (path: string) => {
  return path.includes('/:');
};

const isDynamicPathPart = (pathPart: string) => {
  return pathPart.startsWith(':');
};

function getRedirectUrl(url: string, path?: string) {
  if (path && containsDynamicPath(path)) {
    const location = window.location;
    const currentPath = location.pathname;
    const pathParts = path.split('/');
    const currentPathParts = currentPath.split('/');
    const map: Record<string, string> = {};
    for (let i = 0; i < pathParts.length; i++) {
      if (isDynamicPathPart(pathParts[i])) {
        map[pathParts[i]] = currentPathParts[i];
      }
    }
    let newUrl = url;
    for (const [key, value] of Object.entries(map)) {
      newUrl = newUrl.replace(key, value);
    }
    const searchParams = window.location.search;
    return `${newUrl}${searchParams}`;
  }
  // Preserve the search params from the current location
  const searchParams = window.location.search;
  const redirectUrl = `${url}${searchParams}`;
  return redirectUrl;
}

export const Redirect: FC<RedirectProps> = ({ url, path }) => {
  React.useEffect(() => {
    const redirectUrl = getRedirectUrl(url, path);
    window.location.replace(redirectUrl);
  }, [url, path]);

  return null;
};
