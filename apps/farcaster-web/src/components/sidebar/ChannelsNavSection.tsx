import { ChevronDownIcon, ChevronUpIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { FC } from 'react';

interface ChannelsNavSectionProps {
  icon?: React.ReactNode;
  name: string;
  isFirst: boolean;
  rightComponent?: React.ReactElement;
  children?: React.ReactNode;
  expanded: boolean;
  onSetExpanded: (expanded: boolean) => void;
  scrollable?: boolean;
  grow?: boolean;
}

const ChannelsNavSection: FC<ChannelsNavSectionProps> = ({
  icon,
  name,
  rightComponent,
  children,
  expanded,
  onSetExpanded,
  scrollable = false,
  grow = false,
}) => {
  return (
    <div
      className={cn(
        scrollable &&
          expanded &&
          (grow ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'),
      )}
    >
      <div
        className={cn([
          'mb-0.5 flex cursor-pointer flex-col items-center xl:flex-row xl:pr-[2px]',
          !expanded ? '!mb-2' : undefined,
        ])}
        onClick={() => onSetExpanded(!expanded)}
      >
        <span className="flex flex-row items-center gap-2 text-sm text-faint xl:grow xl:justify-start xl:pl-[6.75px] xl:pr-0.5">
          {icon}
          <span className="flex-1">{name}</span>
          {expanded ? (
            <ChevronUpIcon size={14} />
          ) : (
            <ChevronDownIcon size={14} />
          )}
        </span>
        {rightComponent}
      </div>
      {expanded && (
        <div
          className={cn(
            scrollable &&
              'only-on-hover-scrollbar min-h-0 flex-1 overflow-y-auto',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

ChannelsNavSection.displayName = 'ChannelsNavSection';

export { ChannelsNavSection };
