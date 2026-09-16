import React from 'react';

import { PropertySchema } from '~/utils/schemaValidationUtils';

const PropertySchemaEntry = <T extends Record<string, unknown>>({
  schemaItem,
  value,
  hideValidation = false,
}: {
  schemaItem: PropertySchema<T>;
  value: unknown;
  hideValidation?: boolean;
}) => {
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  if (isObject && !isArray) {
    return null;
  }

  const isValid = schemaItem.validator ? schemaItem.validator(value) : true;
  const validationErrors = schemaItem.validationErrors?.(value) || [];
  const fieldName = String(schemaItem.field);

  return (
    <div key={fieldName} className="flex border-b border-faint">
      <div
        className={`mr-4 p-4 text-sm sm:truncate md:truncate ${hideValidation ? 'w-1/3' : 'w-1/4'}`}
        title={fieldName}
      >
        {fieldName}
      </div>
      <div
        className={`break-all p-4 text-sm text-muted ${hideValidation ? 'w-2/3' : 'w-1/2'}`}
      >
        {isArray ? (
          <ul className="list-disc pl-4">
            {(value as unknown[]).map((item, index) => (
              <li key={index}>{String(item)}</li>
            ))}
          </ul>
        ) : value ? (
          String(value)
        ) : (
          <span className="italic text-muted opacity-50">not set</span>
        )}
      </div>
      {!hideValidation && (
        <div className="w-1/4 p-4">
          {isValid ? (
            <span className="text-success">✓</span>
          ) : (
            <div className="flex flex-row items-center gap-3">
              <span className="text-danger">✕</span>
              {validationErrors.length > 0 && (
                <ul className="list-disc pl-4">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PropertySchemaTable = <T extends Record<string, unknown>>({
  schema,
  data,
  hideValidation = false,
}: {
  schema: PropertySchema<T>[];
  data: Record<string, unknown> | T;
  hideValidation?: boolean;
}) => {
  return (
    <div className="w-full rounded-lg border border-faint">
      <div className="flex w-full flex-col">
        <div className="flex border-b bg-light-purple border-faint">
          <div
            className={`mr-4 p-4 text-left text-sm font-medium ${hideValidation ? 'w-1/3' : 'w-1/4'}`}
          >
            Property
          </div>
          <div
            className={`p-4 text-left text-sm font-medium ${hideValidation ? 'w-2/3' : 'w-1/2'}`}
          >
            Value
          </div>
          {!hideValidation && (
            <div className="w-1/4 p-4 text-left text-sm font-medium">
              Validation
            </div>
          )}
        </div>
        <div className="flex flex-col">
          {schema.map((schemaItem) => (
            <PropertySchemaEntry
              key={String(schemaItem.field)}
              schemaItem={schemaItem}
              value={(data as T)[schemaItem.field]}
              hideValidation={hideValidation}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { PropertySchemaTable };
