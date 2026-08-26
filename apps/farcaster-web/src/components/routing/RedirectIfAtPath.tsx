import React, { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * When the URL path starts with /@ (e.g. /@username or /@username/hash),
 * redirects to the same path with the leading /@ removed. Renders children
 * otherwise. Place inside BrowserRouter so useLocation() is available;
 * runs before route matching so the rest of the app sees the canonical URL.
 */
export const RedirectIfAtPath: FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname, search, hash } = useLocation();

  if (pathname.startsWith('/@')) {
    const to = pathname.replace(/^\/@/, '/') + search + hash;
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
};
