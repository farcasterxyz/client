// DO NOT REMOVE THIS LINE: great thread for testing layout issues: https://farcaster.xyz/mm-fc-420/0x9d481a73

/**
 * ─── 2026-04-17  Non-snap vs snap cast embed layout split ───────────────────────
 * Casts with zero snap embeds use pre-#9574 layout math (`getNonSnapContainerAspectRatio`)
 * plus web render-component behavior gated by `snapContext` on `ImageAttachmentGroup`
 * and `OpenGraphAttachment`. Casts with one or more snaps keep post-snap layout and
 * `snapContext={true}` on those components.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CAST EMBED LAYOUT — HISTORY OF CHANGES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This file is the single source of truth for how cast embeds are sized on
 * both web (farcaster-web) and mobile (farcaster-mobile). The shared algorithm
 * lives here; each platform supplies a small config object with its own pixel
 * constants. Below is a full timeline of every significant sizing change since
 * the feature was first built, oldest-first.
 *
 * ─── 2024-01-22  #2722  Cloudflare image embeds + aspect ratio metadata ──────
 * Migrated from Cloudinary to Cloudflare Images for all user-uploaded photos.
 * Introduced `media.width` / `media.height` metadata on image embeds for the
 * first time, laying the groundwork for intrinsic-ratio sizing. Mobile
 * rendering was reworked to use `ImageAttachments` backed by the new metadata.
 *
 * ─── 2024-01-24  #2760  Object-center-top + stretch to full width (focused) ──
 * Web: in the focused/detail cast view, image embeds now stretch to the full
 * column width with `object-center top` cropping rather than being constrained
 * to the intrinsic image size.
 *
 * ─── 2024-01-26  #2800  Full height on images in focused renders ─────────────
 * Web + Mobile: focused (detail) renders allow images to grow to their natural
 * height rather than clamping to a feed-size max. Established the
 * focused-vs-feed distinction that still drives the `isFocused` flag today.
 *
 * ─── 2024-02-02  #2873 / #2891  Web video embed support ──────────────────────
 * First video embeds on web. Video tiles used fixed CSS aspect-ratio buckets
 * (16:9 landscape, 4:3 portrait, 1:1 square) derived by comparing width vs
 * height with simple thresholds — not the intrinsic ratio directly.
 *
 * ─── 2024-02-13  #3001  Video renders above non-image embeds ─────────────────
 * Changed render order so video tiles always appear before OG-card tiles in
 * the attachment strip. Also the first instance of `EmbedAspectRatio` as a
 * discriminated union type guiding the height-switch logic.
 *
 * ─── 2024-04-11  #3426  Image aspect ratio metadata in Direct Casts ──────────
 * Added `ClientProcessedMedia` type (with `.width`, `.height`, `.aspectRatio`)
 * as a public export from `farcaster-client-hooks/ImageUtils`. This is the
 * type that drives `processMediasForRendering` and `getImageAspectRatio` —
 * the clamped ratio helper used by `getContainerAspectRatio` today.
 *
 * ─── 2024-05-31  #3702 / #3703 / #3704  Smaller URL embeds + layout-shift fix
 * Web: introduced `quotedCastImageModeSlim` (100×100 thumbnail) for URL embeds
 * inside quote-casts. DOM width now read from `[id^="cast:"]` element to avoid
 * recalculating on every render; fixed Safari/Firefox width-calc bugs.
 *
 * ─── 2024-06-06  #3761  Force small OG embeds on replies ──────────────────────
 * Replies in the feed force `enforceSlimUrlEmbedRender`, keeping OG cards
 * compact and preventing long reply threads from being dominated by large images.
 *
 * ─── 2024-06-09 / 06-12  #3778 / #3806  Slim vs. expanded frame embeds ────────
 * Introduced `enforceSlimFrameEmbedRender` (a 46×46 thumbnail mode) for frames
 * from users who are not active on the Farcaster network. Power-badge holders
 * and followed users get expanded frames by default (#3806 reversed this to
 * expand for followed users rather than power-badge holders).
 *
 * ─── 2025-02-14  #5581  1:1 aspect ratio for Zora token frames ───────────────
 * Mini-app frame embeds gained an `imageAspectRatio` field (`'3:2' | '1:1'`).
 * `FrameEmbedNext` reads this field and switches between `aspectRatio = 1` and
 * `aspectRatio = 1.5`. The layout algorithm treats all mini-apps as the
 * `'miniapp-media'` bucket (3:2 → `width × 1`) but the inner content can
 * render 1:1 when the frame requests it.
 *
 * ─── 2025-04-09  #6016  OG images use 1.9:1 aspect ratio ──────────────────────
 * `OpenGraphAttachment` switched from an unspecified image box to an explicit
 * `aspectRatio: 1.91` container so that the card image always fills a
 * consistent 1.91:1 slot — matching the standard OG image spec.
 *
 * ─── 2025-04-10  #6072  Fix aspect-ratio Tailwind config + mobile OG ──────────
 * Web: added `1.91` to the Tailwind `aspectRatio` config so the value is
 * available as a utility class. Mobile: `OpenGraphCastAttachment` was not
 * applying aspect ratios at all for these OG images; this commit wired them in.
 *
 * ─── 2025-06-16  #6943 / #6976 / #6971  Carousel embeds ship ───────────────────
 * The biggest single structural change. Introduced the horizontal-scroll
 * carousel for casts with multiple embeds (image + video + OG mixed).
 * This commit originated the `getAttachmentStyle` function (initially inline in
 * `useCastBody.tsx` and `useCastAttachment.tsx`). Key decisions made here:
 *
 *   • `EmbedAspectRatio` union type:  'standard' | 'square-media' |
 *     'horizontal-media' | 'vertical-media' | 'miniapp-media'
 *   • Aspect-ratio classification thresholds: r < 0.8 → vertical,
 *     r ≤ 1.2 → square, r > 1.2 → horizontal (unchanged today).
 *   • Height buckets: vertical → `width * 4/3`, square → `width`,
 *     horizontal → `width * 9/16`, standard OG → `width * 1.45`.
 *   • Carousel-tile width = `postWidth - N` (web: −128, mobile: −24 at launch)
 *     so neighboring tiles peek through.
 *   • `MAX_FEED_AR = 1/2` on mobile — hard floor on the aspect ratio to prevent
 *     extremely tall portrait media from taking over the screen.
 *   • `carouselHasNonMedia` override: when an OG card is in the carousel,
 *     all tiles snap to 'square-media' bucket and use fixed heights
 *     (web: 320/358, mobile: 238/276 for normal/focused).
 *   • DOM selector for feed column width changed from `[id^="cast:"]` to
 *     `[id^="body:"]` when the feed layout was updated (#7276).
 *
 * ─── 2025-06-17  #6988 / #6992  Safari bugs + carousel fallback images ─────────
 * Fixed a Safari rendering bug where flex children weren't receiving explicit
 * widths. Carousel items now always get a concrete `width` prop. Fallback OG
 * images in carousels were rendering at wrong sizes; image-render path patched.
 *
 * ─── 2025-06-18  #7008  Focused-view video embed height ────────────────────────
 * Web: video embeds in the focused/detail cast view were not getting a height
 * because the `isFocusedCast` branch was skipping the `height` prop. Fixed by
 * threading `effectiveAR` out of `getAttachmentStyle` and checking it at
 * call sites.
 *
 * ─── 2025-06-19  #7032  First carousel element always hints next items ─────────
 * Very wide images (e.g. 21:9 panoramas) were consuming the full carousel row,
 * hiding subsequent tiles. Changed the stand-alone height clamp from
 * `Math.max(h, width/MAX_FEED_AR)` to `Math.min(h, width/MAX_FEED_AR)` —
 * a crucial inversion that keeps single-embed media from being too tall.
 * Also introduced `effectiveAR` return value from `getAttachmentStyle` so
 * callers can branch on the effective bucket (e.g. skip explicit height for
 * vertical-media in non-carousel).
 *
 * ─── 2025-06-20  #7042 / #7043 / #7049  Multiple passes on aspect ratio ────────
 * Three successive commits refining corner cases after the carousel launch:
 *   • Width was not applied to the first image in multi-image casts (#7043).
 *   • The image/video `width` prop was being applied in carousel mode when it
 *     shouldn't be (tiles should size themselves via `height` + their own AR,
 *     with `maxWidth` as a guard). Width moved to `maxWidth` in carousel path.
 *   • "There are so many corner cases these calculations are getting a bit out
 *     of hand" (commit message, #7049) — the width-vs-maxWidth logic was
 *     unified to: single-embed uses `width`, carousel uses `maxWidth`.
 *
 * ─── 2025-06-27  #7123 / #7126 / #7134  Threads-style media aspect ratios ──────
 * Significant design shift: adopted Threads-style behavior where the embed
 * container uses the media's intrinsic aspect ratio for height (instead of
 * always snapping to a fixed bucket). This introduced `effectiveAR` return
 * value at all call sites. Also: videos render full-width in landscape
 * orientation (#7134); composer embed gap and single-embed sizing fixed (#7126).
 *
 * ─── 2025-07-09  #7275 / #7276 / #7280  Carousel sizing + DOM selector fix ─────
 * Removed the `updatedMediaEmbeds` feature flag (carousel is now permanent).
 * Simplified `controlledHeight` to a flat `Math.min(h, 400)` for both mobile
 * and web (removed the `MAX_FEED_AR` stand-alone clamp on mobile, switched
 * mobile max from `width/MAX_FEED_AR` to 400). DOM selector for reading post
 * width changed from `[id^="cast:"]` to `[id^="body:"]` after a layout
 * restructure. Non-carousel frame embeds now pass `width: undefined` to avoid
 * over-constraining the mini-app container.
 *
 * ─── 2025-07-09  #7276  Dynamic width + max cap fix ─────────────────────────────
 * Web: `feedRenderingWidth` was computed with `Math.max` (wrong — always
 * returned ≥ 618), changed to `Math.min` so wide screens still cap at 618.
 * This is the bug described as "always falling back to 618 when screen was
 * too small with a faulty logic" (#7485 subsequently patched mobile too).
 *
 * ─── 2025-07-15  #7379  Restore original sizing for on-FC-client images ─────────
 * Images uploaded from Farcaster clients include `media.width` / `media.height`
 * metadata but were being rendered at the feed-column size (blurry because of
 * upscaling). Fixed by passing the original pixel dimensions to the image
 * loader and disabling the `increasedWidth` transform flag for these images.
 *
 * ─── 2025-07-21  #7485  Fix embed max-width cap on narrow screens ───────────────
 * Web: the `Math.max` → `Math.min` DOM-width bug from #7276 was also present
 * in the `feedRenderingWidth` guard; fixed here. Also patched Safari rendering
 * of mini-app embeds in carousel rows.
 *
 * ─── 2025-07-24  #7549  Better spacing for single-media posts on mobile ─────────
 * Mobile: post width calculation for single-embed (non-carousel) casts changed
 * from `screenWidth - 82` to `screenWidth - 86`. Carousel tile reduction
 * changed from 24 → 20. (Small constant tuning after visual audit.)
 *
 * ─── 2025-12-09  #N/A   Image LCP priority prop ────────────────────────────────
 * Added a `priority` prop to `ImageAttachments` / `ImageAttachmentGroup` to
 * enable eager loading (no `loading="lazy"`) for the first image in a cast,
 * improving Largest Contentful Paint. No change to layout dimensions.
 *
 *
 * --- NEYNAR ACQUISITION OCCURRED HERE ---
 *
 *
 * ─── 2026-04-03  #9358  Intrinsic video/image aspect ratio (merged to shared) ───
 * The foundational fix for distorted video embeds reported by users (NEYN-9652).
 * Extracted `getContainerAspectRatioFromEmbeds` and `getAttachmentStyle` from
 * `useCastBody.tsx` into a separate `useCastBody.utils.ts` file (now this
 * shared file). Key change: instead of classifying video/image into a bucket
 * and using a fixed height multiplier, we now compute `exactAspectRatio` from
 * `getImageAspectRatio({w, h})` (clamped 0.33–10) and use `width / exactRatio`
 * for height. Bucket-based fallbacks are kept for OG cards and frames which
 * don't have intrinsic dimensions.
 *
 * ─── 2026-04-07  #9574 / #9575  Snap embeds land (web + mobile) ────────────────
 * New `SnapEmbedAttachment` component replaces `OpenGraphAttachment` as the
 * default URL-embed renderer. Snaps probe URLs with an `Accept` header and
 * render an interactive `SnapCard` if the response is valid snap JSON, falling
 * back to the OG card otherwise. The sizing contract with `getAttachmentStyle`
 * is identical to OG cards: receives `width` and `height` from the hook, snap
 * container applies them explicitly.
 *
 * ─── 2026-04-07  #9587 / #9592  Snap border/padding + fixed carousel width ──────
 * Added `border px-[5px] py-[5px] rounded-lg` framing around `SnapCard`.
 * Snap embeds in mixed carousels were being flex-shrunk by neighboring tiles.
 * Added `snapWidth` param to `renderUrlEmbed`: always passes the full
 * `getAttachmentStyle` width to snaps (both carousel and non-carousel), while
 * OG cards and frames continue to receive `undefined` width in carousel mode
 * so they grow to fill their tile height.
 *
 * ─── 2026-04-08  #9366 / #9602  Single-image overflow + carousel flex-shrink ────
 * Two bugs surfaced after the snap work:
 *   (1) Tall portrait images (e.g. 923×2000) overflowed the feed column
 *       horizontally because flex children default to `min-width: auto`.
 *       Fixed with `min-w-0 max-w-full` on the `<img>` element (#9366).
 *   (2) In multi-embed carousels, the `min-w-0` rule from (1) let wide OG
 *       neighbors shrink images to near zero. Fixed with a `noShrink` prop
 *       (`shrink-0 object-center` in carousel, `min-w-0 object-left` solo)
 *       (#9602).
 *
 * ─── 2026-04-08  #N/A   Preserve image aspect ratio with mini-app embeds ────────
 * When a cast contained both an image and a mini-app, the carousel snapped to
 * the mini-app's 3:2 bucket and used `object-cover`, cropping the image.
 * Fixed by: (a) preferring image media dimensions over mini-app bucket when
 * both are present in `getContainerAspectRatioFromEmbeds`, (b) a new
 * `preserveIntrinsicHeightInImagePlusMiniAppCarousel` flag in `getAttachmentStyle`
 * that uses `width / exactRatio` even in carousel + nonMedia mode, and (c)
 * switching to `object-contain` when not forcing cover.
 *
 * ─── 2026-04-09  #9616  Mobile snap embed layout ────────────────────────────────
 * Mobile `SnapEmbedAttachment` sizing iterated through three commits:
 *   • First attempt used `flex: 1, minWidth: 0` — collapsed when solo.
 *   • Second: use explicit `width` when provided (solo), `flex: 1` for carousel.
 *   • Final: match `OpenGraphCastAttachment` carousel math exactly:
 *     `resolvedWidth = height * 1.91 - 158.5` when `height` is set (carousel),
 *     `width` directly when `width` is set (solo).
 *
 * ─── 2026-04-09  #9620  @farcaster/snap 1.21.0 — SnapCard owns its own chrome ──
 * `SnapCard` (renamed from `SnapView` in v1.16) now handles its own
 * border/background/padding/radius. Removed the wrapper `View` in
 * `SnapRenderer` (mobile) and the `border px-[5px]` div in
 * `SnapEmbedAttachment` (web). Width/height plumbing from `getAttachmentStyle`
 * is unchanged; only the visual chrome moved inside the component.
 *
 * ─── 2026-04-10  Refactor: shared EmbedLayoutUtils (this file) ──────────────────
 * The algorithm that had drifted into two separate files
 * (`useCastBody.utils.ts` on web, inline in `useCastAttachment.tsx` on mobile)
 * was unified here. Platform-specific constants (padding offsets, carousel
 * peeking gap, fixed carousel-nonMedia heights) are expressed in
 * `EmbedLayoutConfig` objects defined in each app. Mobile was also missing the
 * `exactAspectRatio` intrinsic-ratio fix from #9358; it now gets it.
 *
 * ─── 2026-04-14  Carousel container caps + web DOM width helpers ────────────────
 * `WEB_EMBED_LAYOUT_DEFAULTS`, `MOBILE_EMBED_LAYOUT_DEFAULTS`, web-only
 * `getAttachmentStyle` (DOM column width), `getContainerAspectRatioFromEmbeds`,
 * and `getCarouselContainerMaxHeight` live here so web and mobile share one
 * bucketing/clamping surface. Added `CAROUSEL_HEIGHT_WITH_SNAPS` constant
 * for constant carousel height when snaps are present.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  ApiCastEmbeds,
  ApiCastSnapEmbed,
  ApiCastUrlEmbed,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';

import { getImageAspectRatio } from './ImageUtils';

type EmbedAspectRatioBucket =
  | 'standard' // ~1.91:1 OpenGraph fallback
  | 'vertical-media' // portrait video/image
  | 'square-media' // ~1:1
  | 'horizontal-media' // wider than tall media
  | 'miniapp-media'
  | 'snap'; // constant width, variable height up to 500px

type EmbedAspectRatio = {
  bucket: EmbedAspectRatioBucket;
  exactRatio?: number;
};

/**
 * Platform-specific constants that control embed sizing. Each surface
 * (web, mobile) provides its own config; the layout algorithm is shared.
 */
