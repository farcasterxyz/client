import Head from 'next/head';
import { FC } from 'react';

type OGHeadMeta = {
  property: string;
  content: string;
};

type OGHeadProps = {
  author?: string;
  description: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  modifiedAt?: number;
  publishedAt?: number;
  title: string;
  type: 'article' | 'website';
  twitterCard?: 'summary' | 'summary_large_image';
  url?: string;
  extras?: OGHeadMeta[];
  siteName?: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string[];
};

// https://ahrefs.com/blog/open-graph-meta-tags/
// https://ogp.me/#type_article
// https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started
// https://www.everywheremarketer.com/blog/ultimate-guide-to-social-meta-tags-open-graph-and-twitter-cards
const OGHead: FC<OGHeadProps> = ({
  author,
  description,
  imageUrl,
  imageWidth = 512,
  imageHeight = 512,
  modifiedAt,
  publishedAt,
  title,
  type,
  twitterCard = 'summary',
  url,
  extras,
  siteName = 'Farcaster',
  ogTitle,
  ogDescription,
  keywords,
}) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords?.join(', ')} />
      <meta name="robots" content="index,follow" />

      <link
        rel="sitemap"
        type="application/xml"
        href="https://farcaster.xyz/sitemap.xml"
      ></link>
      <link rel="canonical" href={url || 'https://farcaster.xyz'}></link>
      <link rel="icon" type="image/png" href="/favicon-v3.png" />
      <link rel="apple-touch-icon" href="/og-logo-v3.png" />

      <meta property="og:locale" content="en_US" />
      <meta property="og:description" content={ogDescription ?? description} />
      {typeof imageUrl !== 'undefined' && (
        <>
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content={imageWidth.toString()} />
          <meta property="og:image:height" content={imageHeight.toString()} />
          <meta name="twitter:image" content={imageUrl} />
        </>
      )}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={ogTitle ?? title} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}

      {publishedAt && (
        <meta
          property="article:published_time"
          content={new Date(publishedAt).toISOString()}
        />
      )}
      {modifiedAt && (
        <meta
          property="article:modified_time"
          content={new Date(modifiedAt).toISOString()}
        />
      )}
      {author && <meta name="author" content={author}></meta>}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:description" content={ogDescription ?? description} />
      <meta name="twitter:site" content="@farcaster_xyz" />
      <meta name="twitter:title" content={ogTitle ?? title} />
      <meta name="farcaster:fname" content="@farcaster" />
      <meta
        name="ahrefs-site-verification"
        content="38f091146e9739ea28ca6ea0cfd077cfd3387a798283fd07c83e902c20c15379"
      />

      {extras &&
        extras.map(({ property, content }) => (
          <meta key={property} property={property} content={content} />
        ))}

      <style>{`body{margin:32px auto;padding:16px 28px;max-width:780px;font:15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111}ul{margin:0 0 12px;padding:0;list-style:none}li{display:inline;margin-right:12px}h1{margin:0 0 16px;font-size:24px}h2,h3{margin:20px 0 10px;font-size:17px}p{margin:0 0 12px}a{text-decoration:none;color:#0645ad}a:hover{text-decoration:underline}`}</style>
    </Head>
  );
};

OGHead.displayName = 'OGHead';

export { OGHead };
