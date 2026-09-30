import { useQueryClient } from '@tanstack/react-query';
import {
  ApiAccountHumanVerification,
  ApiAccountHumanVerificationResult,
  ApiAccountSocialVerification,
  ApiPhoneVerificationDataV1,
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { VerificationsCache } from '../../../types';
import type { LocalAccountWithSign } from '../account';
import { buildAccountVerificationsKey as buildAccountVerificationsKeyV1 } from '../queries/accountVerification/buildAccountVerificationsKey';
import { buildAccountVerificationsKey } from '../queries/accountVerifications/buildAccountVerificationsKey';
import { useInvalidateOnboardingState } from '../queries/onboardingState/useInvalidateOnboardingState';

export const useCompletePhoneVerification = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const invalidateOnboardingState = useInvalidateOnboardingState();

  return useCallback(
    async ({
      phone,
      code,
      account,
    }: {
      phone: string;
      code: string;
      account: LocalAccountWithSign;
    }) => {
      const custodyBearerPayload = buildCustodyBearerPayload();
      const custodyBearerToken = await buildCustodyBearerToken({
        payload: custodyBearerPayload,
        account,
      });

      const { data } = await apiClient.completePhoneVerification(
        {
          phone,
          code,
          authRequest: custodyBearerPayload,
        },
        {
          headers: { Authorization: `Bearer ${custodyBearerToken}` },
        },
      );

      // Wallet geo restriction can be affected by the phone number
      // so we invalidate the onboarding state query to ensure we take the phone verification into account.
      invalidateOnboardingState();

      qc.setQueryData<ApiAccountHumanVerificationResult>(
        buildAccountVerificationsKeyV1(),
        (data) => {
          if (typeof data === 'undefined') {
            return undefined;
          }

          const updatedVerifications = data.verifications.map(
            (verification) => {
              if (verification.type === 'phone') {
                const phoneVerificationData = {
                  version: 'v1',
                  phone: phone,
                } satisfies ApiPhoneVerificationDataV1;

                return {
                  data: phoneVerificationData,
                  maxScore: 0,
                  score: 0,
                  type: 'phone',
                  verificationPending: false,
                  verificationPerformed: true,
                } satisfies ApiAccountHumanVerification;
              }

              return verification;
            },
          );

          return {
            tier1: data.tier1,
            tier2: data.tier2,
            totalScore: data.totalScore,
            verifications: updatedVerifications,
          } satisfies ApiAccountHumanVerificationResult;
        },
      );

      qc.setQueryData<VerificationsCache>(
        buildAccountVerificationsKey(),
        (data) => {
          if (typeof data === 'undefined') {
            return undefined;
          }

          const verifications = Array.from(data.verifications);

          verifications.push({
            type: 'phone',
            metadata: {
              type: 'phone',
              phone: phone,
            },
            error: undefined,
          } satisfies ApiAccountSocialVerification);

          return { verifications: verifications };
        },
      );

      return data.result;
    },
    [apiClient, invalidateOnboardingState, qc],
  );
};
