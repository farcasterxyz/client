import classNames from 'classnames';
import React from 'react';
import { createPortal } from 'react-dom';

import { popoverRootId } from '~/constants/popovers';

type AnchorPosition = {
  left: number;
  top: number;
  availableHeight: number;
};

type AnchoredPopoverProps = {
  children: React.ReactNode;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  sideOffset?: number;
  trigger: React.ReactElement;
};

type TriggerElement = React.ReactElement<
  React.HTMLAttributes<HTMLElement> & {
    ref?: React.Ref<HTMLElement>;
  }
>;

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
  children,
  contentClassName,
  onOpenChange,
  open: controlledOpen,
  sideOffset = 4,
  trigger,
}) => {
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [position, setPosition] = React.useState<AnchorPosition | undefined>();
  const open = controlledOpen ?? uncontrolledOpen;
  const popoverPortalContainer =
    document.getElementById(popoverRootId) ??
    document.getElementById('root') ??
    undefined;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (typeof controlledOpen === 'undefined') {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  const updatePosition = React.useCallback(() => {
    const triggerElement = triggerRef.current;
    const contentElement = contentRef.current;

    if (!triggerElement || !contentElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const viewportPadding = 8;
    const contentRect = contentElement.getBoundingClientRect();
    const contentWidth = contentRect.width;
    const contentHeight = contentRect.height;

    const spaceBelow =
      window.innerHeight - triggerRect.bottom - sideOffset - viewportPadding;
    const spaceAbove = triggerRect.top - sideOffset - viewportPadding;

    // Prefer opening below the trigger, but flip above when the content
    // doesn't fit below and there's more room above. This keeps the popover
    // on-screen for triggers pinned to the bottom of the viewport, such as the
    // direct cast composer toolbar.
    const openAbove = contentHeight > spaceBelow && spaceAbove > spaceBelow;

    const top = openAbove
      ? Math.max(viewportPadding, triggerRect.top - sideOffset - contentHeight)
      : triggerRect.bottom + sideOffset;
    const availableHeight = Math.max(0, openAbove ? spaceAbove : spaceBelow);
    const maxLeft = window.innerWidth - contentWidth - viewportPadding;
    const nextPosition = {
      availableHeight,
      left: Math.max(viewportPadding, Math.min(triggerRect.left, maxLeft)),
      top,
    };

    setPosition((previousPosition) => {
      if (
        previousPosition?.left === nextPosition.left &&
        previousPosition.top === nextPosition.top &&
        previousPosition.availableHeight === nextPosition.availableHeight
      ) {
        return previousPosition;
      }

      return nextPosition;
    });
  }, [sideOffset]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition((previousPosition) =>
        typeof previousPosition === 'undefined' ? previousPosition : undefined,
      );
      return;
    }

    updatePosition();
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const handleScroll = (event: Event) => {
      const target = event.target;

      if (target instanceof Node && contentRef.current?.contains(target)) {
        return;
      }

      updatePosition();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);

    // Content such as the emoji picker mounts empty and grows asynchronously,
    // so recompute the position (and flip side if needed) once it has a real
    // size rather than relying on the single initial measurement.
    const contentElement = contentRef.current;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && contentElement
        ? new ResizeObserver(() => updatePosition())
        : undefined;
    resizeObserver?.observe(contentElement as Element);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
      resizeObserver?.disconnect();
    };
  }, [open, setOpen, updatePosition]);

  const originalTriggerRef = (trigger.props as TriggerElement['props']).ref;
  const triggerWithProps = React.cloneElement(trigger as TriggerElement, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      assignRef(originalTriggerRef, node);
    },
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      (trigger.props as React.HTMLAttributes<HTMLElement>).onClick?.(event);

      if (!event.defaultPrevented) {
        setOpen(!open);
      }
    },
  });

  return (
    <>
      {triggerWithProps}
      {open && popoverPortalContainer
        ? createPortal(
            <div
              ref={contentRef}
              className={classNames('fixed', contentClassName)}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              style={
                {
                  '--radix-popover-content-available-height': `${
                    position?.availableHeight ?? 0
                  }px`,
                  left: position?.left ?? 0,
                  top: position?.top ?? 0,
                  visibility: position ? 'visible' : 'hidden',
                } as React.CSSProperties
              }
            >
              {children}
            </div>,
            popoverPortalContainer,
          )
        : null}
    </>
  );
};

export { AnchoredPopover };