type EmbedLayoutConfig = {
  /** Available width for the embed after subtracting avatar/padding from the feed column. */
  postWidth: number;
  /** How much narrower a carousel tile is than the full post width. */
  carouselWidthReduction: number;
  /** Fixed height for carousel tiles that include non-media (e.g. OG card next to image). */
  carouselNonMediaHeight: number;
  /** Same as above but for the focused/detail cast view. */
  carouselNonMediaFocusedHeight: number;
  /** Maximum height for any embed. */
  maxHeight: number;
};

const WEB_EMBED_LAYOUT_DEFAULTS: Omit<EmbedLayoutConfig, 'postWidth'> = {
  carouselWidthReduction: 128,
  carouselNonMediaHeight: 320,
  carouselNonMediaFocusedHeight: 358,
  maxHeight: 400,
};

const MOBILE_EMBED_LAYOUT_DEFAULTS: Omit<EmbedLayoutConfig, 'postWidth'> = {
  carouselWidthReduction: 20,
  carouselNonMediaHeight: 238,
  carouselNonMediaFocusedHeight: 276,
  maxHeight: 320,
};

const CAROUSEL_HEIGHT_WITH_SNAPS = 500;

type CarouselLayoutPlatform = 'web' | 'mobile';

const LAYOUT_DEFAULTS_BY_PLATFORM: Record<
  CarouselLayoutPlatform,
  Omit<EmbedLayoutConfig, 'postWidth'>
