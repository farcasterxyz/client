/**
 * Quote casts embed another cast via the same `processCastAttachments` path as other URL embeds.
 * Short-hash cast URLs are normalized in `useProcessCastAttachments` before the API call.
 */
export { useProcessCastAttachments as useQuoteCast } from './useProcessCastAttachments';
