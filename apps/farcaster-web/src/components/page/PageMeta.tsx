import { Helmet } from '@dr.pogodin/react-helmet';
import { useUnseen } from 'farcaster-client-hooks';
import { FC, memo, useEffect } from 'react';

import { useStandaloneMode } from '~/contexts/StandaloneModeProvider';

export type PageMetaProps = {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: 'article' | 'website';
  twitterCard?: 'summary' | 'summary_large_image';
  author?: string;
};

const DEFAULT_DESCRIPTION = 'A decentralized social network';

const PageMeta: FC<PageMetaProps> = memo(
  ({
    title,
    description = DEFAULT_DESCRIPTION,
    canonical,
    ogImage,
    ogImageWidth,
    ogImageHeight,
    ogType = 'website',
    twitterCard = 'summary',
    author,
  }) => {
    const { notificationsCount } = useUnseen();
    const { setAppBadge, clearAppBadge } = useStandaloneMode();

    // Handle app badge
    useEffect(() => {
      if (notificationsCount !== 0) {
        setAppBadge({ count: notificationsCount });
      } else {
        clearAppBadge();
      }
    }, [clearAppBadge, notificationsCount, setAppBadge]);

    const faviconPath =
      typeof notificationsCount !== 'undefined' && notificationsCount !== 0
        ? '/favicon-notifications-v3.png'
        : '/favicon-v3.png';

    return (
      <Helmet>
        <title>{title}</title>
        <link rel="icon" href={faviconPath} />

        {/* Standard meta tags */}
        {description && <meta name="description" content={description} />}
        {author && <meta name="author" content={author} />}

        {/* Open Graph */}
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={title} />
        {description && (
          <meta property="og:description" content={description} />
        )}
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImageWidth && (
          <meta property="og:image:width" content={ogImageWidth.toString()} />
        )}
        {ogImageHeight && (
          <meta property="og:image:height" content={ogImageHeight.toString()} />
        )}
        <meta property="og:type" content={ogType} />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta property="og:site_name" content="Farcaster" />

        {/* Twitter Card */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={title} />
        {description && (
          <meta name="twitter:description" content={description} />
        )}
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <meta name="twitter:site" content="@farcaster_xyz" />

        {/* Farcaster-specific */}
        <meta name="farcaster:fname" content="@farcaster" />

        {/* Links */}
        {canonical && <link rel="canonical" href={canonical} />}
        <link
          rel="sitemap"
          href="https://farcaster.xyz/sitemap.xml"
          type="application/xml"
        />
      </Helmet>
    );
  },
);

PageMeta.displayName = 'PageMeta';

export { PageMeta };
