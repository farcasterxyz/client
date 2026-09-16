import { CheckIcon } from '@primer/octicons-react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import classNames from 'classnames';

export type SelectOneOption<T> = {
  value: T;
  title: string;
  subtitle?: string;
};

type SelectOneProps<T extends string> = {
  title?: React.ReactNode;
  options: SelectOneOption<T>[];
  value: T;
  onChange: (newValue: T) => void;
  className?: string;
  bordered?: boolean;
  disabled?: boolean;
};

function SelectOne<T extends string>({
  title,
  options,
  value,
  onChange,
  className,
  bordered = false,
  disabled = false,
}: SelectOneProps<T>) {
  return (
    <div className={className}>
      {!!title && (
        <div className="mb-2 font-semibold text-default">{title}</div>
      )}
      <RadioGroup.Root
        value={value}
        onValueChange={onChange}
        orientation="vertical"
        disabled={disabled}
      >
        <div
          className={classNames(
            'flex flex-col',
            bordered && 'rounded border border-default',
          )}
        >
          {options.map((option, index) => (
            <RadioGroup.Item
              key={option.value}
              value={option.value}
              className="outline-hidden"
            >
              <div
                className={classNames(
                  'flex cursor-pointer flex-row items-center justify-between p-4 text-left border-default text-default',
                  index !== options.length - 1 && 'border-b',
                )}
                key={index}
              >
                {option.subtitle ? (
                  <div className="flex flex-col">
                    <span>{option.title}</span>
                    <span className="pt-[2px] text-sm text-muted">
                      {option.subtitle}
                    </span>
                  </div>
                ) : (
                  <span>{option.title}</span>
                )}
                <div
                  className={classNames(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    value === option.value
                      ? 'bg-action-primary'
                      : 'border bg-transparent border-faint',
                  )}
                >
                  {value === option.value && (
                    <RadioGroup.Indicator asChild>
                      <CheckIcon size={15} className="text-inverted" />
                    </RadioGroup.Indicator>
                  )}
                </div>
              </div>
            </RadioGroup.Item>
          ))}
        </div>
      </RadioGroup.Root>
    </div>
  );
}
SelectOne.displayName = 'SelectOne';

export { SelectOne };
