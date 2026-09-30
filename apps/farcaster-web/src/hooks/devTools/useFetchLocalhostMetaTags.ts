import { useCallback } from 'react';

const buildHtmlMetaTagsFetcher = (url: string) => async () => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch html meta tags');
  }

  const html = await response.text();
  return html;
};

export const useFetchLocalhostMetaTags = () => {
  return useCallback(async ({ url }: { url: string | undefined }) => {
    if (!url) {
      return null;
    }

    const result = await buildHtmlMetaTagsFetcher(url)();

    if (!result) {
      return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(result, 'text/html');

    const metaTags = doc.querySelectorAll('meta');
    return Array.from(metaTags).reduce(
      (acc, meta) => {
        const name = meta.getAttribute('name');
        const property = meta.getAttribute('property');
        const content = meta.getAttribute('content');
        const key = name || property;
        if (key && content !== null) {
          if (acc[key]) {
            if (Array.isArray(acc[key])) {
              acc[key] = [...(acc[key] as string[]), content];
            } else {
              acc[key] = [acc[key] as string, content];
            }
          } else {
            acc[key] = content;
          }
        }
        return acc;
      },
      {} as Record<string, string | string[] | null>,
    );
  }, []);
};