> = {
  web: WEB_EMBED_LAYOUT_DEFAULTS,
  mobile: MOBILE_EMBED_LAYOUT_DEFAULTS,
};

const getWebFeedRenderingWidth = (
  feedRenderingWidthOverride?: number,
): number => {
  const raw =
    feedRenderingWidthOverride ??
    (typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('[id^="body:"]')?.offsetWidth
      : undefined) ??
    618;
  return Math.min(raw, 618);
};

const getWebPostWidth = (
  focusedCastMode: boolean,
  feedRenderingWidthOverride?: number,
): number => {
  return (
    getWebFeedRenderingWidth(feedRenderingWidthOverride) -
    (focusedCastMode ? 26 : 88)
  );
};

type CastEmbedLayoutArgs =
  | {
      embeds?: ApiCastEmbeds;
      platform: 'web';
      isFocused: boolean;
      renderingCarousel: boolean;
      carouselHasNonMedia: boolean;
      feedRenderingWidthOverride?: number;
    }
  | {
      embeds?: ApiCastEmbeds;
      platform: 'mobile';
      isFocused: boolean;
      renderingCarousel: boolean;
      carouselHasNonMedia: boolean;
      postWidth: number;
    };

type CastEmbedLayoutResult = {
  mode: 'snap' | 'non-snap';
  width: number;
  height: number;
  effectiveAR: EmbedAspectRatioBucket;
  carouselMaxHeight: number | undefined;
  mediaTileHeight: number | undefined;
};

