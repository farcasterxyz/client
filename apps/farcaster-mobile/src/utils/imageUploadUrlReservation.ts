/**
 * Serializes calls that reserve a unique Cloudflare image upload slot.
 * Concurrent `generateImageUploadUrl` calls can otherwise return the same
 * optimisticImageId; uploads then overwrite each other and deduped embed URLs collapse.
 */
let reservationChain = Promise.resolve();

function enqueueImageUploadUrlReservation<T>(fn: () => Promise<T>): Promise<T> {
  const run = reservationChain.then(() => fn());
  reservationChain = run.then(() => undefined).catch(() => undefined);
  return run;
}

export { enqueueImageUploadUrlReservation };
