import { ApiDomainFrameConfig } from 'farcaster-client-data';
import { useCallback } from 'react';

import { validateWithSchema } from '~/utils/schemaValidationUtils';

import { useFarcasterJsonSchema } from './useFarcasterJsonSchema';

const useIsValidFarcasterJson = () => {
  const farcasterJsonSchema = useFarcasterJsonSchema();

  return useCallback(
    ({
      farcasterJson,
      recommended,
    }: {
      farcasterJson: ApiDomainFrameConfig | undefined;
      recommended?: boolean;
    }) => {
      if (!farcasterJson) {
        return false;
      }

      return validateWithSchema(
        farcasterJson,
        farcasterJsonSchema(recommended),
      );
    },
    [farcasterJsonSchema],
  );
};

export { useIsValidFarcasterJson };
