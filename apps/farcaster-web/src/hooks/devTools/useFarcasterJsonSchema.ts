import { ApiDomainFrameConfig } from 'farcaster-client-data';
import { useCallback } from 'react';

import { REVERSE_MAPPING } from '~/constants/manifestSections';
import {
  FrameCoreDomainFrameConfigSchema,
  RefinedFrameCoreDomainFrameConfigSchema,
} from '~/types/schemas';
import {
  createPropertySchema,
  PropertySchema,
} from '~/utils/schemaValidationUtils';

const useFarcasterJsonSchema = () => {
  return useCallback((recommended = false) => {
    const result = createPropertySchema<ApiDomainFrameConfig>({
      schema: recommended
        ? RefinedFrameCoreDomainFrameConfigSchema
        : FrameCoreDomainFrameConfigSchema,
    });
    const items: PropertySchema<ApiDomainFrameConfig>[] = [];
    for (const property of result) {
      const reverseMapping = REVERSE_MAPPING.get(property.field);
      if (!reverseMapping) {
        continue;
      }
      items.push({
        ...property,
        label: reverseMapping.title,
        placeholder: reverseMapping.placeholder,
        tooltip: reverseMapping.tooltip,
        ui: reverseMapping.ui,
        category: reverseMapping.category,
      });
    }
    return items;
  }, []);
};

export { useFarcasterJsonSchema };
