import Head from 'next/head';
import { FC } from 'react';

// Basic HTML entity escaping
const sanitizeString = (str: string | undefined): string | undefined => {
  if (str === undefined) {
    return undefined;
  }
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

type SchemaOrgHeadProps = {
  name: string;
  description: string;
  applicationCategory?: string;
  keywords?: string[];
  authorName?: string;
  imageUrl?: string;
  url: string;
  screenshotUrl?: string;
  authorProfileUrl?: string;
};

const SoftwareApplicationSchemaHead: FC<SchemaOrgHeadProps> = ({
  name,
  description,
  applicationCategory,
  keywords,
  authorName,
  imageUrl,
  url,
  screenshotUrl,
  authorProfileUrl,
}) => {
  // Sanitize potentially user-influenced string values
  const sanitizedName = sanitizeString(name);
  const sanitizedDescription = sanitizeString(description);
  const sanitizedCategory = sanitizeString(applicationCategory);
  const sanitizedAuthorName = sanitizeString(authorName);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: sanitizedName,
    description: sanitizedDescription,
    applicationCategory: sanitizedCategory,
    applicationSuite: 'Farcaster Mini Apps',
    keywords: keywords?.join(', '),
    operatingSystem: 'Web', // Generic OS for web-based apps
    author: {
      '@type': 'Person',
      name: sanitizedAuthorName,
      sameAs: authorProfileUrl,
      ...(!authorProfileUrl && { sameAs: undefined }),
    },
    image: imageUrl, // URLs are typically safe, but could be validated further if needed
    url: url,
    screenshot: screenshotUrl,
    // Clean up undefined properties before stringifying
    ...(!sanitizedCategory && { applicationCategory: undefined }),
    ...(!keywords && { keywords: undefined }),
    ...(!imageUrl && { image: undefined }),
    ...(!screenshotUrl && { screenshot: undefined }),
    ...(!authorProfileUrl && !authorName && { author: undefined }),
  };

  // Remove keys with undefined values OR handle empty keywords
  if (!keywords || keywords.length === 0) {
    delete schemaData.keywords;
  }
  if (schemaData.author && schemaData.author.sameAs === undefined) {
    delete schemaData.author.sameAs;
  }
  Object.keys(schemaData).forEach(
    (key) =>
      schemaData[key as keyof typeof schemaData] === undefined &&
      delete schemaData[key as keyof typeof schemaData],
  );

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </Head>
  );
};

SoftwareApplicationSchemaHead.displayName = 'SoftwareApplicationSchemaHead';

export { SoftwareApplicationSchemaHead };
