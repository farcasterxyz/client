import { useQueryClient } from '@tanstack/react-query';
import {
  type ApiGetKeyTransaction200Response,
  type AuthToken,
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
  getFirstApiErrorBody,
  isHandledFetchError,
} from 'farcaster-client-data';
import { useCallback } from 'react';
import type { Hex } from 'viem';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';
import { buildKeyTransactionFetcher } from '../queries/keyTransaction/buildKeyTransactionFetcher';
import { buildKeyTransactionKey } from '../queries/keyTransaction/buildKeyTransactionKey';
import { useInvalidateSigners } from '../queries/signers';
import { useInvalidateUserAppContext } from '../queries/userAppContext';

// The on-chain KeyGateway.add submitted by the backend has to be mined and
// indexed before the signer is usable, so we poll the existing key-transaction
// endpoint until it resolves. Generous ceiling because the work spans a block
// confirmation + indexing; the call is idempotent so a timeout is safely
// retryable by re-running the whole flow.
const KEY_TRANSACTION_POLL_INTERVAL_MS = 2000;
const KEY_TRANSACTION_POLL_MAX_ATTEMPTS = 90; // ~3 minutes

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const pollExternalUserSignerKeyTransaction = async ({
  keyTransactionId,
  fetchKeyTransaction,
  invalidateSigners,
  invalidateUserAppContext,
  pollIntervalMs = KEY_TRANSACTION_POLL_INTERVAL_MS,
  maxAttempts = KEY_TRANSACTION_POLL_MAX_ATTEMPTS,
  delayFn = delay,
}: {
  keyTransactionId: string;
  fetchKeyTransaction: () => Promise<ApiGetKeyTransaction200Response>;
  invalidateSigners: () => void;
  invalidateUserAppContext: () => void;
  pollIntervalMs?: number;
  maxAttempts?: number;
  delayFn?: (ms: number) => Promise<void>;
}) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let keyTransactionResponse: ApiGetKeyTransaction200Response;

    try {
      keyTransactionResponse = await fetchKeyTransaction();
    } catch (error) {
      // Auth/permission failures (401 expired/invalid session token, 403 ban via
      // the endpoint's disable-access check) won't resolve by re-polling with the
      // same token — fail fast so the caller can surface a retry immediately
      // instead of hanging until the overall timeout (~3 minutes).
      if (
        isHandledFetchError(error) &&
        (error.status === 401 || error.status === 403)
      ) {
        throw error;
      }

      // Everything else is treated as a pending transaction and retried: network
      // blips, 429/5xx, and a transient 404 right after the tx row is written but
      // before it is readable. Keep polling until the overall timeout.
      await delayFn(pollIntervalMs);
      continue;
    }

    const { keyTransaction } = keyTransactionResponse.result;

    if (keyTransaction.failedAt) {
      // Mirror useKeyTransaction's invalidation on resolution.
      invalidateSigners();
      invalidateUserAppContext();
      throw new Error(
        `External user signer key transaction failed (keyTransactionId=${keyTransactionId})`,
      );
    }

    if (keyTransaction.completedAt) {
      invalidateSigners();
      invalidateUserAppContext();
      return { keyTransactionId };
    }

    await delayFn(pollIntervalMs);
  }

  throw new Error(
    `External user signer key transaction timed out (keyTransactionId=${keyTransactionId})`,
  );
};

/**
 * An error thrown when the external-user signer flow can't mint a signer for
 * this account: the eligibility check rejected it (HTTP 403) or the endpoint
 * isn't available (HTTP 404, e.g. feature not deployed). Callers should treat
 * this as "this account isn't an external user we can mint a free signer for"
 * and fall back to their normal not-found handling, rather than surfacing a
 * retryable error.
 */
export class ExternalUserSignerNotEligibleError extends Error {
  override name = 'ExternalUserSignerNotEligibleError';
}

/**
 * An error thrown when a Warpcast app signer add for this FID is already in
 * flight on-chain (the backend rejects the new mint with reason
 * `has_pending_signer`). Unlike {@link ExternalUserSignerNotEligibleError} this
 * is transient, NOT a terminal rejection: once the pending add is indexed the
 * FID becomes usable. Callers should surface a retryable "still finishing
 * setup" message rather than the "no account found" fallback, and must not log
 * it as an error.
 */
export class ExternalUserSignerPendingError extends Error {
  override name = 'ExternalUserSignerPendingError';
}

