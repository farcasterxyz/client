import { XIcon } from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';

const InfoPopover = ({
  trigger,
  content,
}: {
  trigger: React.ReactNode;
  content?: React.ReactNode;
}): React.ReactNode => {
  if (!content) {
    return <>{trigger}</>;
  }
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div className="cursor-pointer">{trigger}</div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="min-w-[200px] max-w-[500px] rounded border p-5 bg-app border-faint"
          sideOffset={5}
        >
          <div className="flex flex-col text-sm">{content}</div>
          <Popover.Close
            className="outline-hidden absolute right-[5px] top-[5px] inline-flex size-[12px] cursor-pointer items-center justify-center rounded-full"
            aria-label="Close"
          >
            <XIcon />
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export { InfoPopover };
