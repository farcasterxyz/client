import {
  actionLaunchFrameSchema,
  actionLaunchMiniAppSchema,
  actionSchema,
  actionViewTokenSchema,
  buttonSchema,
  domainManifestSchema,
  domainMiniAppConfigSchema,
  encodedJsonFarcasterSignatureSchema,
  miniAppEmbedNextSchema,
} from '@farcaster/miniapp-core';
import { Modifier, TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { ValueErrorType } from '@sinclair/typebox/errors';
import { z } from 'zod';

const isZodPipeWithInput = (
  schema: z.ZodType,
): schema is z.ZodPipe<z.ZodType, z.ZodType> => {
  return (
    schema instanceof z.ZodPipe &&
    typeof (schema as { _zod?: { def?: { in?: unknown } } })._zod?.def?.in !==
      'undefined'
  );
};

export const unwrapZodPipeSchema = (schema: z.ZodType): z.ZodType => {
  let currentSchema = schema;
  while (isZodPipeWithInput(currentSchema)) {
    currentSchema = currentSchema._zod.def.in;
  }
  return currentSchema;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getInnerSchema = (schema: z.ZodType): z.ZodObject<any> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unwrapZodPipeSchema(schema) as z.ZodObject<any>;

const baseSchema = getInnerSchema(domainMiniAppConfigSchema);
const baseShape = baseSchema.shape;

const { version: _version, ...baseRefinedShape } = baseShape;

// Create a new schema with required fields
const refinedDomainFrameConfigSchema = z.object({
  ...baseRefinedShape,

  // Opinionated - make these fields required even if they are optional in the manifest schema
  description: z.string().min(1, 'Description is required'),
  primaryCategory: z.string().min(1, 'Primary category is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  splashImageUrl: z
    .string()
    .url('Splash image must be a valid URL')
    .min(1, 'Splash image URL is required'),
  splashBackgroundColor: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      'Splash background color must be a valid hex color',
    )
    .min(1, 'Splash background color is required'),
});

// Apply the same refinements/transforms as the original schema if any

export type WrappedSchema =
  | {
      schemaType: 'typebox';
      schema: TSchema;
    }
  | {
      schemaType: 'zod';
      schema: z.ZodType;
    };

export type ValidationError = {
  type: string;
  message: string;
  value: unknown;
  path: string;
};

export const FrameCoreDomainManifestSchema = {
  schemaType: 'zod',
  schema: domainManifestSchema,
} as WrappedSchema;

export const FrameCoreDomainFrameConfigSchema = {
  schemaType: 'zod',
  schema: domainMiniAppConfigSchema,
} as WrappedSchema;

export const RefinedFrameCoreDomainFrameConfigSchema = {
  schemaType: 'zod',
  schema: refinedDomainFrameConfigSchema,
} as WrappedSchema;

export const FrameCoreEncodedJsonFarcasterSignatureSchema = {
  schemaType: 'zod',
  schema: encodedJsonFarcasterSignatureSchema,
} as WrappedSchema;

export const FrameCoreFrameEmbedNextSchema = {
  schemaType: 'zod',
  schema: miniAppEmbedNextSchema,
} as WrappedSchema;

export const FrameCoreFrameEmbedButtonSchema = {
  schemaType: 'zod',
  schema: buttonSchema,
} as WrappedSchema;

export const FrameCoreFrameEmbedActionSchema = {
  schemaType: 'zod',
  schema: actionSchema,
} as WrappedSchema;

export const FrameCoreFrameEmbedActionLaunchFrameSchema = {
  schemaType: 'zod',
  schema: actionLaunchFrameSchema,
} as WrappedSchema;

export const FrameCoreFrameEmbedActionLaunchMiniAppSchema = {
  schemaType: 'zod',
  schema: actionLaunchMiniAppSchema,
} as WrappedSchema;

export const FrameCoreFrameEmbedActionViewTokenSchema = {
  schemaType: 'zod',
  schema: actionViewTokenSchema,
} as WrappedSchema;

const NAMES_TO_SCHEMAS = {
  FrameCoreDomainManifest: FrameCoreDomainManifestSchema,
  FrameCoreDomainFrameConfig: FrameCoreDomainFrameConfigSchema,
  FrameCoreEncodedJsonFarcasterSignature:
    FrameCoreEncodedJsonFarcasterSignatureSchema,
  FrameCoreFrameEmbedNext: FrameCoreFrameEmbedNextSchema,
  FrameCoreFrameEmbedButton: FrameCoreFrameEmbedButtonSchema,
  FrameCoreFrameEmbedAction: FrameCoreFrameEmbedActionSchema,
  FrameCoreFrameEmbedActionLaunchFrame:
    FrameCoreFrameEmbedActionLaunchFrameSchema,
  FrameCoreFrameEmbedActionViewToken: FrameCoreFrameEmbedActionViewTokenSchema,
};

const ALL_SCHEMAS: WrappedSchema[] = Object.values(NAMES_TO_SCHEMAS);

export const isOptional = (schema: WrappedSchema) => {
  if (schema.schemaType === 'typebox') {
    return schema.schema[Modifier]?.toLowerCase() === 'optional';
  }
  return schema.schema instanceof z.ZodOptional;
};

export const validateSchema = (schema: WrappedSchema, value: unknown) => {
  if (typeof value === 'string') {
    value = value.trim();
  }
  if (typeof value === 'string' && value === '') {
    return isOptional(schema);
  }
  if (value === undefined && isOptional(schema)) {
    return true;
  }

  if (schema.schemaType === 'typebox') {
    const itemValidator = TypeCompiler.Compile(
      schema.schema,
      ALL_SCHEMAS.map((s) =>
        s.schemaType === 'typebox' ? s.schema : undefined,
      ).filter(Boolean) as TSchema[],
    );
    return itemValidator.Check(value);
  } else {
    try {
      schema.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }
};

export const validationErrors = (
  schema: WrappedSchema,
  value: unknown,
): ValidationError[] => {
  if (typeof value === 'string') {
    value = value.trim();
  }
  if (typeof value === 'string' && value === '') {
    return isOptional(schema)
      ? []
      : [
          {
            type: 'required',
            message: 'Value is required',
            value,
            path: '',
          },
        ];
  }
  if (value === undefined && isOptional(schema)) {
    return [];
  }

  if (schema.schemaType === 'typebox') {
    const itemValidator = TypeCompiler.Compile(
      schema.schema,
      ALL_SCHEMAS.map((s) =>
        s.schemaType === 'typebox' ? s.schema : undefined,
      ).filter(Boolean) as TSchema[],
    );
    return Array.from(itemValidator.Errors(value)).map((error) => ({
      type: ValueErrorType[error.type] || 'unknown',
      message: error.message,
      value: error.value,
      path: error.path,
    }));
  } else {
    try {
      schema.schema.parse(value);
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorsByPath = error.issues.reduce<
          Record<string, ValidationError>
        >((acc, err) => {
          const path = err.path.map((segment) => String(segment)).join('.');
          const firstPathSegment = err.path[0];
          if (!acc[path]) {
            acc[path] = {
              type: err.code,
              message: err.message,
              value:
                (typeof firstPathSegment === 'string' ||
                  typeof firstPathSegment === 'number') &&
                err.path.length > 0
                  ? (value as Record<string, unknown>)?.[
                      String(firstPathSegment)
                    ]
                  : value,
              path,
            };
          } else {
            acc[path].message = `${acc[path].message}, ${err.message}`;
          }
          return acc;
        }, {});

        return Object.values(errorsByPath);
      }
      return [
        {
          type: 'unknown',
          message: 'Validation failed',
          value,
          path: '',
        },
      ];
    }
  }
};