/**
 * Mints a free Warpcast app signer for an external FID (an account created
 * outside Warpcast that has no `onboardings` row and no app signer on this
 * client). Mirrors the custody-bearer auth used by
 * `useRefreshOnboardingStateAndAuthToken` and the EIP-712 hash signing used by
 * `useApproveSignedKeyRequest`. The backend pays the gas.
 *
 * Resolves once the resulting key transaction is fully indexed (signer ready).
 * Throws {@link ExternalUserSignerNotEligibleError} when the account is not
 * eligible (feature flag off, no on-chain FID, already onboarded, already has a
 * signer, etc.) so callers can fall back to existing behavior.
 */
const useCreateExternalUserSigner = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const invalidateSigners = useInvalidateSigners();
  const invalidateUserAppContext = useInvalidateUserAppContext();

  return useCallback(
    async ({
      account,
      authToken,
    }: {
      account: LocalAccountWithSign;
      // The user's standard session token (already issued by the custody-bearer
      // onboarding refresh before this runs). The two external-user endpoints
      // authenticate via custody bearer, but the key-transaction poll hits the
      // regular `getKeyTransaction` endpoint, which validates a standard session
      // token (with requireWarpcastSigner:false) — NOT the custody bearer. So
      // the poll must use this token, not `headers` below.
      authToken: AuthToken;
    }) => {
      // Custody-bearer auth: the signed payload IS the body.authRequest. The
      // backend recovers the custody address from the EIP-191 signature and
      // derives the FID on-chain — the FID is never trusted from the body.
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });
      const headers = { Authorization: `Bearer ${custodyBearerToken}` };

      // Step 1: get the EIP-712 KeyGateway.Add hash to sign. Idempotent and
      // fail-closed: an ineligible account responds 403 here. Only this step's
      // 403/404 is an eligibility rejection — 403 from later steps (e.g. step 3
      // when the signer already exists after a partial prior attempt) must NOT
      // be treated as ineligible.
      //
      // 404 is treated as not-eligible too: it means the endpoint isn't
      // available (feature not deployed / rolled out), so we can't mint a signer
      // and should degrade to the existing empty-account behavior ("no account
      // found") rather than the retryable "try again" error. Transient failures
      // (429/5xx/network) are rethrown so callers surface a retryable error.
      const {
        data: {
          result: { signerHash, deadline },
        },
      } = await apiClient
        .generateExternalUserSignerHash(
          { authRequest: custodyBearerPayload },
          { headers },
        )
        .catch((error) => {
          if (isHandledFetchError(error) && error.status === 403) {
            // A signer add for this FID is already in flight on-chain. This is
            // transient, not a terminal eligibility rejection — distinguish it so
            // the caller can offer a retry instead of "no account found".
            if (getFirstApiErrorBody(error)?.reason === 'has_pending_signer') {
              throw new ExternalUserSignerPendingError(error.message);
            }
            throw new ExternalUserSignerNotEligibleError(error.message);
          }
          if (isHandledFetchError(error) && error.status === 404) {
            throw new ExternalUserSignerNotEligibleError(error.message);
          }
          throw error;
        });

      // Step 2: sign the hash with the custody account (raw hash, not a
      // personal-message — same primitive as approveSignedKeyRequest).
      const signerSignature = await account.sign({
        hash: signerHash as Hex,
      });

      // Step 3: submit the signed add. Stable idempotency key so a retry
      // within the same deadline window never double-submits.
      const {
        data: {
          result: { keyTransactionId },
        },
      } = await apiClient.createExternalUserSigner(
        {
          signerSignature,
          deadline,
          idempotencyKey: `external-user-signer:${account.address.toLowerCase()}:${deadline}`,
          authRequest: custodyBearerPayload,
        },
        { headers },
      );

      // Step 4: poll the existing key-transaction endpoint until the on-chain
      // add is indexed (or fails). `getKeyTransaction` authenticates with the
      // standard session token (requireWarpcastSigner:false) — NOT the custody
      // bearer — so pass the user's session token here, not `headers`.
      const keyTransactionHeaders = {
        Authorization: `Bearer ${authToken.secret}`,
      };
      return pollExternalUserSignerKeyTransaction({
        keyTransactionId,
        fetchKeyTransaction: () =>
          queryClient.fetchQuery({
            queryKey: buildKeyTransactionKey({ keyTransactionId }),
            queryFn: buildKeyTransactionFetcher({
              apiClient,
              params: { keyTransactionId },
              headers: keyTransactionHeaders,
            }),
            staleTime: 0,
          }),
        invalidateSigners,
        invalidateUserAppContext,
      });
    },
    [apiClient, queryClient, invalidateSigners, invalidateUserAppContext],
  );
};

export { pollExternalUserSignerKeyTransaction, useCreateExternalUserSigner };