const getCarouselContainerMaxHeight = ({
  platform,
  needsCarousel,
  carouselHasSnap,
}: {
  platform: CarouselLayoutPlatform;
  needsCarousel: boolean;
  carouselHasSnap: boolean;
}): number | undefined => {
  if (!needsCarousel) {
    return undefined;
  }
  if (carouselHasSnap) {
    if (platform === 'web') {
      return undefined;
    }
    return CAROUSEL_HEIGHT_WITH_SNAPS;
  }
  return LAYOUT_DEFAULTS_BY_PLATFORM[platform].maxHeight;
};

const classifyAspectRatio = (r: number): EmbedAspectRatioBucket =>
  r <= 0.8 ? 'vertical-media' : r <= 1.2 ? 'square-media' : 'horizontal-media';

/** Pre-#9574 thresholds: portrait uses strict `< 0.8` (see useCastBody.utils @ e27118ec3). */
const classifyNonSnapAspectRatio = (r: number): EmbedAspectRatioBucket =>
  r < 0.8 ? 'vertical-media' : r <= 1.2 ? 'square-media' : 'horizontal-media';

/**
 * Container aspect ratio for casts with **no** snap embeds. Matches pre-snap behavior:
 * first URL embed's mini-app frame wins before video/image intrinsic ratios.
 */
