/**
 * Custom emojis available in the emoji picker.
 * Used for reactions, composer, and direct casts.
 */
export const WARPLET_SHORTCODE = ':warplet:';

/** Public URL for the warplet glyph (Vite serves `public/` at `/`). */
export const WARPLET_SVG_SRC = '/~/images/warplet.svg';

/** Custom emoji category config for emoji-mart */
export const CUSTOM_EMOJIS = [
  {
    id: 'farcaster',
    name: 'Farcaster',
    emojis: [
      {
        id: 'warplet',
        name: 'Warplet',
        keywords: ['warplet', 'wallet', 'farcaster', 'warp'],
        shortcodes: [WARPLET_SHORTCODE],
        skins: [{ src: WARPLET_SVG_SRC }],
      },
    ],
  },
];
