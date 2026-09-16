import classNames from 'classnames';
import { FC, InputHTMLAttributes } from 'react';

interface SelectInputOption {
  name: string;
  value: string;
  disabled?: boolean;
}

type SelectInputProps = InputHTMLAttributes<HTMLSelectElement> & {
  choices: SelectInputOption[];
};

const SelectInput: FC<SelectInputProps> = ({ choices, ...props }) => {
  return (
    <select
      className={classNames(
        'w-full rounded border bg-input p-2 text-sm border-default',
        typeof props.value === 'undefined' ? 'text-faint' : 'text-default',
      )}
      {...props}
    >
      {choices.map((choice, index) => (
        <option
          key={index}
          value={choice.value}
          disabled={choice.disabled || false}
        >
          {choice.name}
        </option>
      ))}
    </select>
  );
};

SelectInput.displayName = 'SelectInput';

export { SelectInput, type SelectInputOption };