const getNonSnapContainerAspectRatio = ({
  embeds,
}: {
  embeds?: ApiCastEmbeds;
}): EmbedAspectRatio => {
  if (!embeds) {
    return { bucket: 'standard' };
  }

  const ma = embeds.urls?.[0]?.openGraph;
  if (ma?.frameEmbedNext?.frameEmbed) {
    return { bucket: 'miniapp-media' };
  }

  const v = embeds.videos?.[0];
  const vRatio =
    v?.width && v?.height
      ? getImageAspectRatio({ w: v.width, h: v.height })
      : undefined;
  if (typeof vRatio === 'number') {
    return {
      bucket: classifyNonSnapAspectRatio(vRatio),
      exactRatio: vRatio,
    };
  }

  const i = embeds.images?.[0];
  const iRatio =
    i?.media?.width && i?.media?.height
      ? getImageAspectRatio({ w: i.media.width, h: i.media.height })
      : undefined;
  if (typeof iRatio === 'number') {
    return {
      bucket: classifyNonSnapAspectRatio(iRatio),
      exactRatio: iRatio,
    };
  }

  const og = embeds.urls?.[0]?.openGraph;
  if (og?.useLargeImage) {
    return { bucket: 'horizontal-media' };
  }

  return { bucket: 'standard' };
};

