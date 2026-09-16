import { log } from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const SITEMAP_HOST = 'farcaster.xyz';
const MAX_URLS_PER_SITEMAP = 50_000;
const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;
const FNAME_PATTERN = /^[0-9a-z][0-9a-z-]{0,15}(\.eth|\.base\.eth)?$/;
const CAST_HASH_PREFIX_PATTERN = /^0x[0-9a-f]{8}$/;

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const publicDirectory = path.join(appDirectory, 'public');
const sitemapDirectory = path.join(publicDirectory, 'sitemaps');
const sitemapIndexPath = path.join(sitemapDirectory, 'sitemap_index.xml');

const readXml = (filePath) => fs.readFileSync(filePath, 'utf8');
const extractLocations = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const fail = (message) => {
  throw new Error(`Invalid sitemap: ${message}`);
};

const assertUnique = (values, description) => {
  const seen = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      fail(`duplicate ${description}: ${value}`);
    }
    seen.add(value);
  }
};

const sitemapIndexXml = readXml(sitemapIndexPath);
if (!sitemapIndexXml.includes('<sitemapindex')) {
  fail('sitemap_index.xml must contain a sitemap index');
}

const childSitemapLocations = extractLocations(sitemapIndexXml);
if (childSitemapLocations.length === 0) {
  fail('sitemap_index.xml does not reference any child sitemaps');
}
assertUnique(childSitemapLocations, 'child sitemap URL');

const allPageLocations = [];
const referencedChildFiles = new Set();

for (const location of childSitemapLocations) {
  const url = new URL(location);
  if (url.protocol !== 'https:' || url.hostname !== SITEMAP_HOST) {
    fail(`child sitemap must use https://${SITEMAP_HOST}: ${location}`);
  }
  if (!url.pathname.startsWith('/sitemaps/')) {
    fail(`child sitemap must be under /sitemaps/: ${location}`);
  }

  const childFileName = path.basename(url.pathname);
  if (url.pathname !== `/sitemaps/${childFileName}`) {
    fail(`child sitemap URL must not contain subdirectories: ${location}`);
  }

  const childFilePath = path.join(sitemapDirectory, childFileName);
  if (!fs.existsSync(childFilePath)) {
    fail(`referenced child sitemap does not exist: ${childFileName}`);
  }
  if (fs.statSync(childFilePath).size > MAX_SITEMAP_BYTES) {
    fail(`child sitemap exceeds 50 MiB: ${childFileName}`);
  }

  referencedChildFiles.add(childFileName);
  const childXml = readXml(childFilePath);
  if (!childXml.includes('<urlset')) {
    fail(`child sitemap must contain a URL set: ${childFileName}`);
  }

  const pageLocations = extractLocations(childXml);
  if (pageLocations.length === 0) {
    fail(`child sitemap is empty: ${childFileName}`);
  }
  if (pageLocations.length > MAX_URLS_PER_SITEMAP) {
    fail(`child sitemap exceeds 50,000 URLs: ${childFileName}`);
  }

  for (const pageLocation of pageLocations) {
    const pageUrl = new URL(pageLocation);
    if (pageUrl.protocol !== 'https:' || pageUrl.hostname !== SITEMAP_HOST) {
      fail(`page URL must use https://${SITEMAP_HOST}: ${pageLocation}`);
    }

    const pagePathSegments = pageUrl.pathname.split('/').filter(Boolean);
    const isUserSitemap = /^users-\d+\.xml$/.test(childFileName);
    const isCastSitemap = /^casts-\d+\.xml$/.test(childFileName);
    const [username, castHashPrefix] = pagePathSegments;

    if (
      isUserSitemap &&
      (pagePathSegments.length !== 1 || pageUrl.pathname !== `/${username}`)
    ) {
      fail(`invalid user URL path in ${childFileName}: ${pageLocation}`);
    }
    if (
      isCastSitemap &&
      (pagePathSegments.length !== 2 ||
        pageUrl.pathname !== `/${username}/${castHashPrefix}` ||
        !CAST_HASH_PREFIX_PATTERN.test(castHashPrefix))
    ) {
      fail(`invalid cast URL path in ${childFileName}: ${pageLocation}`);
    }

    if (isUserSitemap || isCastSitemap) {
      if (!username || !FNAME_PATTERN.test(username)) {
        fail(`invalid username in ${childFileName}: ${pageLocation}`);
      }
    }

    allPageLocations.push(pageLocation);
  }
}

const childFilesOnDisk = fs
  .readdirSync(sitemapDirectory)
  .filter(
    (fileName) => fileName.endsWith('.xml') && fileName !== 'sitemap_index.xml',
  );
for (const childFileName of childFilesOnDisk) {
  if (!referencedChildFiles.has(childFileName)) {
    fail(`unreferenced child sitemap: ${childFileName}`);
  }
}

assertUnique(allPageLocations, 'page URL');
log(
  `Validated ${childSitemapLocations.length} child sitemaps and ${allPageLocations.length.toLocaleString('en-US')} unique URLs.`,
);
