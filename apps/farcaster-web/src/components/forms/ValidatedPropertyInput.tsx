import { useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput } from '~/components/forms/SelectInput';
import { TagInput } from '~/components/forms/TagInput';
import { TextInput } from '~/components/forms/TextInput';
import { CircleQuestionIcon } from '~/components/icons/CircleQuestionIcon';
import { Tooltip } from '~/components/Tooltip';
import { PropertySchema } from '~/utils/schemaValidationUtils';

type ValidatedPropertyInputProps<T> = {
  schema: PropertySchema<T>;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
};

const ValidatedPropertyInput = <T extends Record<string, unknown>>({
  schema,
  value,
  onChange,
  disabled,
}: ValidatedPropertyInputProps<T>) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [transformedValue, setTransformedValue] = useState<unknown>(value);

  // Check if this field expects an array
  const isArrayField = schema.isArray || false;

  useEffect(() => {
    const newValue = schema.transform ? schema.transform(value) : value;
    setTransformedValue(newValue);
  }, [value, schema]);

  useEffect(() => {
    if (schema.validator) {
      setIsValid(!!schema.validator(value));
    }
  }, [schema.validator, value, schema]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newInputValue = e.target.value;
      let newValue: unknown = newInputValue;

      // If this is an array field, handle comma-separated values
      if (isArrayField) {
        if (newInputValue === '') {
          newValue = undefined;
        } else {
          newValue = newInputValue.split(',').map((v) => v.trim());
        }
      }

      // Apply any custom transformation
      if (schema.transform) {
        newValue = schema.transform(newValue);
      }

      if (newValue === undefined) {
        e.target.value = '';
      } else if (isArrayField) {
        e.target.value = (newValue as string[]).join(',');
      } else {
        e.target.value = newValue as string;
      }

      setTransformedValue(newValue);

      onChange(newValue);
    },
    [isArrayField, setTransformedValue, onChange, schema],
  );

  // Convert array values to comma-separated string for display
  const getDisplayValue = useCallback(() => {
    if (typeof transformedValue === 'undefined' || transformedValue === null) {
      return '';
    }
    if (isArrayField) {
      return (transformedValue as string[]).join(',') || '';
    }
    return (transformedValue as string) || '';
  }, [isArrayField, transformedValue]);

  const isObject =
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const placeholder = useMemo(() => {
    if (schema.placeholder) {
      return schema.placeholder;
    }
    return isArrayField ? 'Enter comma-separated values' : undefined;
  }, [schema.placeholder, isArrayField]);

  const tooltip = useMemo(() => {
    if (!schema.tooltip) {
      return undefined;
    }
    return (
      <Tooltip
        trigger={
          <div className="cursor-help text-faint">
            <CircleQuestionIcon size={14} />
          </div>
        }
        content={
          <div className="px-2 py-1 text-xs text-white">{schema.tooltip}</div>
        }
      />
    );
  }, [schema.tooltip]);

  const inputUi = useMemo(() => {
    if (schema.ui?.type === 'dropdown') {
      return (
        <SelectInput
          choices={[
            { value: '', name: 'No category selected' },
            ...schema.ui.options.map((option) => ({
              value: option,
              name: option,
            })),
          ]}
          value={(value as string) || ''}
          onChange={(e) => {
            const newValue = e.target.value || undefined;
            setTransformedValue(newValue);
            onChange(newValue);
          }}
          disabled={disabled}
        />
      );
    }
    if (schema.ui?.type === 'multi-select') {
      return (
        <TagInput
          value={(value as string[]) || []}
          onChange={(newValue) => {
            setTransformedValue(newValue);
            onChange(newValue);
          }}
          placeholder={placeholder}
          maxSelections={schema.ui.maxSelections}
          disabled={disabled}
        />
      );
    }
    if (schema.ui?.type === 'text') {
      return (
        <TextInput
          onChange={handleChange}
          value={getDisplayValue()}
          autoCapitalize="none"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
        />
      );
    }
    return null;
  }, [
    schema.ui,
    value,
    handleChange,
    placeholder,
    disabled,
    onChange,
    getDisplayValue,
  ]);

  if (isObject) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-row items-center gap-2">
        <div className="text-xs font-medium text-faint">{schema.label}</div>
        {tooltip}
      </div>
      {inputUi}
      <div className="min-h-4 break-words pl-1 pt-1 text-xs">
        {!disabled && schema.validator && !isValid && (
          <div className="break-words text-danger">
            {schema.validationErrors?.(transformedValue).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export { ValidatedPropertyInput };
