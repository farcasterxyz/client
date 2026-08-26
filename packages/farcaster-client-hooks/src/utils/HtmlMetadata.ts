type HtmlMetadataInit = {
  titleTag?: string;
  faviconUrlString?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrlString?: string;
  ogPublishDateString?: string;
  articlePublishDateString?: string;
  ogModifiedDateString?: string;
  articleModifiedDateString?: string;
};

const TITLE_REGEX = /<\s*title[^>]*>(.*?)<\s*\/title[^>]*>/is;
const FAVICON_REGEX =
  /<\s*link[^>]*rel\s*=\s*"\s*(?:shortcut\s+)?icon\s*"[^>]*>/is;
const FAVICON_URL_REGEX = /href\s*=\s*"([^"]*)"/i;
const META_DESCRIPTION_REGEX =
  /<\s*meta[^>]*name\s*=\s*"\s*description[^"]*"[^>]*>/is;
const META_PROPERTY_REGEX = /<\s*meta[^>]*property\s*=\s*"\s*([^"]+?)"[^>]*>/gi;
const META_CONTENT_REGEX = /content\s*=\s*"([^"]*?)"/i;
const HTML_ENTITY_REGEX = /&(#x?[0-9a-f]+|[a-z]+);?/gi;

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

const decodeHtmlEntities = (value: string): string => {
  return value.replace(
    HTML_ENTITY_REGEX,
    (_, entity: string): string => decodeHtmlEntity(entity) ?? `&${entity};`,
  );
};

const decodeHtmlEntity = (entity: string): string | undefined => {
  const lower = entity.toLowerCase();
  if (lower in HTML_ENTITY_MAP) {
    return HTML_ENTITY_MAP[lower];
  }

  if (lower.startsWith('#x')) {
    const hex = lower.slice(2);
    const codePoint = Number.parseInt(hex, 16);
    if (!Number.isNaN(codePoint)) {
      return String.fromCodePoint(codePoint);
    }
  } else if (lower.startsWith('#')) {
    const decimal = lower.slice(1);
    const codePoint = Number.parseInt(decimal, 10);
    if (!Number.isNaN(codePoint)) {
      return String.fromCodePoint(codePoint);
    }
  }

  return undefined;
};

class HtmlMetadata {
  titleTag?: string;
  faviconUrlString?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrlString?: string;
  ogPublishDateString?: string;
  articlePublishDateString?: string;
  ogModifiedDateString?: string;
  articleModifiedDateString?: string;

  constructor(init: HtmlMetadataInit = {}) {
    this.titleTag = init.titleTag;
    this.faviconUrlString = init.faviconUrlString;
    this.description = init.description;
    this.ogTitle = init.ogTitle;
    this.ogDescription = init.ogDescription;
    this.ogImageUrlString = init.ogImageUrlString;
    this.ogPublishDateString = init.ogPublishDateString;
    this.articlePublishDateString = init.articlePublishDateString;
    this.ogModifiedDateString = init.ogModifiedDateString;
    this.articleModifiedDateString = init.articleModifiedDateString;
  }

  static construct(rawHtml: string): HtmlMetadata {
    const metaProperties = parseMetaProperties(rawHtml);
    return new HtmlMetadata({
      titleTag: parseTitle(rawHtml),
      faviconUrlString: parseFaviconUrl(rawHtml),
      description: parseDescription(rawHtml),
      ogTitle: metaProperties.get('og:title'),
      ogDescription: metaProperties.get('og:description'),
      ogImageUrlString:
        metaProperties.get('og:image') ?? metaProperties.get('og:image:url'),
      ogPublishDateString: metaProperties.get('og:published_time'),
      articlePublishDateString: metaProperties.get('article:published_time'),
      ogModifiedDateString: metaProperties.get('og:modified_time'),
      articleModifiedDateString: metaProperties.get('article:modified_time'),
    });
  }
}

const parseTitle = (rawHtml: string): string | undefined => {
  const match = TITLE_REGEX.exec(rawHtml);
  if (!match || typeof match[1] !== 'string') {
    return undefined;
  }

  return decodeHtmlEntities(match[1]).trim();
};

const parseFaviconUrl = (rawHtml: string): string | undefined => {
  const linkMatch = FAVICON_REGEX.exec(rawHtml);
  if (!linkMatch) {
    return undefined;
  }

  const hrefMatch = FAVICON_URL_REGEX.exec(linkMatch[0]);
  if (!hrefMatch || typeof hrefMatch[1] !== 'string') {
    return undefined;
  }

  return decodeHtmlEntities(hrefMatch[1]).trim();
};

const parseDescription = (rawHtml: string): string | undefined => {
  const metaMatch = META_DESCRIPTION_REGEX.exec(rawHtml);
  if (!metaMatch) {
    return undefined;
  }

  const contentMatch = META_CONTENT_REGEX.exec(metaMatch[0]);
  if (!contentMatch || typeof contentMatch[1] !== 'string') {
    return undefined;
  }

  return decodeHtmlEntities(contentMatch[1]).trim();
};

const parseMetaProperties = (rawHtml: string): Map<string, string> => {
  const result = new Map<string, string>();

  let match: RegExpExecArray | null;
  while ((match = META_PROPERTY_REGEX.exec(rawHtml)) !== null) {
    const property = match[1];
    if (!property || result.has(property)) {
      continue;
    }

    const fullTag = match[0];
    const contentMatch = META_CONTENT_REGEX.exec(fullTag);
    if (!contentMatch || typeof contentMatch[1] !== 'string') {
      continue;
    }

    result.set(property, decodeHtmlEntities(contentMatch[1]).trim());
  }

  return result;
};

export { decodeHtmlEntities, HtmlMetadata, type HtmlMetadataInit };
