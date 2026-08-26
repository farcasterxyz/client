import cn from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MAX_WIDTH = 480;
const LIFT_VIEWPORT_PADDING = 16;
const LIFT_DISMISS_POINTER_BUFFER = 150;

type LiftRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type SnapLiftFrameProps = {
  children: ({
    expansionResetKey,
    lifted,
    onBeforeExternalAction,
  }: {
    expansionResetKey: number;
    lifted: boolean;
    onBeforeExternalAction?: () => void;
  }) => React.ReactNode;
  className?: string;
  disabled?: boolean;
  maxWidth?: number;
  width?: number;
};

export const SnapLiftFrame = React.memo(
  ({
    children,
    className,
    disabled = false,
    maxWidth = DEFAULT_MAX_WIDTH,
    width,
  }: SnapLiftFrameProps) => {
    const liftCardRef = useRef<HTMLDivElement>(null);
    const originalContainerRef = useRef<HTMLDivElement>(null);
    const liftTimeoutRef = useRef<number | null>(null);
    const liftSyncAnimationFrameRef = useRef<number | null>(null);
    const lastPointerPositionRef = useRef<{
      x: number;
      y: number;
    } | null>(null);
    const [liftRect, setLiftRect] = useState<LiftRect | null>(null);
    const [expansionResetKey, setExpansionResetKey] = useState(0);

    const clearScheduledLift = useCallback(() => {
      if (liftTimeoutRef.current !== null) {
        window.clearTimeout(liftTimeoutRef.current);
        liftTimeoutRef.current = null;
      }
    }, []);

    const dismissLift = useCallback(() => {
      clearScheduledLift();
      if (liftSyncAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(liftSyncAnimationFrameRef.current);
        liftSyncAnimationFrameRef.current = null;
      }
      lastPointerPositionRef.current = null;
      setLiftRect(null);
      setExpansionResetKey((value) => value + 1);
    }, [clearScheduledLift]);

    useEffect(() => clearScheduledLift, [clearScheduledLift]);

    useEffect(() => {
      if (!liftRect) {
        return;
      }

      const syncLiftRectToOriginalContainer = () => {
        liftSyncAnimationFrameRef.current = null;
        const originalNode = originalContainerRef.current;
        const liftNode = liftCardRef.current;
        if (!originalNode || !liftNode) {
          return;
        }

        const rect = originalNode.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const currentWidth = liftNode.getBoundingClientRect().width;
        const nextLeft = Math.min(
          Math.max(rect.left, LIFT_VIEWPORT_PADDING),
          Math.max(
            LIFT_VIEWPORT_PADDING,
            viewportWidth - currentWidth - LIFT_VIEWPORT_PADDING,
          ),
        );

        liftNode.style.top = `${rect.top}px`;
        liftNode.style.left = `${nextLeft}px`;
      };

      const scheduleLiftRectSync = () => {
        if (liftSyncAnimationFrameRef.current !== null) {
          return;
        }

        liftSyncAnimationFrameRef.current = window.requestAnimationFrame(
          syncLiftRectToOriginalContainer,
        );
      };

      const pointerIsWithinLiftDismissBuffer = () => {
        const pointerPosition = lastPointerPositionRef.current;
        const liftNode = liftCardRef.current;
        if (!pointerPosition || !liftNode) {
          return false;
        }

        const rect = liftNode.getBoundingClientRect();
        return (
          pointerPosition.x >= rect.left - LIFT_DISMISS_POINTER_BUFFER &&
          pointerPosition.x <= rect.right + LIFT_DISMISS_POINTER_BUFFER &&
          pointerPosition.y >= rect.top - LIFT_DISMISS_POINTER_BUFFER &&
          pointerPosition.y <= rect.bottom + LIFT_DISMISS_POINTER_BUFFER
        );
      };

      const handleScroll = () => {
        if (!pointerIsWithinLiftDismissBuffer()) {
          dismissLift();
          return;
        }

        scheduleLiftRectSync();
      };

      const handlePointerMove = (event: PointerEvent) => {
        lastPointerPositionRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          dismissLift();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('pointermove', handlePointerMove, true);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        if (liftSyncAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(liftSyncAnimationFrameRef.current);
          liftSyncAnimationFrameRef.current = null;
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('pointermove', handlePointerMove, true);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [dismissLift, liftRect]);

    const scheduleLift = useCallback(() => {
      if (disabled || liftRect) {
        return;
      }

      const node = liftCardRef.current;
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const maxLiftWidth = Math.max(
        0,
        viewportWidth - LIFT_VIEWPORT_PADDING * 2,
      );
      const nextWidth = Math.min(rect.width, maxLiftWidth);
      const nextLeft = Math.min(
        Math.max(rect.left, LIFT_VIEWPORT_PADDING),
        Math.max(
          LIFT_VIEWPORT_PADDING,
          viewportWidth - nextWidth - LIFT_VIEWPORT_PADDING,
        ),
      );

      clearScheduledLift();
      liftTimeoutRef.current = window.setTimeout(() => {
        liftTimeoutRef.current = null;
        setLiftRect({
          top: rect.top,
          left: nextLeft,
          width: nextWidth,
          height: rect.height,
        });
      }, 0);
    }, [clearScheduledLift, disabled, liftRect]);

    const handleRootClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        lastPointerPositionRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        scheduleLift();
      },
      [scheduleLift],
    );

    const liftStyle: React.CSSProperties | undefined = liftRect
      ? {
          position: 'fixed',
          top: liftRect.top,
          left: liftRect.left,
          width: liftRect.width,
          maxWidth: `calc(100vw - ${LIFT_VIEWPORT_PADDING * 2}px)`,
          zIndex: 2147483001,
        }
      : undefined;

    return (
      <>
        {liftRect ? (
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={(event) => {
              event.stopPropagation();
              dismissLift();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={{ zIndex: 2147483000 }}
          />
        ) : null}
        <div
          ref={originalContainerRef}
          className={cn('rounded-xl', className)}
          onClick={handleRootClick}
          style={width !== undefined ? { width, minWidth: width } : undefined}
        >
          {liftRect ? (
            <div
              aria-hidden="true"
              style={{
                height: liftRect.height,
                width: liftRect.width,
                maxWidth: '100%',
              }}
            />
          ) : null}
          <div
            ref={liftCardRef}
            className={cn(
              'relative max-w-full transition-[filter,transform] duration-150 ease-out',
              liftRect && 'snap-embed-lifted rounded-xl bg-app',
            )}
            style={{
              width: Math.min(width ?? maxWidth, maxWidth),
              ...liftStyle,
            }}
          >
            {children({
              expansionResetKey,
              lifted: liftRect !== null,
              onBeforeExternalAction: disabled ? undefined : dismissLift,
            })}
          </div>
        </div>
      </>
    );
  },
);

SnapLiftFrame.displayName = 'SnapLiftFrame';
