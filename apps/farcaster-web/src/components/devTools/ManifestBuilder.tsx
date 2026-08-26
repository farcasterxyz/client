import { ApiDomainFrameConfig } from 'farcaster-client-data';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput } from '~/components/forms/SelectInput';
import { TagInput } from '~/components/forms/TagInput';
import { TextInput } from '~/components/forms/TextInput';
import { CircleQuestionIcon } from '~/components/icons/CircleQuestionIcon';
import { Tooltip } from '~/components/Tooltip';
import { MANIFEST_SECTIONS } from '~/constants/manifestSections';
import { useFarcasterJsonSchema } from '~/hooks/devTools/useFarcasterJsonSchema';
import { PropertySchema } from '~/utils/schemaValidationUtils';

// Clean input field component that renders inputs without built-in labels
const CleanInputField = ({
  schema,
  value,
  onChange,
  disabled,
}: {
  schema: PropertySchema<ApiDomainFrameConfig>;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [transformedValue, setTransformedValue] = useState<unknown>(value);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    let newValue: unknown = newInputValue;

    if (isArrayField) {
      if (newInputValue === '') {
        newValue = undefined;
      } else {
        newValue = newInputValue.split(',').map((v) => v.trim());
      }
    }

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
  };

  const getDisplayValue = useCallback(() => {
    if (typeof transformedValue === 'undefined' || transformedValue === null) {
      return '';
    }
    if (isArrayField) {
      return (transformedValue as string[]).join(',') || '';
    }
    return (transformedValue as string) || '';
  }, [isArrayField, transformedValue]);

  const placeholder = useMemo(() => {
    if (schema.placeholder) {
      return schema.placeholder;
    }
    return isArrayField ? 'Enter comma-separated values' : undefined;
  }, [schema.placeholder, isArrayField]);

  const isObject =
    typeof value === 'object' && value !== null && !Array.isArray(value);

  if (isObject) {
    return null;
  }

  // Render the appropriate input type
  let inputElement = null;

  if (
    schema.ui?.type === 'dropdown' &&
    (value === undefined || isString(value))
  ) {
    const currentValue: string = value ?? '';
    const defaultChoice = { value: '', name: 'No category selected' };
    const optionChoices = schema.ui.options.map((option) => ({
      value: option,
      name: option,
    }));
    const allChoices = [defaultChoice, ...optionChoices];

    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value;
      const newValue = selectedValue === '' ? undefined : selectedValue;
      setTransformedValue(newValue);
      onChange(newValue);
    };

    inputElement = (
      <SelectInput
        choices={allChoices}
        value={currentValue}
        onChange={handleDropdownChange}
        disabled={disabled}
      />
    );
  } else if (
    schema.ui?.type === 'multi-select' &&
    (value === undefined || isArray(value))
  ) {
    // Type-safe handling for multi-select values
    const arrayValue =
      value === undefined
        ? []
        : isArray(value) && value.every((item) => typeof item === 'string')
          ? (value as string[])
          : [];

    inputElement = (
      <TagInput
        value={arrayValue}
        onChange={(newValue) => {
          setTransformedValue(newValue);
          onChange(newValue);
        }}
        placeholder={placeholder}
        maxSelections={schema.ui.maxSelections}
        disabled={disabled}
      />
    );
  } else {
    inputElement = (
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

  return (
    <div>
      {inputElement}
      {/* Validation errors */}
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

const ManifestBuilder = ({
  domain,
  onFrameConfigChanged,
  disabled = false,
  initialFrameConfig,
}: {
  header?: string;
  description?: React.ReactNode | string;
  domain: string | undefined;
  onFrameConfigChanged: (frameConfig: ApiDomainFrameConfig) => void;
  disabled?: boolean;
  initialFrameConfig?: ApiDomainFrameConfig;
}) => {
  const [frameConfig, setFrameConfig] = useState<
    ApiDomainFrameConfig | undefined
  >(undefined);

  useEffect(() => {
    if (frameConfig) {
      onFrameConfigChanged(frameConfig);
    }
  }, [frameConfig, onFrameConfigChanged]);

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <ManifestForm
          disabled={disabled}
          domain={domain}
          onFrameConfigChanged={setFrameConfig}
          initialFrameConfig={initialFrameConfig}
        />
      </div>
    </div>
  );
};

// Accordion section component with smooth animations and connected appearance
const AccordionSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-faint">
      {/* Clean accordion button with better spacing and alignment */}
      {}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-hidden flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-200 hover:bg-overlay-light"
      >
        <h3 className="text-xl font-semibold text-default">{title}</h3>
        <div className="ml-4 shrink-0">
          <svg
            className={`size-5 transition-transform duration-200 text-faint ${
              isOpen ? 'rotate-90' : 'rotate-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>

      {/* Animated content area */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-6 p-6">{children}</div>
      </div>
    </div>
  );
};

// Clean field renderer with custom styling
const CleanFieldRenderer = ({
  schema,
  value,
  onChange,
  disabled,
}: {
  schema: PropertySchema<ApiDomainFrameConfig>;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) => {
  // Create a modified schema with enhanced label styling and tooltip
  const enhancedSchema = {
    ...schema,
  };

  return (
    <div className="space-y-1">
      {/* Improved label structure matching designer's approach */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <label className="text-base font-medium text-default">
            {schema.label}
          </label>
          <p className="font-mono text-xs text-faint">
            <code>{schema.field}</code>
          </p>
        </div>
        {schema.tooltip && (
          <Tooltip
            trigger={
              <div className="ml-2 shrink-0 cursor-help self-start text-faint">
                <CircleQuestionIcon size={16} />
              </div>
            }
            content={
              <div className="max-w-xs px-2 py-1 text-xs text-white">
                {schema.tooltip}
              </div>
            }
          />
        )}
      </div>
      {/* Clean input field without ValidatedPropertyInput's built-in label */}
      <CleanInputField
        schema={enhancedSchema}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

const ManifestForm = ({
  domain,
  onFrameConfigChanged,
  disabled,
  initialFrameConfig,
}: {
  domain: string | undefined;
  onFrameConfigChanged: (frameConfig: ApiDomainFrameConfig) => void;
  disabled?: boolean;
  initialFrameConfig?: ApiDomainFrameConfig;
}) => {
  const [frameConfig, setFrameConfig] = useState<
    ApiDomainFrameConfig | undefined
  >(initialFrameConfig);

  const farcasterJsonSchema = useFarcasterJsonSchema();
  const [schema] = useState(farcasterJsonSchema(true));

  // Reorganize schema into accordion sections using shared configuration
  const organizedSections = useMemo(() => {
    const fieldsByKey = new Map<string, PropertySchema<ApiDomainFrameConfig>>();
    schema.forEach((field) => {
      fieldsByKey.set(field.field as string, field);
    });

    return MANIFEST_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      defaultOpen: true,
      fields: section.fieldKeys
        .map((key) => fieldsByKey.get(key))
        .filter(Boolean) as PropertySchema<ApiDomainFrameConfig>[],
    }));
  }, [schema]);

  useEffect(() => {
    if (frameConfig) {
      onFrameConfigChanged(frameConfig);
    }
  }, [frameConfig, onFrameConfigChanged]);

  useEffect(() => {
    if (initialFrameConfig) {
      setFrameConfig(initialFrameConfig);
    }
  }, [initialFrameConfig]);

  const setDefaultValues = useCallback(
    (domain: string) => {
      if (!domain) {
        return;
      }

      const baseUrl = `https://${domain}`;

      // Set defaults for URLs based on the domain
      const defaultConfig: ApiDomainFrameConfig = {
        name: '',
        version: '1',
        iconUrl: `${baseUrl}/icon.png`,
        homeUrl: baseUrl,
        imageUrl: `${baseUrl}/image.png`,
        buttonTitle: undefined,
        splashImageUrl: `${baseUrl}/splash.png`,
        splashBackgroundColor: undefined,
        webhookUrl: `${baseUrl}/api/webhook`,
      };
      setFrameConfig(defaultConfig);
    },
    [setFrameConfig],
  );

  useEffect(() => {
    if (!initialFrameConfig) {
      if (domain) {
        setDefaultValues(domain);
      } else {
        setFrameConfig(undefined);
      }
    }
  }, [domain, setDefaultValues, initialFrameConfig]);

  const handleFieldChange = useCallback(
    (field: keyof ApiDomainFrameConfig) => (value: unknown) => {
      const newFrameConfig = {
        ...frameConfig,
        name: frameConfig?.name || '',
        version: frameConfig?.version || '1',
        iconUrl: frameConfig?.iconUrl || '',
        homeUrl: frameConfig?.homeUrl || '',
        [field]: value,
      };
      setFrameConfig(newFrameConfig);
    },
    [frameConfig, setFrameConfig],
  );

  return (
    <div className="space-y-6">
      {/* Accordion sections with consistent spacing */}
      <div className="w-full space-y-4">
        {organizedSections.map((section) => (
          <AccordionSection
            key={section.id}
            title={section.title}
            defaultOpen={section.defaultOpen}
          >
            {section.fields.map((fieldSchema) => {
              const onChange = handleFieldChange(
                fieldSchema.field as keyof ApiDomainFrameConfig,
              );
              return (
                <CleanFieldRenderer
                  key={fieldSchema.field as string}
                  schema={fieldSchema}
                  value={frameConfig?.[fieldSchema.field]}
                  onChange={onChange}
                  disabled={disabled}
                />
              );
            })}
          </AccordionSection>
        ))}
      </div>
    </div>
  );
};

export { ManifestBuilder };