const isSnapEmbed = (embed: ApiCastUrlEmbed): boolean =>
  !!embed.openGraph?.snap?.url;

/**
 * Builds a legacy-shaped `ApiCastUrlEmbed` from a hoisted `embeds.snap[]` item
 * so feed renderers (`getRenderableEmbeds` on web/mobile) can treat it like a
 * URL OG row with `openGraph.snap` — the same path `isSnapEmbed` / snap layout
 * use during the NEYN-10204 / NEYN-10425 rollout.
 */
const urlEmbedFromHoistedSnap = (snap: ApiCastSnapEmbed): ApiCastUrlEmbed => ({
  type: 'url',
  openGraph: {
    url: snap.url,
    sourceUrl: snap.sourceUrl,
    title: snap.title,
    description: snap.description,
    domain: snap.domain,
    image: snap.image,
    snap: { url: snap.url },
  },
});

const hasAnySnapEmbed = (embeds?: ApiCastEmbeds): boolean => {
  if (!embeds) {
    return false;
  }
  if ((embeds.snap?.length ?? 0) > 0) {
    return true;
  }
  return (embeds.urls ?? []).some(isSnapEmbed);
};

/**
 * Dual-support helper for the snap-embed rollout (NEYN-10204 / NEYN-10425).
 *
 * Backend is migrating from representing snaps as a flag on URL embeds
 * (`urls[*].openGraph.snap`) to a dedicated top-level bucket (`embeds.snap[]`)
 * that mirrors every other embed kind. During the rollout both shapes can
 * appear on the same response — new responses populate both, cached
 * `processed_embeds` may only have the legacy shape.
 *
 * Prefers the new `embeds.snap` bucket when present, otherwise synthesizes
 * an `ApiCastSnapEmbed` from the legacy URL embed so call sites don't have
 * to branch on shape. Returns `undefined` when the cast has no snap.
 *
 * Accepts either the top-level `ApiCastEmbeds` shape or the inline
 * `ApiQuoteCastEmbed['embeds']` shape — both expose `urls` and `snap`.
 *
 * Phase 2 (NEYN-10437) will drop the legacy fallback once the backend is
 * fully rolled out.
 */
