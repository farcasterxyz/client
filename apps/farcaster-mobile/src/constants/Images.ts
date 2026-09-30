import { Platform } from 'react-native';

const defaultThumbnailDiameter = 48;
const imageRequestHeaders = {
  Referer: `${Platform.OS}.farcaster.xyz`,
  // Without this header, Cloudflare doesn't respect some transforms such as anim=false.
  Accept: 'image/avif,image/webp,image/apng,*/*;q=0.8',
  // Cache for 1 week.
  CacheControl: 'public, max-age=604800, immutable',
};

export { defaultThumbnailDiameter, imageRequestHeaders };
