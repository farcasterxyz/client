import * as ToggleGroup from '@radix-ui/react-toggle-group';
import cn from 'classnames';
import { FC, memo } from 'react';

type FilterProps = {
  items: Array<{
    value: string;
    name: string;
    disabled?: boolean;
  }>;
  value?: string | undefined;
  onValueChange?: (value: string) => void;
  onItemMouseOver?: (value: string) => void;
  containerClassName?: string;
  className?: string;
};

const Filter: FC<FilterProps> = memo(
  ({
    value,
    items,
    onValueChange,
    onItemMouseOver,
    containerClassName,
    className,
  }) => {
    return (
      <ToggleGroup.Root
        className={`flex flex-row ${containerClassName}`}
        onValueChange={onValueChange}
        value={value ?? 'default'}
        type="single"
        orientation="horizontal"
      >
        {items.map(({ name, value: itemVal, disabled }) => (
          <ToggleGroup.Item
            key={itemVal}
            value={itemVal}
            disabled={disabled}
            onMouseOver={() => {
              if (onItemMouseOver && !disabled) {
                onItemMouseOver(itemVal);
              }
            }}
            className={cn(
              'mr-[10px] flex h-[32px] min-w-[80px] items-center justify-center rounded-[50px] px-4 text-[15px] font-medium leading-[24px]',
              value === itemVal
                ? 'bg-[#7C65C133] text-[#7c65c1] dark:text-[#ffffff]'
                : 'border border-[#D0D1D259] text-[#546473] bg-app dark:border-[#4C3A4EC0] dark:text-[#8b99a4]',
              className,
            )}
          >
            {name}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    );
  },
);

Filter.displayName = 'Filter';

export { Filter };
