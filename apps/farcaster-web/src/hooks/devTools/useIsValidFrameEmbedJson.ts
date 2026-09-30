import {
  ApiFrameActionLaunchFrame,
  ApiFrameEmbedButton,
  ApiFrameEmbedNext,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { validateWithSchema } from '~/utils/schemaValidationUtils';

import {
  useFrameEmbedActionJsonSchema,
  useFrameEmbedButtonJsonSchema,
  useFrameEmbedJsonSchema,
} from './useFrameEmbedJsonSchema';

const useIsValidFrameEmbedJson = () => {
  const frameEmbedJsonSchema = useFrameEmbedJsonSchema();
  const frameEmbedButtonJsonSchema = useFrameEmbedButtonJsonSchema();
  const frameEmbedActionJsonSchema = useFrameEmbedActionJsonSchema();

  return useCallback(
    ({ frameEmbedJson }: { frameEmbedJson: ApiFrameEmbedNext | undefined }) => {
      if (!frameEmbedJson || !frameEmbedJson.button) {
        return false;
      }

      return (
        validateWithSchema(frameEmbedJson, frameEmbedJsonSchema()) &&
        validateWithSchema(
          frameEmbedJson.button as ApiFrameEmbedButton,
          frameEmbedButtonJsonSchema(),
        ) &&
        validateWithSchema(
          frameEmbedJson.button?.action as ApiFrameActionLaunchFrame,
          frameEmbedActionJsonSchema(),
        )
      );
    },
    [
      frameEmbedJsonSchema,
      frameEmbedButtonJsonSchema,
      frameEmbedActionJsonSchema,
    ],
  );
};

export { useIsValidFrameEmbedJson };
