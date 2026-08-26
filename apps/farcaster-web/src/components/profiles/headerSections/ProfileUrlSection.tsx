import { isPublicUrl, toHttpsUrl } from 'farcaster-client-data';
import {
  useDomainManifestState,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import { Link2Icon } from 'lucide-react';
import React from 'react';

import { FrameIconImage } from '~/components/images/FrameIconImage';
import { ExternalLink } from '~/components/links/ExternalLink';

type ProfileUrlSectionProps = {
  url: string;
};

function resolveFarcasterMiniAppId(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'farcaster.xyz') {
      return undefined;
    }

    const [, miniAppId] = parsedUrl.pathname.match(
      /^\/miniapps\/([^/?#]+)/,
    ) ?? [undefined, undefined];

    return miniAppId ? decodeURIComponent(miniAppId) : undefined;
  } catch {
    return undefined;
  }
}

const ProfileUrlSection: React.FC<ProfileUrlSectionProps> = ({ url }) => {
  const fullUrl = React.useMemo(() => {
    return toHttpsUrl(url);
  }, [url]);

  const isValidUrl = React.useMemo(() => {
    if (!url || url.trim() === '') {
      return false;
    }
    return isPublicUrl(fullUrl);
  }, [url, fullUrl]);

  const displayUrl = React.useMemo(() => {
    if (!isValidUrl) {
      return '';
    }
    try {
      const parsedUrl = new URL(fullUrl);
      const host = parsedUrl.host;
      const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
      const display = host + (path === '/' ? '' : path);

      if (display.length > 30) {
        return display.slice(0, 27) + '...';
      }
      return display;
    } catch {
      return '';
    }
  }, [fullUrl, isValidUrl]);

  const domain = React.useMemo(() => {
    if (!isValidUrl) {
      return undefined;
    }

    try {
      return new URL(fullUrl).hostname;
    } catch {
      return undefined;
    }
  }, [fullUrl, isValidUrl]);

  const miniAppId = React.useMemo(() => {
    if (!isValidUrl) {
      return undefined;
    }

    return resolveFarcasterMiniAppId(fullUrl);
  }, [fullUrl, isValidUrl]);

  const { data: domainManifestState } = useDomainManifestState({
    domain,
    enabled: typeof domain !== 'undefined' && typeof miniAppId === 'undefined',
  });

  const { data: miniAppFrame } = useNonSuspenseFrameDetails({
    id: miniAppId,
    enabled: typeof miniAppId !== 'undefined',
  });

  const miniApp = React.useMemo(() => {
    if (miniAppFrame) {
      return miniAppFrame;
    }

    const state = domainManifestState?.state;
    if (!state?.verified || !state.frameConfig) {
      return undefined;
    }

    return state.frameConfig;
  }, [domainManifestState?.state, miniAppFrame]);

  if (!isValidUrl) {
    return null;
  }

  const title = miniApp?.name ?? displayUrl;

  return (
    <ExternalLink
      href={fullUrl}
      title={title}
      className="-mt-0.5 flex flex-row items-center justify-start align-middle text-brand hover:underline"
    >
      {miniApp ? (
        <FrameIconImage imageUrl={miniApp.iconUrl} size={16} />
      ) : (
        <Link2Icon size={14} className="mt-0.5 text-brand" />
      )}
      <span className="ml-1 line-clamp-1 max-w-[300px] pt-0.5 text-sm text-brand">
        {title}
      </span>
    </ExternalLink>
  );
};

ProfileUrlSection.displayName = 'ProfileUrlSection';

export { ProfileUrlSection };