const getCastSnap = (
  embeds: ApiCastEmbeds | ApiQuoteCastEmbed['embeds'] | undefined,
): ApiCastSnapEmbed | undefined => {
  if (!embeds) return undefined;

  // New path — backend already hoisted the snap into its own bucket.
  const hoisted = embeds.snap?.[0];
  if (hoisted) return hoisted;

  // Legacy fallback — walk urls and synthesize the new shape so callers
  // render uniformly. Stale cached responses may only have this shape.
  const urlEmbed = (embeds.urls ?? []).find((u) => !!u.openGraph?.snap?.url);
  const snap = urlEmbed?.openGraph?.snap;
  if (!urlEmbed || !snap) return undefined;

  return {
    type: 'snap',
    url: snap.url,
    sourceUrl: urlEmbed.openGraph.sourceUrl ?? urlEmbed.openGraph.url,
    domain: urlEmbed.openGraph.domain,
    title: urlEmbed.openGraph.title,
    description: urlEmbed.openGraph.description,
    image: urlEmbed.openGraph.image,
  };
};

const getContainerAspectRatio = ({
  embeds,
}: {
  embeds?: ApiCastEmbeds;
}): EmbedAspectRatio => {
  if (!embeds) {
    return { bucket: 'standard' };
  }

  // 1. Snap — constant width, variable height; no intrinsic aspect ratio.
  // Check both the new `embeds.snap` bucket and the legacy `urls[*].openGraph.snap`
  // shape during the NEYN-10204 / NEYN-10425 rollout.
  if (embeds.snap?.length || embeds.urls?.some((u) => isSnapEmbed(u))) {
    return { bucket: 'snap' };
  }

  // 2. Video — intrinsic ratio when available (takes precedence over mini-app / OG URL embed)
  const v = embeds.videos?.[0];
  const vRatio =
    v?.width && v?.height
      ? getImageAspectRatio({ w: v.width, h: v.height })
      : undefined;
  if (typeof vRatio === 'number') {
    return { bucket: classifyAspectRatio(vRatio), exactRatio: vRatio };
  }

  // 3. Image — intrinsic ratio when available (same precedence as #9587 history: over mini-app bucket)
  const i = embeds.images?.[0];
  const iRatio =
    i?.media?.width && i?.media?.height
      ? getImageAspectRatio({ w: i.media.width, h: i.media.height })
      : undefined;
  if (typeof iRatio === 'number') {
    return { bucket: classifyAspectRatio(iRatio), exactRatio: iRatio };
  }

  // 4. Mini-app / frame embed — only when no image/video intrinsic dimensions to drive the container
  const firstUrlOg = embeds.urls?.[0]?.openGraph;
  if (firstUrlOg?.frameEmbedNext?.frameEmbed) {
    return { bucket: 'miniapp-media' };
  }

  // 5. OpenGraph (non–mini-app URL embed)
  if (firstUrlOg?.useLargeImage) {
    return { bucket: 'horizontal-media' };
  }

  return { bucket: 'standard' };
};

const getEmbedAttachmentStyle = ({
  aspectRatio,
  isCarousel,
  carouselHasNonMedia,
  isFocused,
  config,
}: {
  aspectRatio: EmbedAspectRatio;
  isCarousel: boolean;
  carouselHasNonMedia: boolean;
  isFocused: boolean;
  config: EmbedLayoutConfig;
}): {
  width: number;
  height: number;
  effectiveAspectRatio: EmbedAspectRatio;
} => {
  const width = isCarousel
    ? config.postWidth - config.carouselWidthReduction
    : config.postWidth;

  let effectiveAspectRatio: EmbedAspectRatio = aspectRatio;
  if (isCarousel && carouselHasNonMedia) {
    effectiveAspectRatio = { bucket: 'square-media' };
  }

  let height = (() => {
    if (
      typeof effectiveAspectRatio.exactRatio === 'number' &&
      effectiveAspectRatio.exactRatio > 0 &&
      !(isCarousel && carouselHasNonMedia)
    ) {
      return width / effectiveAspectRatio.exactRatio;
    }

    switch (effectiveAspectRatio.bucket) {
      case 'vertical-media':
        return width * (4 / 3);
      case 'square-media':
        return width;
      case 'horizontal-media':
        return width * (9 / 16);
      case 'miniapp-media':
        return width;
      case 'snap':
        return CAROUSEL_HEIGHT_WITH_SNAPS;
      case 'standard':
      default:
        return width * 1.45;
    }
  })();

  height = isCarousel
    ? carouselHasNonMedia
      ? isFocused
        ? config.carouselNonMediaFocusedHeight
        : config.carouselNonMediaHeight
      : Math.min(height, config.maxHeight)
    : Math.min(height, config.maxHeight);

  return { width, height, effectiveAspectRatio };
};

