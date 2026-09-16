import { getCloudflareImageUrl } from '../ImageUtils';

describe('ImageUtils', () => {
  describe('getCloudflareImageUrl', () => {
    it('does not proxy Sim collectible image endpoints', () => {
      const url =
        'https://api.sim.dune.com/v1/evm/collectible/image/8453/0x5667907c239279aec37271e9cb099b8bfd3afeba/1';

      expect(
        getCloudflareImageUrl({
          url,
          windowWidth: 300,
          width: 300,
        }),
      ).toEqual(url);
    });

    it('continues proxying regular remote images', () => {
      expect(
        getCloudflareImageUrl({
          url: 'https://example.com/image.png',
          windowWidth: 300,
          width: 300,
        }),
      ).toEqual(
        'https://wrpcd.net/cdn-cgi/image/anim=false,f=auto,w=900/https%3A%2F%2Fexample.com%2Fimage.png',
      );
    });
  });
});
