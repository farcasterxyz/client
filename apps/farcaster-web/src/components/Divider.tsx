import cn from 'classnames';
import { FC, memo } from 'react';

type DividerProps = {
  slim?: boolean;
};

const Divider: FC<DividerProps> = memo(({ slim = false }) => {
  return (
    <div
      className={cn(
        slim ? 'mb-2 mt-1' : 'my-6',
        'w-full border-t border-surface-secondary',
      )}
    />
  );
});

Divider.displayName = 'Divider';

export function Divider2({ text }: { text?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-surface-secondary" />
      </div>
      {text && (
        <div className="relative flex justify-center">
          <span className="px-2 text-sm text-gray-500 bg-app">{text}</span>
        </div>
      )}
    </div>
  );
}

export { Divider };
