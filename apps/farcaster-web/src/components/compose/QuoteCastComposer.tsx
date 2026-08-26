/**
 * Quote-cast composition uses the same modal and attachment pipeline as other casts.
 * Short-hash cast URLs in `intent.embeds` are resolved to full hashes in
 * `useProcessCastAttachments` (see `resolveCastEmbedUrls` in farcaster-client-hooks).
 */
export { ComposeCastModal as QuoteCastComposer } from '~/components/modals/ComposeCastModal';
