import { TSchema } from '@sinclair/typebox';
import { isLocalhostUrl } from 'farcaster-client-data';
import { z } from 'zod';

import {
  isOptional,
  unwrapZodPipeSchema,
  validateSchema,
  validationErrors,
  WrappedSchema,
} from '~/types/schemas';

export type PropertySchemaTextFieldUi = {
  type: 'text';
};

export type PropertySchemaDropdownUi = {
  type: 'dropdown';
  options: string[];
};

export type PropertySchemaMultiSelectUi = {
  type: 'multi-select';
  maxSelections: number;
};

export type PropertySchemaUi =
  | PropertySchemaTextFieldUi
  | PropertySchemaDropdownUi
  | PropertySchemaMultiSelectUi;

export type PropertySchema<T> = {
  label: string;
  field: keyof T;
  validator?: (value: unknown) => boolean;
  validationErrors?: (value: unknown) => string[];
  transform?: (value: unknown) => unknown;
  required?: boolean;
  isArray?: boolean;
  placeholder?: string;
  tooltip?: string;
  ui?: PropertySchemaUi;
  category?: {
    index: number;
    title: string;
  };
};

type PropertySchemaConfig = {
  schema: WrappedSchema;
};

const createPropertyValidator = ({ schema }: PropertySchemaConfig) => {
  return (value: unknown) => {
    const isValid = validateSchema(schema, value);
    if (!isValid) {
      const errors = Array.from(validationErrors(schema, value)).map(
        (error) => error.message,
      );
      if (errors.some((error) => error.includes('https'))) {
        return isLocalhostUrl(value as string);
      }
    }
    if (isOptional(schema) && value === '') {
      return false;
    }
    return isValid;
  };
};

const createPropertyValidationErrors = ({ schema }: PropertySchemaConfig) => {
  return (value: unknown) => {
    if (isOptional(schema) && value === '') {
      return ['Optional fields can be empty string, they must be undefined.'];
    }

    const rawErrors = Array.from(validationErrors(schema, value));

    if (Array.isArray(value)) {
      const result = new Array(value.length).fill('');
      rawErrors.forEach((error) => {
        const pathIndex = Number(error.path[0]);
        if (!isNaN(pathIndex) && pathIndex >= 0 && pathIndex < value.length) {
          result[pathIndex] = error.message;
        }
      });
      return result;
    }

    return rawErrors.map((error) => error.message);
  };
};

const createPropertyTransformer = ({ schema }: PropertySchemaConfig) => {
  return (value: unknown) => {
    if (isOptional(schema)) {
      if (Array.isArray(value)) {
        return value.length === 0 ? undefined : value;
      } else if (typeof value === 'string') {
        return value === '' ? undefined : value;
      } else if (typeof value === 'object') {
        return value === null ? undefined : value;
      }
    }
    return value;
  };
};

const createTypeboxPropertySchema = <T extends Record<string, unknown>>(
  properties: Record<string, TSchema>,
  config: PropertySchemaConfig,
): PropertySchema<T>[] => {
  return Object.entries(properties).map(([key, propertySchema]) => {
    const propertyConfig = {
      ...config,
      schema: { schemaType: 'typebox' as const, schema: propertySchema },
    };
    return {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      field: key as keyof T,
      validator: createPropertyValidator(propertyConfig),
      validationErrors: createPropertyValidationErrors(propertyConfig),
      transform: createPropertyTransformer(propertyConfig),
      required: !isOptional(propertyConfig.schema),
    };
  });
};

const createZodPropertySchema = <T extends Record<string, unknown>>(
  shape: Record<string, z.ZodType>,
  config: PropertySchemaConfig,
): PropertySchema<T>[] => {
  if (!shape) {
    return [];
  }
  return Object.entries(shape).map(([key, propertySchema]) => {
    const propertyConfig = {
      ...config,
      schema: {
        schemaType: 'zod' as const,
        schema: propertySchema,
      },
    };

    // Check if this is an array schema
    let isArray = false;
    let currentSchema: z.ZodType = propertySchema;

    // Unwrap ZodOptional if present
    if (currentSchema instanceof z.ZodOptional) {
      currentSchema = currentSchema.unwrap() as unknown as z.ZodType;
    }

    // Check if it's a ZodArray
    if (currentSchema instanceof z.ZodArray) {
      isArray = true;
    }

    return {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      field: key as keyof T,
      validator: createPropertyValidator(propertyConfig),
      validationErrors: createPropertyValidationErrors(propertyConfig),
      transform: createPropertyTransformer(propertyConfig),
      required: !isOptional(propertyConfig.schema),
      isArray,
    };
  });
};

export const createPropertySchema = <T extends Record<string, unknown>>({
  schema,
}: {
  schema: WrappedSchema;
}): PropertySchema<T>[] => {
  const config = { schema };

  if (schema.schemaType === 'typebox') {
    const properties =
      (schema.schema as { properties?: Record<string, TSchema> }).properties ||
      {};
    return createTypeboxPropertySchema(properties, config);
  } else {
    const zodSchema = unwrapZodPipeSchema(schema.schema);
    const shape = (zodSchema as z.ZodObject<Record<string, z.ZodType>>).shape;
    return createZodPropertySchema(shape, config);
  }
};

export const transformWithSchema = <T extends Record<string, unknown>>(
  target: T | undefined,
  schema: PropertySchema<T>[],
): T | undefined => {
  if (!target) {
    return undefined;
  }
  return schema.reduce<T>((acc, propertySchema) => {
    const transformed = propertySchema.transform
      ? propertySchema.transform(target[propertySchema.field])
      : target[propertySchema.field];
    if (transformed !== undefined) {
      acc[propertySchema.field] = transformed as T[keyof T];
    }
    return acc;
  }, {} as T);
};

export const validateWithSchema = <T extends Record<string, unknown>>(
  target: Record<string, unknown> | undefined,
  schema: PropertySchema<T>[],
): boolean => {
  if (!target) {
    return false;
  }

  return schema.every((propertySchema) => {
    const value = (target as T)[propertySchema.field];

    // We're validating each object separately since we don't support nested schemas yet.
    if (typeof value === 'object') {
      return true;
    }

    return propertySchema.validator ? propertySchema.validator(value) : true;
  });
};
