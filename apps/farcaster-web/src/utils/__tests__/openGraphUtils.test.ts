import { ApiOpenGraphMetadata } from 'farcaster-client-data';

import { getOpenGraphType } from '~/hooks/openGraph/useOpenGraphType';
import { applyCloudflarePath } from '~/utils/images';
import {
  getOpenGraphImageSource,
  getOpenGraphImageUrl,
  shouldRenderExploreChannels,
  shouldRenderFauxQuoteCast,
} from '~/utils/openGraphUtils';

const invalidUrlAttachment = {
  url: '%%%invalid-url%%%',
} as ApiOpenGraphMetadata;

describe('openGraphUtils', () => {
  describe('getOpenGraphImageSource', () => {
    it('returns image when present', () => {
      const attachment = {
        url: 'https://example.com',
        image: 'https://example.com/image.jpg',
      };
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://example.com/image.jpg',
      );
    });

    it('returns logo when image is missing', () => {
      const attachment = {
        url: 'https://example.com',
        logo: 'https://example.com/logo.png',
      };
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://example.com/logo.png',
      );
    });

    it('falls back to ogImageUrl when image and logo are missing', () => {
      const attachment = {
        url: 'https://basescan.org/address/0x123',
        domain: 'basescan.org',
        ogImageUrl: 'https://basescan.org/assets/base/images/og-preview-sm.jpg',
      } as Parameters<typeof getOpenGraphImageSource>[0]['attachment'];
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://basescan.org/assets/base/images/og-preview-sm.jpg',
      );
    });

    it('falls back to ogImage when image, logo and ogImageUrl are missing', () => {
      const attachment = {
        url: 'https://example.com',
        domain: 'example.com',
        ogImage: 'https://example.com/og-image.png',
      } as Parameters<typeof getOpenGraphImageSource>[0]['attachment'];
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://example.com/og-image.png',
      );
    });

    it('returns undefined when no image fields present', () => {
      const attachment = {
        url: 'https://example.com',
        domain: 'example.com',
      };
      expect(getOpenGraphImageSource({ attachment })).toBeUndefined();
    });

    it('prefers image over logo over ogImageUrl over ogImage', () => {
      const attachment = {
        url: 'https://example.com',
        image: 'https://example.com/image.jpg',
        logo: 'https://example.com/logo.png',
        ogImageUrl: 'https://example.com/og.jpg',
        ogImage: 'https://example.com/og-alt.png',
      } as Parameters<typeof getOpenGraphImageSource>[0]['attachment'];
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://example.com/image.jpg',
      );
    });

    it('ignores empty image fields and uses the next available source', () => {
      const attachment = {
        url: 'https://basescan.org/address/0x123',
        domain: 'basescan.org',
        image: '',
        logo: '',
        ogImage: 'https://basescan.org/assets/base/images/og-preview-sm.jpg',
      } as Parameters<typeof getOpenGraphImageSource>[0]['attachment'];
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://basescan.org/assets/base/images/og-preview-sm.jpg',
      );
    });

    it('falls back to og_image_url (snake_case) when API returns it', () => {
      const attachment = {
        url: 'https://basescan.org/address/0x123',
        domain: 'basescan.org',
        og_image_url:
          'https://basescan.org/assets/base/images/og-preview-sm.jpg',
      } as Parameters<typeof getOpenGraphImageSource>[0]['attachment'];
      expect(getOpenGraphImageSource({ attachment })).toBe(
        'https://basescan.org/assets/base/images/og-preview-sm.jpg',
      );
    });
  });

  describe('getOpenGraphImageUrl', () => {
    it('routes ogImageUrl through applyCloudflarePath verbatim', () => {
      const ogImageUrl =
        'https://basescan.org/assets/base/images/og-preview-sm.jpg';
      const attachment = {
        url: 'https://basescan.org/address/0x123',
        domain: 'basescan.org',
        ogImageUrl,
      } as Parameters<typeof getOpenGraphImageUrl>[0]['attachment'];

      const result = getOpenGraphImageUrl({ attachment });

      expect(result).toBe(applyCloudflarePath(ogImageUrl, undefined));
      expect(result).toContain(encodeURIComponent(ogImageUrl));
    });

    it('prefers attachment.image over ogImageUrl when both are present', () => {
      const image = 'https://example.com/primary.jpg';
      const attachment = {
        url: 'https://example.com',
        domain: 'example.com',
        image,
        ogImageUrl: 'https://example.com/og-fallback.jpg',
      } as Parameters<typeof getOpenGraphImageUrl>[0]['attachment'];

      expect(getOpenGraphImageUrl({ attachment })).toBe(
        applyCloudflarePath(image, undefined),
      );
    });

    it('returns undefined when no image source', () => {
      const attachment = {
        url: 'https://example.com',
        domain: 'example.com',
      };
      expect(getOpenGraphImageUrl({ attachment })).toBeUndefined();
    });
  });

  describe('URL parsing guards', () => {
    it('does not throw while classifying an invalid URL attachment', () => {
      expect(() =>
        getOpenGraphType({ urlEmbed: invalidUrlAttachment }),
      ).not.toThrow();
      expect(getOpenGraphType({ urlEmbed: invalidUrlAttachment })).toBe('url');
    });

    it('returns false for guarded helper checks with invalid URLs', () => {
      expect(
        shouldRenderExploreChannels({ attachment: invalidUrlAttachment }),
      ).toBe(false);
      expect(
        shouldRenderFauxQuoteCast({ attachment: invalidUrlAttachment }),
      ).toBe(false);
    });
  });
});
