import { XIcon } from '@primer/octicons-react';
import React, { KeyboardEvent, useRef, useState } from 'react';

import { TextInput } from '~/components/forms/TextInput';

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  disabled?: boolean;
};

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Enter comma-separated tags',
  maxSelections = 5,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Check if user typed a comma
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      const newTag = parts[0].trim().toLowerCase();

      if (newTag && !value.includes(newTag) && value.length < maxSelections) {
        onChange([...value, newTag]);
      }

      // Keep any text after the comma
      setInputValue(parts.slice(1).join(',').trimStart());
    } else {
      setInputValue(newValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedValue = inputValue.trim().toLowerCase();

      if (
        trimmedValue &&
        !value.includes(trimmedValue) &&
        value.length < maxSelections
      ) {
        onChange([...value, trimmedValue]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const isMaxReached = value.length >= maxSelections;

  return (
    <div>
      <TextInput
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={
          isMaxReached ? `Maximum ${maxSelections} tags` : placeholder
        }
        disabled={disabled || isMaxReached}
        autoCapitalize="none"
        spellCheck={false}
      />

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((tag) => (
            <div
              key={tag}
              className="flex cursor-pointer items-center rounded-md border px-2 py-1 text-sm bg-overlay-medium border-default"
              onClick={() => !disabled && removeTag(tag)}
            >
              <span className="mr-1">{tag}</span>
              {!disabled && (
                <XIcon size={14} className="text-faint hover:text-default" />
              )}
            </div>
          ))}
        </div>
      )}

      {isMaxReached && (
        <div className="mt-2 text-xs text-warning">
          Maximum {maxSelections} tags allowed
        </div>
      )}
    </div>
  );
};
