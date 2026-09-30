import {
  ApiFrameActionLaunchFrame,
  ApiFrameEmbedButton,
  ApiFrameEmbedNext,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  FrameCoreFrameEmbedActionLaunchFrameSchema,
  FrameCoreFrameEmbedActionLaunchMiniAppSchema,
  FrameCoreFrameEmbedButtonSchema,
  FrameCoreFrameEmbedNextSchema,
} from '~/types/schemas';
import { createPropertySchema } from '~/utils/schemaValidationUtils';

const useFrameEmbedJsonSchema = () => {
  return useCallback(() => {
    return createPropertySchema<ApiFrameEmbedNext>({
      schema: FrameCoreFrameEmbedNextSchema,
    });
  }, []);
};

const useFrameEmbedButtonJsonSchema = () => {
  return useCallback(() => {
    return createPropertySchema<ApiFrameEmbedButton>({
      schema: FrameCoreFrameEmbedButtonSchema,
    });
  }, []);
};

const useFrameEmbedActionJsonSchema = () => {
  return useCallback(() => {
    return createPropertySchema<ApiFrameActionLaunchFrame>({
      schema: FrameCoreFrameEmbedActionLaunchFrameSchema,
    });
  }, []);
};

const useFrameEmbedActionLaunchMiniAppJsonSchema = () => {
  return useCallback(() => {
    return createPropertySchema<ApiFrameActionLaunchFrame>({
      schema: FrameCoreFrameEmbedActionLaunchMiniAppSchema,
    });
  }, []);
};

export {
  useFrameEmbedActionJsonSchema,
  useFrameEmbedActionLaunchMiniAppJsonSchema,
  useFrameEmbedButtonJsonSchema,
  useFrameEmbedJsonSchema,
};
