import { Switch } from '@headlessui/react';
import cn from 'classnames';

type ToggleProps = {
  label: string;
  description: React.ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void | Promise<void>;
  labelClassName?: string;
  disabled?: boolean;
};

const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  value,
  onValueChange,
  labelClassName,
  disabled = false,
}) => {
  return (
    <Switch.Group
      as="div"
      className="flex w-full items-center justify-between gap-2"
    >
      <span className="flex grow flex-col">
        <Switch.Label
          as="span"
          className={labelClassName || 'font-semibold text-default'}
          passive
        >
          {label}
        </Switch.Label>
        <Switch.Description as="span" className="text-sm text-muted">
          {description}
        </Switch.Description>
      </span>
      <Switch
        checked={value}
        onChange={() => {
          if (!disabled) {
            onValueChange(!value);
          }
        }}
        className={cn(
          value ? 'bg-action-primary' : 'bg-toggle-inactive',
          'focus:outline-hidden relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ring-0 transition-colors duration-200 ease-in-out',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            value ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          )}
        />
      </Switch>
    </Switch.Group>
  );
};

export { Toggle };
