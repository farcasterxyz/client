import { describe, expect, it } from 'vitest';

import { HtmlMetadata } from '../HtmlMetadata';

describe('HtmlMetadata', () => {
  it('returns empty metadata for empty body', () => {
    expect(HtmlMetadata.construct('')).toEqual(new HtmlMetadata());
  });

  it('parses title tags', () => {
    const cases: Record<string, string> = {
      '<title>Simple</title>': 'Simple',
      '\nhello\n\t<title>Two Lines</title>\n\nblahhhh': 'Two Lines',
      '<title>Title1</title><title>Title2</title>': 'Title1',
      ' \n\t <  title  \n>Oddly spaced<  /title  >': 'Oddly spaced',
    };

    Object.entries(cases).forEach(([input, expected]) => {
      expect(HtmlMetadata.construct(input)).toEqual(
        new HtmlMetadata({ titleTag: expected }),
      );
    });
  });

  it('parses favicon url string', () => {
    const cases: Record<string, string | undefined> = {
      '<link rel="icon" href="test.ico"></link>': 'test.ico',
      '<  link rel="  shortcut  icon "   href="spacedddd"  />': 'spacedddd',
      '<link rel="apple-touch-icon" href="incorrect tag">': undefined,
      '<link rel="icon" href="first">\n<link rel="icon" href="second">\n<link rel="icon" href="third">':
        'first',
      '<link href="href first" rel="icon">': 'href first',
    };

    Object.entries(cases).forEach(([input, expected]) => {
      expect(HtmlMetadata.construct(input)).toEqual(
        new HtmlMetadata({ faviconUrlString: expected }),
      );
    });
  });

  it('parses meta description', () => {
    const cases: Record<string, string | undefined> = {
      '<meta name="description" content="DescriptionText" />':
        'DescriptionText',
      '<  meta  name  =  "description" \n\n\n content="Spaced Description" />':
        'Spaced Description',
      '<meta name="description" content="DescriptionText" /><meta name="description" content="Repeat" />':
        'DescriptionText',
      '<meta property="description" content="DescriptionText" />': undefined,
    };

    Object.entries(cases).forEach(([input, expected]) => {
      expect(HtmlMetadata.construct(input)).toEqual(
        new HtmlMetadata({ description: expected }),
      );
    });
  });

  it('parses Open Graph title', () => {
    const cases: Record<string, string | undefined> = {
      '<meta property="og:title" content="TestTitle">': 'TestTitle',
      '<meta content="FlippedTitle" property="og:title">': 'FlippedTitle',
      '<meta garbage1\t=\ngarbage property="og:title" garbage2 = garbage content="TitleWithGarbage" garbage3=garbage kafdjadk>':
        'TitleWithGarbage',
      '<meta property="og:title" content="Title"><meta property="og:title" content="Repeat">':
        'Title',
    };

    Object.entries(cases).forEach(([input, expected]) => {
      expect(HtmlMetadata.construct(input)).toEqual(
        new HtmlMetadata({ ogTitle: expected }),
      );
    });
  });

  it('parses combined elements', () => {
    const input = `
        <title>TitleString</title>
        <link rel="icon" href="FaviconString" />
        <meta name="description" content="DescriptionString" />
        <meta property="og:title" content="OpengraphTitle" />
        <meta property="og:description" content="OpengraphDescription" />
        <meta property="og:image" content="ImageURL" />
        <meta property="og:image:url" content="FallbackImageURL" />
        <meta property="og:published_time" content="PublishedDate" />
        <meta property="article:published_time" content="ArticlePublishedDate" />
        <meta property="og:modified_time" content="ModifiedDate" />
        <meta property="article:modified_time" content="ArticleModifiedDate" />
      `;

    expect(HtmlMetadata.construct(input)).toEqual(
      new HtmlMetadata({
        titleTag: 'TitleString',
        faviconUrlString: 'FaviconString',
        description: 'DescriptionString',
        ogTitle: 'OpengraphTitle',
        ogDescription: 'OpengraphDescription',
        ogImageUrlString: 'ImageURL',
        ogPublishDateString: 'PublishedDate',
        articlePublishDateString: 'ArticlePublishedDate',
        ogModifiedDateString: 'ModifiedDate',
        articleModifiedDateString: 'ArticleModifiedDate',
      }),
    );
  });

  it('parses fallback image', () => {
    const input = `
        <title>TitleString</title>
        <link rel="icon" href="FaviconString" />
        <meta name="description" content="DescriptionString" />
        <meta property="og:image:url" content="FallbackImageURL" />
      `;

    expect(HtmlMetadata.construct(input)).toEqual(
      new HtmlMetadata({
        titleTag: 'TitleString',
        faviconUrlString: 'FaviconString',
        description: 'DescriptionString',
        ogImageUrlString: 'FallbackImageURL',
      }),
    );
  });

  it('parses Open Graph metadata from link text', () => {
    const input =
      '<meta property="og:title" content="Farcaster">' +
      '<meta property="og:image" content="https://farcaster.xyz/og.png">';

    const metadata = HtmlMetadata.construct(input);
    expect(metadata.ogTitle).toBe('Farcaster');
    expect(metadata.ogImageUrlString).toBe('https://farcaster.xyz/og.png');
  });
});