/**
 * Single entry point for cast feed attachment layout. Dispatches to pre-snap
 * `getNonSnapContainerAspectRatio` when the cast has no snap embeds; otherwise
 * uses `getContainerAspectRatio` (image/video precedence over mini-app, snap bucket).
 */
const getCastEmbedLayout = (
  args: CastEmbedLayoutArgs,
): CastEmbedLayoutResult => {
  const postWidth =
    args.platform === 'web'
      ? getWebPostWidth(args.isFocused, args.feedRenderingWidthOverride)
      : args.postWidth;

  const {
    platform,
    embeds,
    isFocused,
    renderingCarousel,
    carouselHasNonMedia,
  } = args;

  const config: EmbedLayoutConfig = {
    ...LAYOUT_DEFAULTS_BY_PLATFORM[platform],
    postWidth,
  };

  const snapPresent = hasAnySnapEmbed(embeds);
  const aspectRatio = snapPresent
    ? getContainerAspectRatio({ embeds })
    : getNonSnapContainerAspectRatio({ embeds });

  const { width, height, effectiveAspectRatio } = getEmbedAttachmentStyle({
    aspectRatio,
    isCarousel: renderingCarousel,
    carouselHasNonMedia,
    isFocused,
    config,
  });

  const mediaTileHeight =
    platform === 'web' &&
    snapPresent &&
    renderingCarousel &&
    carouselHasNonMedia
      ? CAROUSEL_HEIGHT_WITH_SNAPS
      : undefined;

  const carouselHasSnap =
    renderingCarousel &&
    !!embeds &&
    ((embeds.snap?.length ?? 0) > 0 || (embeds.urls ?? []).some(isSnapEmbed));

  const carouselMaxHeight = getCarouselContainerMaxHeight({
    platform,
    needsCarousel: renderingCarousel,
    carouselHasSnap,
  });

  return {
    mode: snapPresent ? 'snap' : 'non-snap',
    width,
    height,
    effectiveAR: effectiveAspectRatio.bucket,
    carouselMaxHeight,
    mediaTileHeight,
  };
};

const getContainerAspectRatioFromEmbeds = ({
  embeds,
}: {
  embeds?: ApiCastEmbeds;
}): {
  containerAspectRatio: EmbedAspectRatioBucket;
  exactAspectRatio?: number;
} => {
  const result = getContainerAspectRatio({ embeds });
  return {
    containerAspectRatio: result.bucket,
    exactAspectRatio: result.exactRatio,
  };
};

const getAttachmentStyle = ({
  ar,
  exactAspectRatio,
  renderingCarousel,
  carouselHasNonMedia,
  focusedCastMode,
  feedRenderingWidthOverride,
}: {
  ar: EmbedAspectRatioBucket;
  exactAspectRatio?: number;
  renderingCarousel: boolean;
  carouselHasNonMedia: boolean;
  focusedCastMode: boolean;
  feedRenderingWidthOverride?: number;
}): {
  width: number;
  height: number;
  effectiveAR: EmbedAspectRatioBucket;
} => {
  const postWidth = getWebPostWidth(
    focusedCastMode,
    feedRenderingWidthOverride,
  );

  const { width, height, effectiveAspectRatio } = getEmbedAttachmentStyle({
    aspectRatio: { bucket: ar, exactRatio: exactAspectRatio },
    isCarousel: renderingCarousel,
    carouselHasNonMedia,
    isFocused: focusedCastMode,
    config: { ...WEB_EMBED_LAYOUT_DEFAULTS, postWidth },
  });

  return {
    width,
    height,
    effectiveAR: effectiveAspectRatio.bucket,
  };
};

export {
  type CastEmbedLayoutArgs,
  type CastEmbedLayoutResult,
  type EmbedAspectRatio,
  type EmbedAspectRatioBucket,
  type EmbedLayoutConfig,
  getAttachmentStyle,
  getCarouselContainerMaxHeight,
  getCastEmbedLayout,
  getCastSnap,
  getContainerAspectRatio,
  getContainerAspectRatioFromEmbeds,
  getEmbedAttachmentStyle,
  hasAnySnapEmbed,
  isSnapEmbed,
  MOBILE_EMBED_LAYOUT_DEFAULTS,
  urlEmbedFromHoistedSnap,
};
